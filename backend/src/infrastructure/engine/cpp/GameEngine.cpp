/**
 * @file GameEngine.cpp
 * @brief Player movement, ghost AI and state snapshots for GameEngine.
 */
#include "GameEngine.hpp"
#include <cstdlib>
#include <ctime>

GameEngine::GameEngine() {
    std::srand(static_cast<unsigned>(std::time(nullptr)));
    ghosts.push_back(new Actor(10.5f, 8.5f, 1));
    ghosts.push_back(new Actor(13.5f, 1.5f, 2));
    ghosts.push_back(new Actor(4.5f, 6.5f, 3));
    // Direction must be 0..3; the original value 4 left this ghost frozen forever.
    ghosts.push_back(new Actor(2.5f, 13.5f, 0));
}

GameEngine::~GameEngine() {
    for (auto& entry : players) delete entry.second;
    for (auto* g : ghosts) delete g;
}

void GameEngine::addPlayer(const std::string& id) {
    removePlayer(id);  // avoid leaking the old Actor if the id is re-added
    players[id] = new Actor(1.5f, 1.5f, 0);
    scores[id] = 0;
}

void GameEngine::removePlayer(const std::string& id) {
    if (players.count(id)) {
        delete players[id];
        players.erase(id);
        scores.erase(id);
    }
}

void GameEngine::movePlayer(const std::string& id, int dir) {
    if (!players.count(id)) return;
    
    Actor* p = players[id];
    float nx = p->getX();
    float ny = p->getY();
    const float step = 0.15f;

    if (dir == 2) nx -= step; // 'left'
    if (dir == 0) nx += step; // 'right'
    if (dir == 3) ny -= step; // 'up'
    if (dir == 1) ny += step; // 'down'

    // Collision check
    int qx = (int)(nx + (dir == 0 ? 0.4f : (dir == 2 ? -0.4f : 0)));
    int qy = (int)(ny + (dir == 1 ? 0.4f : (dir == 3 ? -0.4f : 0)));

    if (!maze.isBlocked(qx, qy)) {
        p->setPosition(nx, ny);
        p->setDir(dir);
        
        // Eat the pellet on the tile the player is in. Positions are
        // continuous with x.5 at a tile centre (see Actor), so the tile is
        // floor(x). Rounding here would eat the pellet of the next tile.
        int gridX = static_cast<int>(nx);
        int gridY = static_cast<int>(ny);
        if (maze.hasPellet(gridX, gridY)) {
            maze.eatPellet(gridX, gridY);
            scores[id] += 10;
        }
    }
}

void GameEngine::updateMonster(Actor* ghost) {
    float x = ghost->getX();
    float y = ghost->getY();
    int dir = ghost->getDir();
    const float step = 0.08f;

    int nextX = (int)(x + (dir == 2 ? -0.4f : (dir == 0 ? 0.4f : 0)));
    int nextY = (int)(y + (dir == 3 ? -0.4f : (dir == 1 ? 0.4f : 0)));

    if (!maze.isBlocked(nextX, nextY)) {
        if (dir == 2) x -= step;
        else if (dir == 0) x += step;
        else if (dir == 3) y -= step;
        else if (dir == 1) y += step;
    } else {
        dir = (std::rand() % 4);
    }

    ghost->setPosition(x, y);
    ghost->setDir(dir);
}

void GameEngine::tick() {
    for (auto* g : ghosts) {
        updateMonster(g);
    }
}

GameEngine::GameState GameEngine::getState() const {
    GameState state;
    for (auto const& [id, p] : players) {
        state.players[id] = { p->getX(), p->getY(), p->getDir(), scores.at(id) };
    }
    for (auto* g : ghosts) {
        state.ghosts.push_back({ g->getX(), g->getY(), g->getDir() });
    }
    state.maze = maze.getMatrix();
    return state;
}
