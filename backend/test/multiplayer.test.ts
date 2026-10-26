import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'socket.io';
import { MultiplayerUseCase, type NextGenerationEngine } from '../src/application/multiplayer.js';
import type { PacmanEngineConstructor, PacmanEngineInstance } from '../src/infrastructure/engine/cpp/pacman-engine.js';

/** Records every emit / room operation made through the Socket.IO server. */
function fakeIo() {
  const emits: { target: string; event: string; payload?: unknown }[] = [];
  const joins: { socket: string; room: string }[] = [];
  const io = {
    emit: (event: string, payload?: unknown) => emits.push({ target: '*', event, payload }),
    to: (target: string) => ({
      emit: (event: string, payload?: unknown) => emits.push({ target, event, payload }),
    }),
    in: (socket: string) => ({
      socketsJoin: (room: string) => joins.push({ socket, room }),
      socketsLeave: vi.fn(),
    }),
  };
  return { io: io as unknown as Server, emits, joins };
}

function fakePacman() {
  const instances: (PacmanEngineInstance & { moves: [string, number][] })[] = [];
  class FakeEngine implements PacmanEngineInstance {
    moves: [string, number][] = [];
    players: string[] = [];
    constructor() { instances.push(this); }
    addPlayer(id: string) { this.players.push(id); }
    removePlayer() {}
    movePlayer(id: string, dir: number) { this.moves.push([id, dir]); }
    tick() {}
    getState() { return { players: {}, ghosts: [], maze: [[1]] }; }
  }
  return { Engine: FakeEngine as unknown as PacmanEngineConstructor, instances };
}

const noGol: NextGenerationEngine = { getNextGeneration: async g => g };

afterEach(() => vi.useRealTimers());

describe('MultiplayerUseCase - Pacman', () => {
  it('asks the first player to wait', () => {
    const { io, emits } = fakeIo();
    const mp = new MultiplayerUseCase(fakePacman().Engine, noGol);
    mp.addToQueue('a', io);
    expect(emits).toContainEqual({ target: 'a', event: 'waiting_for_opponent', payload: undefined });
  });

  it('pairs two players, joins both to the room and broadcasts state to it', () => {
    vi.useFakeTimers();
    const { io, emits, joins } = fakeIo();
    const { Engine, instances } = fakePacman();
    const mp = new MultiplayerUseCase(Engine, noGol);
    mp.addToQueue('a', io);
    mp.addToQueue('b', io);

    const start = emits.find(e => e.target === 'a' && e.event === 'game_start');
    const roomId = (start?.payload as { roomId: string }).roomId;
    expect(joins).toEqual([{ socket: 'a', room: roomId }, { socket: 'b', room: roomId }]);
    expect(instances).toHaveLength(1);

    vi.advanceTimersByTime(60);
    expect(emits.some(e => e.target === roomId && e.event === 'game_state_update')).toBe(true);
    mp.disconnectPlayer('a', io);
  });

  it('ignores a duplicate join from the same socket', () => {
    const { io } = fakeIo();
    const { Engine, instances } = fakePacman();
    const mp = new MultiplayerUseCase(Engine, noGol);
    mp.addToQueue('a', io);
    mp.addToQueue('a', io);
    expect(instances).toHaveLength(0);
  });

  it('forwards valid moves and ignores invalid directions', () => {
    vi.useFakeTimers();
    const { io } = fakeIo();
    const { Engine, instances } = fakePacman();
    const mp = new MultiplayerUseCase(Engine, noGol);
    mp.addToQueue('a', io);
    mp.addToQueue('b', io);
    mp.handlePlayerMove('a', 'up');
    mp.handlePlayerMove('a', 'sideways');
    expect(instances[0].moves).toEqual([['a', 3]]);
    mp.disconnectPlayer('a', io);
  });

  it('ends the room and notifies the opponent on disconnect', () => {
    vi.useFakeTimers();
    const { io, emits } = fakeIo();
    const mp = new MultiplayerUseCase(fakePacman().Engine, noGol);
    mp.addToQueue('a', io);
    mp.addToQueue('b', io);
    mp.disconnectPlayer('b', io);
    expect(emits.some(e => e.event === 'player_disconnected')).toBe(true);
    const before = emits.length;
    vi.advanceTimersByTime(200);
    expect(emits.length).toBe(before);
  });

  it('reports game_unavailable when the native engine is missing', () => {
    const { io, emits } = fakeIo();
    const mp = new MultiplayerUseCase(null, noGol);
    expect(mp.pacmanAvailable).toBe(false);
    mp.addToQueue('a', io);
    expect(emits[0]).toMatchObject({ target: 'a', event: 'game_unavailable' });
  });
});

describe('MultiplayerUseCase - shared Game of Life', () => {
  it('toggles in-range cells only, with 0/1 values only', () => {
    const { io, emits } = fakeIo();
    const mp = new MultiplayerUseCase(null, noGol);
    mp.handleGolToggle(1, 2, 1, io);
    mp.handleGolToggle(999, 0, 1, io);
    mp.handleGolToggle(0, 0, 7, io);
    expect(mp.golState[1][2]).toBe(1);
    expect(mp.golState[0][0]).toBe(0);
    expect(emits.filter(e => e.event === 'gol_update')).toHaveLength(1);
  });

  it('advances via the engine only while running and resets to empty', async () => {
    const { io } = fakeIo();
    const engine = { getNextGeneration: vi.fn(async () => [[1]]) };
    const mp = new MultiplayerUseCase(null, engine);
    await mp.handleGolNext(io);
    expect(engine.getNextGeneration).not.toHaveBeenCalled();

    vi.useFakeTimers();
    mp.handleGolStart(io);
    await vi.advanceTimersByTimeAsync(210);
    expect(engine.getNextGeneration).toHaveBeenCalledTimes(1);
    expect(mp.golState).toEqual([[1]]);

    mp.handleGolReset(io);
    expect(mp.golState).toHaveLength(50);
    await vi.advanceTimersByTimeAsync(1000);
    expect(engine.getNextGeneration).toHaveBeenCalledTimes(1);
  });

  it('survives engine errors without throwing', async () => {
    const { io } = fakeIo();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mp = new MultiplayerUseCase(null, { getNextGeneration: async () => { throw new Error('boom'); } });
    vi.useFakeTimers();
    mp.handleGolStart(io);
    await vi.advanceTimersByTimeAsync(210);
    mp.handleGolStop();
    expect(errors).toHaveBeenCalled();
    errors.mockRestore();
  });
});
