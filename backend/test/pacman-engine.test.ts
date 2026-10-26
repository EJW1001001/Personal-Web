import { describe, expect, it } from 'vitest';
import { Direction, loadPacmanEngine, parseDirection } from '../src/infrastructure/engine/cpp/pacman-engine.js';

describe('parseDirection', () => {
  it('maps client direction names to the engine codes', () => {
    expect(parseDirection('right')).toBe(Direction.Right);
    expect(parseDirection('down')).toBe(Direction.Down);
    expect(parseDirection('left')).toBe(Direction.Left);
    expect(parseDirection('up')).toBe(Direction.Up);
  });

  it('rejects unknown values instead of defaulting to "right"', () => {
    expect(parseDirection('jump')).toBeNull();
    expect(parseDirection(3)).toBeNull();
    expect(parseDirection(undefined)).toBeNull();
  });
});

describe('loadPacmanEngine', () => {
  it('returns null (and does not throw) when the addon is missing', () => {
    expect(loadPacmanEngine('/nonexistent/pacman_engine.node')).toBeNull();
  });
});

const addon = loadPacmanEngine();

describe.runIf(addon)('native PacmanEngine addon (only when built)', () => {
  it('exposes the engine to JS and scores a pellet on the first move', () => {
    const engine = new addon!();
    engine.addPlayer('a');
    engine.movePlayer('a', Direction.Right);
    const state = engine.getState();
    expect(state.players.a.score).toBe(10);
    expect(state.ghosts).toHaveLength(4);
    expect(state.maze).toHaveLength(15);
  });

  it('throws a TypeError for bad arguments instead of aborting the process', () => {
    const engine = new addon!();
    expect(() => engine.addPlayer(5 as unknown as string)).toThrow(TypeError);
    expect(() => engine.movePlayer('a', 'x' as unknown as Direction)).toThrow(TypeError);
  });
});
