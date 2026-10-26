import { GameOfLifeDomain } from '../domain/game-of-life.js';

export class UpdateGameStateUseCase {
  execute(grid: number[][]): number[][] {
    return GameOfLifeDomain.nextGeneration(grid);
  }
}
