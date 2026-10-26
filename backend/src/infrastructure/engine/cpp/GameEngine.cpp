#include "GameEngine.hpp"
#include <cstdlib>
#include <ctime>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

GameEngine::GameEngine() {
    std::srand(std::time(nullptr));
    // Initial monsters based on original code
    ghosts.push_back(new Actor(10.5f, 8.5f, 1));
    ghosts.push_back(new Actor(13.5f, 1.5f, 2));
    ghosts.push_back(new Actor(4.5f, 6.5f, 3));
    ghosts.push_back(new Actor(2.5f, 13.5f, 4));
}

void GameEngine::addPlayer(const std::string& id) {
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
    float step = 0.15f; // Increased speed slightly

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
        
        // Eat pellet
        int gridX = (int)(nx + 0.5f);
        int gridY = (int)(ny + 0.5f);
        if (!maze.isBlocked(gridX, gridY)) {
            auto matrix = maze.getMatrix();
            if (matrix[gridY][gridX] == 2) {
                maze.eatPellet(gridX, gridY);
                scores[id] += 10;
            }
        }
    }
}

void GameEngine::updateMonster(Actor* ghost) {
    float x = ghost->getX();
    float y = ghost->getY();
    int dir = ghost->getDir();
    float step = 0.08f;

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
