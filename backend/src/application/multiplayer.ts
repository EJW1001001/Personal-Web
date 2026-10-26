import { Server } from 'socket.io';
import { createRequire } from 'module';
import path from 'path';
import { GameOfLifeBridge } from '../infrastructure/engine/python/game-of-life-bridge.js';

// Use createRequire to load the native C++ addon
const require = createRequire(import.meta.url);
const enginePath = path.resolve(process.cwd(), 'src/infrastructure/engine/cpp/build/Release/pacman_engine.node');
const { PacmanEngine } = require(enginePath);

interface GameState {
  engine: any;
  status: 'waiting' | 'playing' | 'ended';
  players: string[];
}

export class MultiplayerUseCase {
  private queue: string[] = [];
  private rooms: Map<string, GameState> = new Map(); // roomId -> GameState
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private golBridge: GameOfLifeBridge = new GameOfLifeBridge();

  // Game of Life state
  private golGrid: number[][] = Array(50).fill(0).map(() => Array(50).fill(0));
  private golRunning: boolean = false;
  private golInterval: NodeJS.Timeout | null = null;

  async handleGolNext(io: Server) {
    if (!this.golRunning) return;
    try {
      this.golGrid = await this.golBridge.getNextGeneration(this.golGrid);
      io.emit('gol_update', { grid: this.golGrid });
    } catch (e) {
      console.error('[GOL] Simulation error', e);
    }
  }

  handleGolToggle(x: number, y: number, value: number, io: Server) {
    if (this.golGrid[x] && this.golGrid[x][y] !== undefined) {
      this.golGrid[x][y] = value;
      io.emit('gol_update', { grid: this.golGrid });
    }
  }

  handleGolStart(io: Server) {
    this.golRunning = true;
    if (this.golInterval) clearInterval(this.golInterval);
    this.golInterval = setInterval(() => this.handleGolNext(io), 200);
  }

  handleGolStop() {
    this.golRunning = false;
    if (this.golInterval) clearInterval(this.golInterval);
    this.golInterval = null;
  }

  handleGolReset(io: Server) {
    this.handleGolStop();
    this.golGrid = Array(50).fill(0).map(() => Array(50).fill(0));
    io.emit('gol_update', { grid: this.golGrid });
  }

  addToQueue(socketId: string, io: Server) {
    // ... existing Pacman login
    if (this.queue.includes(socketId)) return;
    this.queue.push(socketId);
    console.log(`[Multiplayer] Player ${socketId} added to queue. Queue size: ${this.queue.length}`);

    if (this.queue.length >= 2) {
      const p1 = this.queue.shift()!;
      const p2 = this.queue.shift()!;
      const roomId = `room_${Date.now()}`;

      const engine = new PacmanEngine();
      engine.addPlayer(p1);
      engine.addPlayer(p2);

      this.rooms.set(roomId, {
        engine,
        status: 'playing',
        players: [p1, p2]
      });

      io.to(p1).emit('game_start', { roomId, opponentId: p2 });
      io.to(p2).emit('game_start', { roomId, opponentId: p1 });

      this.startGameLoop(roomId, io);
    } else {
      io.to(socketId).emit('waiting_for_opponent');
    }
  }

  private startGameLoop(roomId: string, io: Server) {
    const interval = setInterval(() => {
      const room = this.rooms.get(roomId);
      if (!room || room.status !== 'playing') {
        clearInterval(interval);
        return;
      }

      room.engine.tick();
      const state = room.engine.getState();
      
      io.to(roomId).emit('game_state_update', state);
    }, 50); // 20 FPS

    this.intervals.set(roomId, interval);
  }

  handlePlayerMove(socketId: string, dir: string) {
    let dirInt = 0;
    if (dir === 'left') dirInt = 2;
    if (dir === 'right') dirInt = 0;
    if (dir === 'up') dirInt = 3;
    if (dir === 'down') dirInt = 1;

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.includes(socketId)) {
        room.engine.movePlayer(socketId, dirInt);
        break;
      }
    }
  }

  disconnectPlayer(socketId: string, io: Server) {
    this.queue = this.queue.filter(id => id !== socketId);
    
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.includes(socketId)) {
        room.status = 'ended';
        io.to(roomId).emit('player_disconnected');
        this.rooms.delete(roomId);
        const interval = this.intervals.get(roomId);
        if (interval) clearInterval(interval);
        this.intervals.delete(roomId);
        break;
      }
    }
  }
}
