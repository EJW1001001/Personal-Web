export class GameOfLife3DDomain {
  static nextGeneration(grid: number[][][]): number[][][] {
    const depth = grid.length;
    const rows = grid[0].length;
    const cols = grid[0][0].length;
    const next = grid.map(plane => plane.map(row => [...row]));

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
          // 3D rules: survive with 5/6, born with 5
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
