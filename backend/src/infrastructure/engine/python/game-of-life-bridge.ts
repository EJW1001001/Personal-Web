/**
 * Node <-> Python bridge for the 2D Game of Life NumPy engine.
 *
 * @remarks
 * The Python script (`game_of_life_engine.py`) is started once as a child
 * process and kept alive. Requests and responses are newline-delimited JSON
 * over stdin/stdout, so this class buffers stdout and splits on `\n` (a single
 * `data` event may contain a partial line or several lines).
 *
 * The engine answers strictly in order, so pending requests are kept in a
 * FIFO queue. A request that times out stays in the queue as a "tombstone"
 * until its late answer arrives, so the answer is not given to the next caller.
 *
 * @packageDocumentation
 */
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { Grid2D } from '../../../domain/game-of-life.js';

/** Default time to wait for one generation before rejecting. */
const DEFAULT_TIMEOUT_MS = 2000;

interface PendingRequest {
  resolve: (grid: Grid2D) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
  settled: boolean;
}

/** Options for {@link GameOfLifeBridge}. All paths are resolved from `process.cwd()`. */
export interface GameOfLifeBridgeOptions {
  /** Python interpreter. Defaults to `$PYTHON_PATH`, then `venv/` in the cwd, then `python3`. */
  pythonPath?: string;
  /** Engine script. Defaults to the `game_of_life_engine.py` next to this file's source. */
  scriptPath?: string;
  /** Per-request timeout in milliseconds. */
  timeoutMs?: number;
}

/**
 * Picks the Python interpreter: explicit option, `PYTHON_PATH` env var, the
 * project virtualenv (`backend/venv`) if it exists, or `python3`/`python` on PATH.
 *
 * @param explicit - Interpreter passed by the caller, if any.
 * @returns Path or command name of the interpreter to spawn.
 */
export function resolvePythonPath(explicit?: string): string {
  if (explicit) return explicit;
  if (process.env.PYTHON_PATH) return process.env.PYTHON_PATH;
  const venvPython = process.platform === 'win32'
    ? path.resolve(process.cwd(), 'venv/Scripts/python.exe')
    : path.resolve(process.cwd(), 'venv/bin/python3');
  if (fs.existsSync(venvPython)) return venvPython;
  return process.platform === 'win32' ? 'python' : 'python3';
}

/**
 * Long-lived client for the Python Game of Life engine.
 *
 * @remarks
 * Failures (interpreter missing, NumPy missing, engine crash, timeout) never
 * throw synchronously and never crash the Node process: they reject the
 * returned promise, and the next call tries to restart the engine.
 */
export class GameOfLifeBridge {
  private pythonProcess: ChildProcess | null = null;
  private stdoutBuffer = '';
  private pending: PendingRequest[] = [];
  private readonly pythonPath: string;
  private readonly scriptPath: string;
  private readonly timeoutMs: number;

  /** @param options - See {@link GameOfLifeBridgeOptions}. The process is started lazily on first use. */
  constructor(options: GameOfLifeBridgeOptions = {}) {
    this.pythonPath = resolvePythonPath(options.pythonPath);
    this.scriptPath = options.scriptPath
      ?? path.resolve(process.cwd(), 'src/infrastructure/engine/python/game_of_life_engine.py');
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private startEngine(): void {
    const child = spawn(this.pythonPath, [this.scriptPath]);
    this.pythonProcess = child;
    this.stdoutBuffer = '';

    // Without an 'error' listener a missing interpreter (ENOENT) would be an
    // unhandled 'error' event and would crash the whole server.
    child.on('error', err => {
      console.error(`[GOL Bridge] Could not start Python engine (${this.pythonPath}): ${err.message}`);
      this.handleExit(new Error(`Python engine unavailable: ${err.message}`));
    });

    child.stdout?.on('data', (data: Buffer) => {
      this.stdoutBuffer += data.toString();
      let newline: number;
      while ((newline = this.stdoutBuffer.indexOf('\n')) >= 0) {
        const line = this.stdoutBuffer.slice(0, newline).trim();
        this.stdoutBuffer = this.stdoutBuffer.slice(newline + 1);
        if (line) this.handleLine(line);
      }
    });

    // Writing to a process that failed to start emits EPIPE on stdin.
    child.stdin?.on('error', err => {
      console.error('[GOL Bridge] stdin error:', err.message);
    });

    child.stderr?.on('data', data => {
      console.error('[GOL Python Stderr]', data.toString());
    });

    child.on('close', code => {
      console.log(`[GOL Bridge] Python process exited with code ${code}`);
      this.handleExit(new Error(`Python engine exited with code ${code}`));
    });
  }

  private handleLine(line: string): void {
    const request = this.pending.shift();
    if (!request) {
      console.error('[GOL Bridge] Unexpected output from engine', line);
      return;
    }
    clearTimeout(request.timer);
    if (request.settled) return; // already timed out; drop the late answer
    request.settled = true;

    let response: { grid?: Grid2D; error?: string };
    try {
      response = JSON.parse(line);
    } catch {
      request.reject(new Error(`Failed to parse engine output: ${line}`));
      return;
    }
    if (response.grid) {
      request.resolve(response.grid);
    } else {
      request.reject(new Error(response.error ?? 'Engine returned no grid'));
    }
  }

  private handleExit(reason: Error): void {
    this.pythonProcess = null;
    const pending = this.pending;
    this.pending = [];
    for (const request of pending) {
      clearTimeout(request.timer);
      if (!request.settled) {
        request.settled = true;
        request.reject(reason);
      }
    }
  }

  /**
   * Asks the engine for the next generation of `grid`.
   *
   * @param grid - Current 2D generation (0/1 cells).
   * @returns The next generation.
   * @throws Rejects if the engine cannot be started, reports an error, exits,
   *   or does not answer within the timeout.
   */
  getNextGeneration(grid: Grid2D): Promise<Grid2D> {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess) this.startEngine();

      const request: PendingRequest = {
        resolve,
        reject,
        settled: false,
        timer: setTimeout(() => {
          if (request.settled) return;
          request.settled = true;
          reject(new Error('GOL Engine Timeout'));
        }, this.timeoutMs),
      };
      this.pending.push(request);

      this.pythonProcess?.stdin?.write(JSON.stringify({ command: 'next', grid }) + '\n');
    });
  }

  /** Kills the Python process and rejects any pending request. */
  stop(): void {
    const child = this.pythonProcess;
    this.handleExit(new Error('Engine stopped'));
    child?.kill();
  }
}
