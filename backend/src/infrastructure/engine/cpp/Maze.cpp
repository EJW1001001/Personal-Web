/**
 * @file Maze.cpp
 * @brief Level layout and tile queries for Maze.
 */
#include "Maze.hpp"

Maze::Maze() {
    matrix = {
        {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1},
        {1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1},
        {1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1},
        {1, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 2, 1, 2, 1},
        {1, 2, 1, 1, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 1},
        {1, 2, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 1, 2, 1},
        {1, 1, 2, 2, 2, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1},
        {1, 1, 1, 1, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 1},
        {1, 1, 2, 2, 2, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1},
        {1, 2, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 1, 2, 1},
        {1, 2, 1, 1, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 1},
        {1, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2, 2, 1, 2, 1},
        {1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1},
        {1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1},
        {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1}
    };
}

namespace {
bool inBounds(int x, int y) {
    return x >= 0 && x < Maze::SIZE && y >= 0 && y < Maze::SIZE;
}
}  // namespace

bool Maze::isBlocked(int x, int y) const {
    if (!inBounds(x, y)) return true;
    return matrix[y][x] == Wall;
}

bool Maze::hasPellet(int x, int y) const {
    return inBounds(x, y) && matrix[y][x] == Pellet;
}

void Maze::eatPellet(int x, int y) {
    if (hasPellet(x, y)) {
        matrix[y][x] = Empty;
    }
}

std::vector<std::vector<int>> Maze::getMatrix() const {
    return matrix;
}
