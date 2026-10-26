/**
 * Loader for the native C++ Pacman engine (`pacman_engine.node`).
 *
 * @remarks
 * The addon is built with node-gyp from `binding.gyp` in this folder. It is
 * optional at runtime: if it has not been built, {@link loadPacmanEngine}
 * returns `null` and the server keeps running with the multiplayer Pacman
 * feature disabled, instead of crashing on import.
 *
 * @packageDocumentation
 */
import { createRequire } from 'module';
import path from 'path';

/** Movement direction codes understood by the C++ engine. */
export enum Direction {
  Right = 0,
  Down = 1,
  Left = 2,
  Up = 3,
}

/** Snapshot returned by `PacmanEngine.getState()` (see `binding.cpp`). */
export interface PacmanState {
  players: Record<string, { x: number; y: number; dir: Direction; score: number }>;
  ghosts: { x: number; y: number; dir: Direction }[];
  /** 15x15 matrix indexed `[y][x]`: 0 empty, 1 wall, 2 pellet. */
  maze: number[][];
}

/** One game instance wrapped by the native `PacmanEngine` class. */
export interface PacmanEngineInstance {
  addPlayer(id: string): void;
  removePlayer(id: string): void;
  movePlayer(id: string, dir: Direction): void;
  tick(): void;
  getState(): PacmanState;
}

/** Constructor exported by the native addon. */
export type PacmanEngineConstructor = new () => PacmanEngineInstance;

// Resolved from the working directory (run the server from backend/), so the
// same path works under tsx (src/) and from a compiled dist/ build.
const DEFAULT_ADDON_PATH = path.resolve(
  process.cwd(),
  'src/infrastructure/engine/cpp/build/Release/pacman_engine.node',
);

/**
 * Tries to load the compiled addon.
 *
 * @param addonPath - Path to the `.node` file. Defaults to `$PACMAN_ENGINE_PATH`
 *   or `src/infrastructure/engine/cpp/build/Release/pacman_engine.node`
 *   relative to the working directory.
 * @returns The `PacmanEngine` constructor, or `null` if the addon is missing
 *   or cannot be loaded (a warning is logged).
 */
export function loadPacmanEngine(
  addonPath: string = process.env.PACMAN_ENGINE_PATH || DEFAULT_ADDON_PATH,
): PacmanEngineConstructor | null {
  try {
    const require = createRequire(import.meta.url);
    const addon = require(addonPath) as { PacmanEngine?: PacmanEngineConstructor };
    return addon.PacmanEngine ?? null;
  } catch (err) {
    console.warn(
      `[Pacman] Native engine not available at ${addonPath} (${(err as Error).message}). ` +
        'Multiplayer Pacman is disabled. Build it with `npm run build:engine`.',
    );
    return null;
  }
}

/**
 * Maps a direction name sent by the client to the engine's numeric code.
 *
 * @param dir - `'up' | 'down' | 'left' | 'right'` (anything else is rejected).
 * @returns The {@link Direction}, or `null` for an unknown value.
 */
export function parseDirection(dir: unknown): Direction | null {
  switch (dir) {
    case 'right': return Direction.Right;
    case 'down': return Direction.Down;
    case 'left': return Direction.Left;
    case 'up': return Direction.Up;
    default: return null;
  }
}
