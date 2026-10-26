import { describe, expect, it } from 'vitest';
import { GameOfLifeDomain, isValidGrid2D, type Grid2D } from '../src/domain/game-of-life.js';
import { UpdateGameStateUseCase } from '../src/application/update-game-state.js';

const empty = (rows: number, cols: number): Grid2D =>
  Array.from({ length: rows }, () => Array(cols).fill(0));

const withCells = (rows: number, cols: number, cells: [number, number][]): Grid2D => {
  const g = empty(rows, cols);
  for (const [r, c] of cells) g[r][c] = 1;
  return g;
};

describe('GameOfLifeDomain.nextGeneration (B3/S23, toroidal)', () => {
  it('keeps an empty board empty', () => {
    expect(GameOfLifeDomain.nextGeneration(empty(4, 4))).toEqual(empty(4, 4));
  });

  it('keeps a block still life unchanged', () => {
    const block = withCells(4, 4, [[1, 1], [1, 2], [2, 1], [2, 2]]);
    expect(GameOfLifeDomain.nextGeneration(block)).toEqual(block);
  });

  it('oscillates a blinker with period 2', () => {
    const h = withCells(5, 5, [[2, 1], [2, 2], [2, 3]]);
    const v = withCells(5, 5, [[1, 2], [2, 2], [3, 2]]);
    expect(GameOfLifeDomain.nextGeneration(h)).toEqual(v);
    expect(GameOfLifeDomain.nextGeneration(v)).toEqual(h);
  });

  it('kills cells by under- and over-population', () => {
    expect(GameOfLifeDomain.nextGeneration(withCells(3, 3, [[1, 1]]))).toEqual(empty(3, 3));
    const plus = withCells(5, 5, [[2, 2], [1, 2], [3, 2], [2, 1], [2, 3]]);
    expect(GameOfLifeDomain.nextGeneration(plus)[2][2]).toBe(0);
  });

  it('wraps neighbours around the edges', () => {
    const split = withCells(5, 5, [[4, 2], [0, 2], [1, 2]]);
    expect(GameOfLifeDomain.nextGeneration(split)).toEqual(withCells(5, 5, [[0, 1], [0, 2], [0, 3]]));
  });

  it('moves a glider one cell diagonally every 4 generations', () => {
    const shape: [number, number][] = [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]];
    let g = withCells(8, 8, shape);
    for (let i = 0; i < 4; i++) g = GameOfLifeDomain.nextGeneration(g);
    expect(g).toEqual(withCells(8, 8, shape.map(([r, c]) => [r + 1, c + 1])));
  });

  it('does not mutate its input and preserves non-square shapes', () => {
    const g = withCells(3, 6, [[1, 1], [1, 2], [1, 3]]);
    const copy = g.map(r => [...r]);
    const next = GameOfLifeDomain.nextGeneration(g);
    expect(g).toEqual(copy);
    expect(next).toHaveLength(3);
    expect(next.every(r => r.length === 6)).toBe(true);
  });

  it('returns an empty copy for an empty grid instead of throwing', () => {
    expect(GameOfLifeDomain.nextGeneration([])).toEqual([]);
    expect(GameOfLifeDomain.nextGeneration([[]])).toEqual([[]]);
  });

  it('agrees with the Python engine on the same blinker (shared contract)', () => {
    const h = withCells(5, 5, [[2, 1], [2, 2], [2, 3]]);
    expect(new UpdateGameStateUseCase().execute(h)).toEqual(GameOfLifeDomain.nextGeneration(h));
  });
});

describe('isValidGrid2D', () => {
  it('accepts rectangular 0/1 grids', () => {
    expect(isValidGrid2D([[0, 1], [1, 0]])).toBe(true);
  });

  it.each([
    ['null', null],
    ['a string', 'grid'],
    ['an empty array', []],
    ['an empty row', [[]]],
    ['a ragged grid', [[0, 1], [0]]],
    ['a non-binary cell', [[0, 2]]],
    ['a string cell', [[0, '1']]],
  ])('rejects %s', (_label, value) => {
    expect(isValidGrid2D(value)).toBe(false);
  });
});
