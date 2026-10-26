// Minimal dependency-free unit tests for Maze and GameEngine (run via CTest).
#include "GameEngine.hpp"
#include "Maze.hpp"

#include <cmath>
#include <iostream>
#include <string>

namespace {
int failures = 0;

void check(bool cond, const std::string& what) {
    if (!cond) {
        std::cerr << "FAIL: " << what << "\n";
        ++failures;
    }
}

int countPellets(const std::vector<std::vector<int>>& m) {
    int n = 0;
    for (const auto& row : m)
        for (int t : row) n += (t == Maze::Pellet);
    return n;
}

constexpr int RIGHT = 0, DOWN = 1, LEFT = 2, UP = 3;

void testMazeBounds() {
    Maze maze;
    check(maze.getWidth() == 15 && maze.getHeight() == 15, "maze is 15x15");
    check(maze.isBlocked(0, 0), "corner is a wall");
    check(!maze.isBlocked(1, 1), "spawn tile is open");
    check(maze.isBlocked(-1, 5) && maze.isBlocked(5, -1) && maze.isBlocked(15, 5) && maze.isBlocked(5, 15),
          "out-of-range tiles are blocked");
    check(!maze.hasPellet(-1, 0) && !maze.hasPellet(99, 99), "out-of-range tiles have no pellet");
}

void testMazeIndexingIsRowMajor() {
    Maze maze;
    // Row 2 is {1,2,1,1,...}: tile (x=2, y=2) is a wall and (x=1, y=2) a pellet.
    check(maze.isBlocked(2, 2), "(2,2) is a wall");
    check(maze.hasPellet(1, 2), "(1,2) is a pellet");
}

void testEatPellet() {
    Maze maze;
    const int before = countPellets(maze.getMatrix());
    maze.eatPellet(1, 1);
    check(!maze.hasPellet(1, 1), "pellet removed");
    check(countPellets(maze.getMatrix()) == before - 1, "exactly one pellet removed");
    maze.eatPellet(1, 1);
    maze.eatPellet(0, 0);   // wall
    maze.eatPellet(-3, 40); // out of range
    check(countPellets(maze.getMatrix()) == before - 1, "eating twice / walls / out of range is a no-op");
}

void testAddAndRemovePlayers() {
    GameEngine engine;
    engine.addPlayer("a");
    engine.addPlayer("b");
    auto s = engine.getState();
    check(s.players.size() == 2, "two players");
    check(s.players.at("a").x == 1.5f && s.players.at("a").y == 1.5f, "spawn at tile centre (1,1)");
    check(s.ghosts.size() == 4, "four ghosts");
    engine.addPlayer("a");  // re-adding resets without leaking
    engine.removePlayer("b");
    engine.removePlayer("nobody");
    check(engine.getState().players.size() == 1, "remove works and unknown ids are ignored");
}

void testMoveRespectsWalls() {
    GameEngine engine;
    engine.addPlayer("p");
    // Up from the spawn is a wall (row 0).
    engine.movePlayer("p", UP);
    check(engine.getState().players.at("p").y == 1.5f, "cannot move into the top wall");
    engine.movePlayer("p", RIGHT);
    auto p = engine.getState().players.at("p");
    check(std::fabs(p.x - 1.65f) < 1e-5f && p.dir == RIGHT, "moves right by one step");
    for (int i = 0; i < 200; ++i) engine.movePlayer("p", RIGHT);
    p = engine.getState().players.at("p");
    check(p.x < 14.0f, "stops before the right wall");
    engine.movePlayer("ghost", LEFT);  // unknown id ignored
}

void testEatsPelletOnOwnTile() {
    GameEngine engine;
    engine.addPlayer("p");
    const int before = countPellets(engine.getState().maze);
    engine.movePlayer("p", RIGHT);  // x = 1.65, still in tile (1,1)
    auto s = engine.getState();
    check(s.players.at("p").score == 10, "eats the pellet of the tile it stands on");
    check(s.maze[1][1] == Maze::Empty, "tile (1,1) is now empty");
    check(s.maze[2][2] == Maze::Wall && s.maze[2][1] == Maze::Pellet,
          "the row below (y=2) is untouched");
    check(countPellets(s.maze) == before - 1, "exactly one pellet eaten");
}

void testWalkingARowEatsThatRow() {
    GameEngine engine;
    engine.addPlayer("p");
    for (int i = 0; i < 200; ++i) engine.movePlayer("p", RIGHT);
    auto s = engine.getState();
    for (int x = 1; x <= 13; ++x) check(s.maze[1][x] == Maze::Empty, "row 1 tile eaten: x=" + std::to_string(x));
    check(s.maze[2][1] == Maze::Pellet, "row 2 pellets are not eaten from row 1");
    check(s.players.at("p").score == 13 * 10, "score is 10 per pellet in row 1");
}

void testEveryGhostMoves() {
    GameEngine engine;
    const auto before = engine.getState().ghosts;
    for (int i = 0; i < 50; ++i) engine.tick();
    const auto after = engine.getState().ghosts;
    for (size_t i = 0; i < before.size(); ++i)
        check(before[i].x != after[i].x || before[i].y != after[i].y || before[i].dir != after[i].dir,
              "ghost " + std::to_string(i) + " is not frozen");
}

void testGhostsStayInsideTheMaze() {
    GameEngine engine;
    for (int i = 0; i < 2000; ++i) engine.tick();
    for (const auto& g : engine.getState().ghosts) {
        check(g.x > 0.0f && g.x < 15.0f && g.y > 0.0f && g.y < 15.0f, "ghost inside maze");
        check(g.dir >= 0 && g.dir <= 3, "ghost direction valid");
    }
}
}  // namespace

int main() {
    testMazeBounds();
    testMazeIndexingIsRowMajor();
    testEatPellet();
    testAddAndRemovePlayers();
    testMoveRespectsWalls();
    testEatsPelletOnOwnTile();
    testWalkingARowEatsThatRow();
    testEveryGhostMoves();
    testGhostsStayInsideTheMaze();
    if (failures == 0) std::cout << "All engine tests passed\n";
    return failures == 0 ? 0 : 1;
}
