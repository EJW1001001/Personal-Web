export class GameOfLifeDomain {
  static nextGeneration(grid: number[][]): number[][] {
    const rows = grid.length;
    const cols = grid[0].length;
    const next = grid.map(arr => [...arr]);

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
