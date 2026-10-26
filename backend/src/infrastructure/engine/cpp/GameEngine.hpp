/**
 * @file GameEngine.hpp
 * @brief Server-authoritative simulation for one multiplayer Pacman game.
 */
#ifndef GAME_ENGINE_HPP
#define GAME_ENGINE_HPP

#include "Maze.hpp"
#include "Actor.hpp"
#include <map>
#include <vector>
#include <string>

/// Serializable snapshot of one player, sent to clients.
struct PlayerState {
    float x, y;
    int dir;    ///< 0 right, 1 down, 2 left, 3 up.
    int score;  ///< 10 points per pellet.
};

/// Serializable snapshot of one ghost, sent to clients.
struct GhostState {
    float x, y;
    int dir;
};

/**
 * @brief One Pacman game: a maze, the players keyed by socket id, and four ghosts.
 *
 * Players move only when the client sends a move (movePlayer); ghosts move on
 * every tick(). The Node side (see binding.cpp) calls tick() at ~20 Hz and
 * broadcasts getState() to the room.
 *
 * The engine owns its Actor objects, so it is non-copyable.
 */
class GameEngine {
public:
    /// Creates the maze and spawns four ghosts; seeds `std::rand` from the clock.
    GameEngine();
    ~GameEngine();

    GameEngine(const GameEngine&) = delete;
    GameEngine& operator=(const GameEngine&) = delete;

    /// Adds a player at the top-left spawn tile with score 0. Re-adding an id resets it.
    void addPlayer(const std::string& id);

    /// Removes a player; unknown ids are ignored.
    void removePlayer(const std::string& id);

    /**
     * @brief Moves a player one step (0.15 tiles) and eats the pellet under it.
     *
     * The move is rejected if the leading edge of the player (0.4 tiles from
     * its centre) would enter a wall. Unknown ids are ignored.
     *
     * @param id  Player id (socket id).
     * @param dir 0 right, 1 down, 2 left, 3 up.
     */
    void movePlayer(const std::string& id, int dir);

    /// Advances every ghost one step; a ghost that hits a wall picks a random direction.
    void tick();

    /// Full snapshot of the game, converted to a JS object by the binding.
    struct GameState {
        std::map<std::string, PlayerState> players;
        std::vector<GhostState> ghosts;
        std::vector<std::vector<int>> maze;  ///< Indexed `[y][x]`, see Maze.
    };

    /// @return A copy of the current state.
    GameState getState() const;

private:
    Maze maze;
    std::map<std::string, Actor*> players;
    std::vector<Actor*> ghosts;
    std::map<std::string, int> scores;

    void updateMonster(Actor* ghost);
};

#endif
