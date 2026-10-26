/**
 * Application use case for the real-time multiplayer features served over
 * Socket.IO: the 2-player Pacman mini-game (native C++ engine) and a shared
 * 2D Game of Life board (Python/NumPy engine).
 *
 * @packageDocumentation
 */
import type { Server } from 'socket.io';
import { GameOfLifeBridge } from '../infrastructure/engine/python/game-of-life-bridge.js';
import {
  loadPacmanEngine,
  parseDirection,
  type PacmanEngineConstructor,
  type PacmanEngineInstance,
} from '../infrastructure/engine/cpp/pacman-engine.js';
import type { Grid2D } from '../domain/game-of-life.js';

/** Side length of the shared 2D Game of Life board. */
const GOL_SIZE = 50;
/** Interval between shared Game of Life generations. */
const GOL_TICK_MS = 200;
/** Interval between Pacman engine ticks (20 FPS). */
const PACMAN_TICK_MS = 50;

interface GameState {
  engine: PacmanEngineInstance;
  status: 'waiting' | 'playing' | 'ended';
  players: string[];
}

/** Minimal next-generation provider; implemented by {@link GameOfLifeBridge}. */
export interface NextGenerationEngine {
  getNextGeneration(grid: Grid2D): Promise<Grid2D>;
}

const emptyGrid = (): Grid2D => Array.from({ length: GOL_SIZE }, () => Array(GOL_SIZE).fill(0));

/**
 * Matchmaking, game loops and shared state for the Socket.IO server.
 *
 * @remarks
 * Pacman: players queue with `join_game`; once two are waiting, a room is
 * created, both sockets join it, and the C++ engine is ticked every
 * {@link PACMAN_TICK_MS} ms with the state broadcast to the room as
 * `game_state_update`. If the native addon is missing, joining players get a
 * `game_unavailable` event instead.
 *
 * Game of Life: one shared 50x50 board for all clients, advanced by the
 * Python engine every {@link GOL_TICK_MS} ms while running and broadcast as
 * `gol_update`.
 */
export class MultiplayerUseCase {
  private queue: string[] = [];
  private rooms: Map<string, GameState> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly PacmanEngine: PacmanEngineConstructor | null;
  private readonly golEngine: NextGenerationEngine;

  private golGrid: Grid2D = emptyGrid();
  private golRunning = false;
  private golInterval: NodeJS.Timeout | null = null;
  private golBusy = false;

  /**
   * @param pacmanEngine - Native engine constructor, or `null` to disable Pacman.
   *   Defaults to loading the compiled addon.
   * @param golEngine - Engine used for shared Game of Life generations.
   *   Defaults to the Python bridge.
   */
  constructor(
    pacmanEngine: PacmanEngineConstructor | null = loadPacmanEngine(),
    golEngine: NextGenerationEngine = new GameOfLifeBridge(),
  ) {
    this.PacmanEngine = pacmanEngine;
    this.golEngine = golEngine;
  }

  /** Whether the native Pacman engine was loaded. */
  get pacmanAvailable(): boolean {
    return this.PacmanEngine !== null;
  }

  /** Current shared Game of Life board. */
  get golState(): Grid2D {
    return this.golGrid;
  }

  /**
   * Advances the shared board one generation and broadcasts it. Skips the
   * tick if the previous generation has not come back yet, so slow engine
   * answers cannot pile up.
   */
  async handleGolNext(io: Server): Promise<void> {
    if (!this.golRunning || this.golBusy) return;
    this.golBusy = true;
    try {
      this.golGrid = await this.golEngine.getNextGeneration(this.golGrid);
      io.emit('gol_update', { grid: this.golGrid });
    } catch (e) {
      console.error('[GOL] Simulation error', e);
    } finally {
      this.golBusy = false;
    }
  }

