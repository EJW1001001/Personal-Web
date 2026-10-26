import { GameOfLife3DDomain } from "../domain/game-of-life-3d.js";

export class GameOfLife3DService {
  private grid: number[][][];
  constructor(depth = 16, rows = 16, cols = 16) {
    this.grid = Array.from({ length: depth }, () =>
      Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (Math.random() > 0.8 ? 1 : 0))
      )
    );
  }

  getState() {
    return this.grid;
  }

  step() {
    this.grid = GameOfLife3DDomain.nextGeneration(this.grid);
    return this.grid;
  }

  randomize() {
    const d = this.grid.length, r = this.grid[0].length, c = this.grid[0][0].length;
    this.grid = Array.from({ length: d }, () =>
      Array.from({ length: r }, () =>
        Array.from({ length: c }, () => (Math.random() > 0.8 ? 1 : 0))
      )
    );
    return this.grid;
  }

  clear() {
    const d = this.grid.length, r = this.grid[0].length, c = this.grid[0][0].length;
    this.grid = Array.from({ length: d }, () =>
      Array.from({ length: r }, () =>
        Array.from({ length: c }, () => 0)
      )
    );
    return this.grid;
  }
}
