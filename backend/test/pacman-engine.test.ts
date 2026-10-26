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