  /**
   * Sets one cell of the shared board and broadcasts it. Out-of-range
   * coordinates and values other than 0/1 are ignored.
   */
  handleGolToggle(x: number, y: number, value: number, io: Server): void {
    if (value !== 0 && value !== 1) return;
    if (this.golGrid[x] && this.golGrid[x][y] !== undefined) {
      this.golGrid[x][y] = value;
      io.emit('gol_update', { grid: this.golGrid });
    }
  }

  /** Starts (or restarts) the shared simulation loop. */
  handleGolStart(io: Server): void {
    this.golRunning = true;
    if (this.golInterval) clearInterval(this.golInterval);
    this.golInterval = setInterval(() => void this.handleGolNext(io), GOL_TICK_MS);
  }

  /** Pauses the shared simulation loop. */
  handleGolStop(): void {
    this.golRunning = false;
    if (this.golInterval) clearInterval(this.golInterval);
    this.golInterval = null;
  }

  /** Stops the simulation and clears the shared board. */
  handleGolReset(io: Server): void {
    this.handleGolStop();
    this.golGrid = emptyGrid();
    io.emit('gol_update', { grid: this.golGrid });
  }

  /**
   * Adds a socket to the Pacman matchmaking queue and starts a game once two
   * players are waiting.
   */
  addToQueue(socketId: string, io: Server): void {
    if (!this.PacmanEngine) {
      io.to(socketId).emit('game_unavailable', { reason: 'Native Pacman engine is not built on this server' });
      return;
    }
    if (this.queue.includes(socketId)) return;
    this.queue.push(socketId);
    console.log(`[Multiplayer] Player ${socketId} added to queue. Queue size: ${this.queue.length}`);

    if (this.queue.length >= 2) {
      const p1 = this.queue.shift()!;
      const p2 = this.queue.shift()!;
      const roomId = `room_${Date.now()}`;

      const engine = new this.PacmanEngine();
      engine.addPlayer(p1);
      engine.addPlayer(p2);

      this.rooms.set(roomId, { engine, status: 'playing', players: [p1, p2] });

      // Both sockets must be in the room, otherwise the per-room
      // game_state_update broadcast in startGameLoop reaches nobody.
      io.in(p1).socketsJoin(roomId);
      io.in(p2).socketsJoin(roomId);

      io.to(p1).emit('game_start', { roomId, opponentId: p2 });
      io.to(p2).emit('game_start', { roomId, opponentId: p1 });

      this.startGameLoop(roomId, io);
    } else {
      io.to(socketId).emit('waiting_for_opponent');
    }
  }

  private startGameLoop(roomId: string, io: Server): void {
    const interval = setInterval(() => {
      const room = this.rooms.get(roomId);
      if (!room || room.status !== 'playing') {
        clearInterval(interval);
        return;
      }
      room.engine.tick();
      io.to(roomId).emit('game_state_update', room.engine.getState());
    }, PACMAN_TICK_MS);

    this.intervals.set(roomId, interval);
  }

  /**
   * Moves a player in whichever room they are in.
   *
   * @param dir - `'up' | 'down' | 'left' | 'right'`; anything else is ignored.
   */
  handlePlayerMove(socketId: string, dir: unknown): void {
    const dirInt = parseDirection(dir);
    if (dirInt === null) return;
    for (const room of this.rooms.values()) {
      if (room.players.includes(socketId)) {
        room.engine.movePlayer(socketId, dirInt);
        break;
      }
    }
  }

  /**
   * Removes a socket from the queue and ends any game it is part of,
   * notifying the opponent with `player_disconnected`.
   */
  disconnectPlayer(socketId: string, io: Server): void {
    this.queue = this.queue.filter(id => id !== socketId);

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.includes(socketId)) {
        room.status = 'ended';
        io.to(roomId).emit('player_disconnected');
        io.in(roomId).socketsLeave(roomId);
        this.rooms.delete(roomId);
        const interval = this.intervals.get(roomId);
        if (interval) clearInterval(interval);
        this.intervals.delete(roomId);
        break;
      }
    }
  }
}
