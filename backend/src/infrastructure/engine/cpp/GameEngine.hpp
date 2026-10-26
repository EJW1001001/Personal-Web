#ifndef GAME_ENGINE_HPP
#define GAME_ENGINE_HPP

#include "Maze.hpp"
#include "Actor.hpp"
#include <map>
#include <vector>
#include <string>
#include <cmath>

struct PlayerState {
    float x, y;
    int dir;
    int score;
};

struct GhostState {
    float x, y;
    int dir;
};

class GameEngine {
public:
    GameEngine();
    void addPlayer(const std::string& id);
    void removePlayer(const std::string& id);
    void movePlayer(const std::string& id, int dir);
    void tick();
    
    struct GameState {
        std::map<std::string, PlayerState> players;
        std::vector<GhostState> ghosts;
        std::vector<std::vector<int>> maze;
    };

    GameState getState() const;

private:
    Maze maze;
    std::map<std::string, Actor*> players;
    std::vector<Actor*> ghosts;
    std::map<std::string, int> scores;
    
    void updateMonster(Actor* ghost);
};

#endif
