import { describe, expect, it } from 'vitest';
import { GameOfLife3DDomain, type Grid3D } from '../src/domain/game-of-life-3d.js';
import { GameOfLife3DService } from '../src/services/game-of-life-3d.service.js';

const empty = (n: number): Grid3D =>
  Array.from({ length: n }, () => Array.from({ length: n }, () => Array(n).fill(0)));

const withCells = (n: number, cells: [number, number, number][]): Grid3D => {
  const g = empty(n);
  for (const [z, r, c] of cells) g[z][r][c] = 1;
  return g;
};

const countAlive = (g: Grid3D) => g.flat(2).reduce((a, b) => a + b, 0);

describe('GameOfLife3DDomain.nextGeneration (B5/S56, toroidal)', () => {
  it('keeps an empty volume empty', () => {
    expect(GameOfLife3DDomain.nextGeneration(empty(4))).toEqual(empty(4));
  });

  it('births a dead cell with exactly 5 neighbours', () => {
    const g = withCells(6, [[1, 1, 1], [1, 1, 2], [1, 1, 3], [1, 3, 1], [1, 3, 3]]);
    expect(GameOfLife3DDomain.nextGeneration(g)[1][2][2]).toBe(1);
  });

  it('does not birth with 4 or 6 neighbours', () => {
    const four = withCells(6, [[1, 1, 1], [1, 1, 2], [1, 1, 3], [1, 3, 1]]);
    expect(GameOfLife3DDomain.nextGeneration(four)[1][2][2]).toBe(0);
    const six = withCells(6, [[1, 1, 1], [1, 1, 2], [1, 1, 3], [1, 3, 1], [1, 3, 2], [1, 3, 3]]);
    expect(GameOfLife3DDomain.nextGeneration(six)[1][2][2]).toBe(0);
  });

  it('keeps a live cell with 5 or 6 neighbours and kills it with 4 or 7', () => {
    const neighbours: [number, number, number][] = [
      [2, 1, 1], [2, 1, 2], [2, 1, 3], [2, 3, 1], [2, 3, 2], [2, 3, 3], [1, 2, 2],
    ];
    const centre: [number, number, number] = [2, 2, 2];
    const at = (k: number) =>
      GameOfLife3DDomain.nextGeneration(withCells(7, [centre, ...neighbours.slice(0, k)]))[2][2][2];
    expect(at(4)).toBe(0);
    expect(at(5)).toBe(1);
    expect(at(6)).toBe(1);
    expect(at(7)).toBe(0);
  });

  it('kills an isolated cell', () => {
    expect(countAlive(GameOfLife3DDomain.nextGeneration(withCells(4, [[1, 1, 1]])))).toBe(0);
  });

  it('wraps across all three axes', () => {
    // Five neighbours of (0,0,0) placed on the far faces only.
    const g = withCells(6, [[5, 0, 0], [0, 5, 0], [0, 0, 5], [5, 5, 5], [5, 5, 0]]);
    expect(GameOfLife3DDomain.nextGeneration(g)[0][0][0]).toBe(1);
  });

  it('does not mutate its input and handles an empty grid', () => {
    const g = withCells(4, [[1, 1, 1]]);
    const copy = structuredClone(g);
    GameOfLife3DDomain.nextGeneration(g);
    expect(g).toEqual(copy);
    expect(GameOfLife3DDomain.nextGeneration([])).toEqual([]);
  });
});

describe('GameOfLife3DService', () => {
  it('creates a volume with the requested dimensions', () => {
    const state = new GameOfLife3DService(3, 4, 5).getState();
    expect(state).toHaveLength(3);
    expect(state[0]).toHaveLength(4);
    expect(state[0][0]).toHaveLength(5);
  });

  it('seeds roughly 20% of cells using the injected random source', () => {
    expect(countAlive(new GameOfLife3DService(4, 4, 4, () => 0.1).getState())).toBe(64);
    expect(countAlive(new GameOfLife3DService(4, 4, 4, () => 0.9).getState())).toBe(0);
  });

  it('clear() empties the volume and keeps its size; randomize() re-seeds it', () => {
    let r = 0.1;
    const svc = new GameOfLife3DService(3, 3, 3, () => r);
    expect(countAlive(svc.clear())).toBe(0);
    expect(svc.getState()).toEqual(empty(3));
    r = 0.0;
    expect(countAlive(svc.randomize())).toBe(27);
  });

  it('step() applies the domain rules', () => {
    const svc = new GameOfLife3DService(4, 4, 4, () => 0.9);
    expect(svc.step()).toEqual(empty(4));
  });
});
