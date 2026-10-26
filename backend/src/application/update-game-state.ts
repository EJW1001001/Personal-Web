import { GameOfLifeDomain, type Grid2D } from '../domain/game-of-life.js';

/**
 * Use case: advance a client-supplied 2D Game of Life grid by one generation.
 *
 * @remarks
 * Stateless: the client owns the grid and sends it on every `next_gen` event.
 * Validation of the untrusted payload happens in the controller
 * (`main/server.ts`) before this use case is called.
 */
export class UpdateGameStateUseCase {
  /**
   * @param grid - Current generation.
   * @returns The next generation.
   */
  execute(grid: Grid2D): Grid2D {
    return GameOfLifeDomain.nextGeneration(grid);
  }
}
