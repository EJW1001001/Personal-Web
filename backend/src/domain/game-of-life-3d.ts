/**
 * Pure domain logic for a 3D variant of the Game of Life.
 *
 * @remarks
 * In 3D every cell has 26 neighbours instead of 8, so Conway's B3/S23 rules
 * make every pattern explode or die immediately. This variant uses
 * **B5/S56**: a dead cell is born with exactly 5 live neighbours and a live
 * cell survives with 5 or 6. The volume wraps on all three axes (3-torus).
 *
 * @packageDocumentation
 */

/** A 3D grid indexed as `grid[z][row][col]`; `1` is alive and `0` is dead. */
export type Grid3D = number[][][];

/**
 * 3D Game of Life rules (B5/S56) on a toroidal volume.
 */
export class GameOfLife3DDomain {
  /**
   * Computes the next generation of a 3D grid.
   *
   * @param grid - Current generation. It is not mutated.
   * @returns A new grid with the same dimensions. An empty grid is returned
   *   as an empty copy instead of throwing.
   */
  static nextGeneration(grid: Grid3D): Grid3D {
    const depth = grid.length;
    const rows = depth > 0 ? grid[0].length : 0;
    const cols = rows > 0 ? grid[0][0].length : 0;
    const next = grid.map(plane => plane.map(row => [...row]));
    if (depth === 0 || rows === 0 || cols === 0) return next;

    for (let z = 0; z < depth; z++) {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          let neighbors = 0;
          for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                if (dz === 0 && dx === 0 && dy === 0) continue;
                const nz = (z + dz + depth) % depth;
                const ni = (i + dx + rows) % rows;
                const nj = (j + dy + cols) % cols;
                neighbors += grid[nz][ni][nj];
              }
            }
          }
          if (grid[z][i][j] === 1 && (neighbors < 5 || neighbors > 6)) {
            next[z][i][j] = 0;
          } else if (grid[z][i][j] === 0 && neighbors === 5) {
            next[z][i][j] = 1;
          }
        }
      }
    }
    return next;
  }
}
