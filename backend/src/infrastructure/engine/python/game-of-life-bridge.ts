import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export class GameOfLifeBridge {
  private pythonProcess: ChildProcess | null = null;
  private resolveNext: ((grid: number[][]) => void) | null = null;

  constructor() {
    this.startEngine();
  }

  private startEngine() {
    const scriptPath = path.resolve(process.cwd(), 'src/infrastructure/engine/python/game_of_life_engine.py');
    const venvPythonPath = process.platform === 'win32'
      ? path.resolve(process.cwd(), 'venv/Scripts/python.exe')
      : path.resolve(process.cwd(), 'venv/bin/python3');

    this.pythonProcess = spawn(venvPythonPath, [scriptPath]);

    this.pythonProcess.stdout?.on('data', (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.grid && this.resolveNext) {
          this.resolveNext(response.grid);
          this.resolveNext = null;
        } else if (response.error) {
          console.error('[GOL Engine Error]', response.error);
        }
      } catch (e) {
        console.error('[GOL Bridge] Failed to parse output', data.toString());
      }
    });

    this.pythonProcess.stderr?.on('data', (data) => {
      console.error('[GOL Python Stderr]', data.toString());
    });

    this.pythonProcess.on('close', (code) => {
      console.log(`[GOL Bridge] Python process exited with code ${code}`);
      this.pythonProcess = null;
    });
  }

  async getNextGeneration(grid: number[][]): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess) {
        this.startEngine();
      }

      const timeout = setTimeout(() => {
        reject(new Error('GOL Engine Timeout'));
      }, 2000);

      this.resolveNext = (newGrid) => {
        clearTimeout(timeout);
        resolve(newGrid);
      };

      this.pythonProcess?.stdin?.write(JSON.stringify({ command: 'next', grid }) + '\n');
    });
  }

  stop() {
    this.pythonProcess?.kill();
    this.pythonProcess = null;
  }
}
