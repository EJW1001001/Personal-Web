#ifndef MAZE_HPP
#define MAZE_HPP

#include <vector>

class Maze {
public:
    Maze();
    bool isBlocked(int x, int y) const;
    void eatPellet(int x, int y);
    std::vector<std::vector<int>> getMatrix() const;
    int getWidth() const { return 15; }
    int getHeight() const { return 15; }

private:
    std::vector<std::vector<int>> matrix; // 0: empty, 1: wall, 2: pellet
};

#endif
