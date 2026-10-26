import sys
import json
import numpy as np

def next_generation(grid):
    grid = np.array(grid)
    nx_cells, ny_cells = grid.shape
    new_grid = np.copy(grid)
    
    # Efficient neighbor counting using slicing
    neighbors = (
        np.roll(np.roll(grid, 1, 0), 1, 1) + np.roll(np.roll(grid, 1, 0), 0, 1) + np.roll(np.roll(grid, 1, 0), -1, 1) +
        np.roll(np.roll(grid, 0, 0), 1, 1) +                                    np.roll(np.roll(grid, 0, 0), -1, 1) +
        np.roll(np.roll(grid, -1, 0), 1, 1) + np.roll(np.roll(grid, -1, 0), 0, 1) + np.roll(np.roll(grid, -1, 0), -1, 1)
    )
    
    # Apply rules
    birth = (grid == 0) & (neighbors == 3)
    survive = (grid == 1) & ((neighbors == 2) | (neighbors == 3))
    
    new_grid[:] = 0
    new_grid[birth | survive] = 1
    
    return new_grid.tolist()

def main():
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        try:
            data = json.loads(line)
            if data.get('command') == 'next':
                grid = data.get('grid')
                next_grid = next_generation(grid)
                print(json.dumps({'grid': next_grid}))
                sys.stdout.flush()
        except Exception as e:
            print(json.dumps({'error': str(e)}))
            sys.stdout.flush()

if __name__ == "__main__":
    main()
