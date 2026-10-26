import { existsSync } from 'fs';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameOfLifeBridge, resolvePythonPath } from '../src/infrastructure/engine/python/game-of-life-bridge.js';

const bridges: GameOfLifeBridge[] = [];
const make = (opts: ConstructorParameters<typeof GameOfLifeBridge>[0]) => {
  const b = new GameOfLifeBridge(opts);
  bridges.push(b);
  return b;
};
afterEach(() => {
  bridges.splice(0).forEach(b => b.stop());
  vi.restoreAllMocks();
});

const python = resolvePythonPath();
// The real-engine tests need an interpreter with NumPy (backend/venv).
const hasVenv = existsSync(path.resolve('venv/bin/python3')) || !!process.env.PYTHON_PATH;

describe.runIf(hasVenv)('GameOfLifeBridge with the real Python engine', () => {
  it('returns the next generation of a blinker', async () => {
    const bridge = make({ pythonPath: python, timeoutMs: 10000 });
    const h5 = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
    const v5 = [[0, 0, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 0, 0]];
    expect(await bridge.getNextGeneration(h5)).toEqual(v5);
    expect(await bridge.getNextGeneration(v5)).toEqual(h5);
  });

  it('answers concurrent requests in order, each to its own caller', async () => {
    const bridge = make({ pythonPath: python, timeoutMs: 10000 });
    const a = [[0, 0], [0, 0]];
    const b = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const [ra, rb] = await Promise.all([bridge.getNextGeneration(a), bridge.getNextGeneration(b)]);
    expect(ra).toEqual(a);
    expect(rb).toEqual(b);
  });

  it('rejects with the engine error for an invalid grid and keeps working', async () => {
    const bridge = make({ pythonPath: python, timeoutMs: 10000 });
    await expect(bridge.getNextGeneration([[0, 5]])).rejects.toThrow(/0 or 1/);
    expect(await bridge.getNextGeneration([[0]])).toEqual([[0]]);
  });

  it('handles a grid larger than one stdout chunk (64 KiB)', async () => {
    const bridge = make({ pythonPath: python, timeoutMs: 20000 });
    const big = Array.from({ length: 200 }, () => Array(200).fill(0));
    expect(await bridge.getNextGeneration(big)).toEqual(big);
  });
});

describe('GameOfLifeBridge failure modes', () => {
  it('rejects (instead of crashing the process) when the interpreter does not exist', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const bridge = make({ pythonPath: '/nonexistent/python3', timeoutMs: 5000 });
    await expect(bridge.getNextGeneration([[0]])).rejects.toThrow(/unavailable|exited/);
  });

  it('rejects with a timeout if the engine never answers', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // Fixture engine that reads stdin forever and never writes a response.
    const bridge = make({
      pythonPath: python,
      scriptPath: path.resolve('test/fixtures/silent_engine.py'),
      timeoutMs: 300,
    });
    await expect(bridge.getNextGeneration([[0]])).rejects.toThrow('GOL Engine Timeout');
  });
});

describe('resolvePythonPath', () => {
  it('prefers an explicit path, then PYTHON_PATH', () => {
    expect(resolvePythonPath('/x/python')).toBe('/x/python');
    vi.stubEnv('PYTHON_PATH', '/env/python');
    expect(resolvePythonPath()).toBe('/env/python');
    vi.unstubAllEnvs();
  });
});
