/**
 * @file Maze.hpp
 * @brief Fixed 15x15 Pacman maze with walls and pellets.
 */
#ifndef MAZE_HPP
#define MAZE_HPP

#include <vector>

/**
 * @brief Tile map for one Pacman game.
 *
 * The matrix is indexed `[y][x]` (row, column). Tile codes:
 * `0` empty, `1` wall, `2` pellet. Each game owns its own Maze, so eating a
 * pellet only affects that game.
 */
class Maze {
public:
    /// Maze side length in tiles.
    static constexpr int SIZE = 15;

    /// Tile codes stored in the matrix.
    enum Tile { Empty = 0, Wall = 1, Pellet = 2 };

    /// Builds the hard-coded level layout, with a pellet on every open tile.
    Maze();

    /**
     * @brief Whether an actor may not enter tile `(x, y)`.
     * @return `true` for walls and for any coordinate outside the maze.
     */
    bool isBlocked(int x, int y) const;

    /**
     * @brief Whether tile `(x, y)` holds a pellet.
     * @return `false` for coordinates outside the maze.
     */
    bool hasPellet(int x, int y) const;

    /**
     * @brief Removes the pellet at `(x, y)`.
     * Does nothing if the tile is out of range or holds no pellet.
     */
    void eatPellet(int x, int y);

    /// @return A copy of the tile matrix, indexed `[y][x]`.
    std::vector<std::vector<int>> getMatrix() const;

    /// @return Width in tiles.
    int getWidth() const { return SIZE; }
    /// @return Height in tiles.
    int getHeight() const { return SIZE; }

private:
    std::vector<std::vector<int>> matrix;
};

#endif
