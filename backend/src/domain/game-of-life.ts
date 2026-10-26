/**
 * Pure domain logic for Conway's classic 2D Game of Life.
 *
 * @remarks
 * This module has no I/O and no framework dependencies so that it can be unit
 * tested in isolation and reused by any application service. The grid is a
 * torus: cells on one edge are neighbours of the cells on the opposite edge.
 *
 * @packageDocumentation
 */

/** A 2D grid of cells indexed as `grid[row][col]`; `1` is alive and `0` is dead. */
export type Grid2D = number[][];

/**
 * Conway's Game of Life rules (B3/S23) on a toroidal 2D grid.
 */
export class GameOfLifeDomain {
  /**
   * Computes the next generation of a 2D grid.
   *
   * A live cell survives with 2 or 3 live neighbours; a dead cell becomes
   * alive with exactly 3. All other cells die or stay dead.
   *
   * @param grid - Current generation. It is not mutated.
   * @returns A new grid with the same dimensions. An empty grid (no rows, or
   *   rows with no columns) is returned as an empty copy instead of throwing.
   */
  static nextGeneration(grid: Grid2D): Grid2D {
    const rows = grid.length;
    const cols = rows > 0 ? grid[0].length : 0;
    if (rows === 0 || cols === 0) return grid.map(row => [...row]);

    const next = grid.map(row => [...row]);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let neighbors = 0;
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            if (x === 0 && y === 0) continue;
            const ni = (i + x + rows) % rows;
            const nj = (j + y + cols) % cols;
            neighbors += grid[ni][nj];
          }
        }

        if (grid[i][j] === 1 && (neighbors < 2 || neighbors > 3)) {
          next[i][j] = 0;
        } else if (grid[i][j] === 0 && neighbors === 3) {
          next[i][j] = 1;
        }
      }
    }
    return next;
  }
}

/**
 * Checks that an untrusted value (for example a payload received over a
 * socket) is a non-empty rectangular 2D grid whose cells are all `0` or `1`.
 *
 * @param value - Value to validate.
 * @returns `true` when `value` can be passed safely to
 *   {@link GameOfLifeDomain.nextGeneration}.
 */
export function isValidGrid2D(value: unknown): value is Grid2D {
  if (!Array.isArray(value) || value.length === 0) return false;
  const first = value[0];
  if (!Array.isArray(first) || first.length === 0) return false;
  const cols = first.length;
  return value.every(
    row => Array.isArray(row) && row.length === cols && row.every(cell => cell === 0 || cell === 1),
  );
}
