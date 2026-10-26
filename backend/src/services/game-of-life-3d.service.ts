import { GameOfLife3DDomain, type Grid3D } from '../domain/game-of-life-3d.js';

/** Probability that a cell starts alive when the volume is randomised. */
const INITIAL_DENSITY = 0.2;

/**
 * Stateful service that owns the single shared 3D Game of Life volume.
 *
 * @remarks
 * One instance is shared by every WebSocket client (see
 * `controllers/game-of-life-3d.ws.ts`), so all viewers see the same
 * simulation. The service only holds state; the rules live in
 * {@link GameOfLife3DDomain}.
 */
export class GameOfLife3DService {
  private grid: Grid3D;

  /**
   * Creates a randomly seeded volume.
   *
   * @param depth - Number of planes (z axis).
   * @param rows - Rows per plane.
   * @param cols - Columns per row.
   * @param random - Random source in `[0, 1)`; injectable for deterministic tests.
   */
  constructor(
    depth = 16,
    rows = 16,
    cols = 16,
    private readonly random: () => number = Math.random,
  ) {
    this.grid = this.createGrid(depth, rows, cols, () => (this.random() < INITIAL_DENSITY ? 1 : 0));
  }

  /** @returns The current volume (the live internal array, do not mutate). */
  getState(): Grid3D {
    return this.grid;
  }

  /** Advances the simulation by one generation. @returns The new volume. */
  step(): Grid3D {
    this.grid = GameOfLife3DDomain.nextGeneration(this.grid);
    return this.grid;
  }

  /** Re-seeds every cell at random, keeping the dimensions. @returns The new volume. */
  randomize(): Grid3D {
    const [d, r, c] = this.dimensions();
    this.grid = this.createGrid(d, r, c, () => (this.random() < INITIAL_DENSITY ? 1 : 0));
    return this.grid;
  }

  /** Kills every cell, keeping the dimensions. @returns The new volume. */
  clear(): Grid3D {
    const [d, r, c] = this.dimensions();
    this.grid = this.createGrid(d, r, c, () => 0);
    return this.grid;
  }

  private dimensions(): [number, number, number] {
    const d = this.grid.length;
    const r = d > 0 ? this.grid[0].length : 0;
    const c = r > 0 ? this.grid[0][0].length : 0;
    return [d, r, c];
  }

  private createGrid(depth: number, rows: number, cols: number, cell: () => number): Grid3D {
    return Array.from({ length: depth }, () =>
      Array.from({ length: rows }, () => Array.from({ length: cols }, cell)),
    );
  }
}
