/**
 * @file Actor.hpp
 * @brief Moving entity (player or ghost) in the Pacman maze.
 */
#ifndef ACTOR_HPP
#define ACTOR_HPP

/**
 * @brief Position and facing direction of a player or ghost.
 *
 * Coordinates are in maze cells and are continuous: an actor at
 * `(x, y)` occupies cell `(floor(x), floor(y))`, and `x.5` is the centre of
 * that cell. Directions use the same codes as the JS side:
 * 0 = right, 1 = down, 2 = left, 3 = up.
 */
class Actor {
public:
    /**
     * @param x   Horizontal position in cells.
     * @param y   Vertical position in cells.
     * @param dir Initial direction code (0..3).
     */
    Actor(float x, float y, int dir) : x(x), y(y), dir(dir) {}
    virtual ~Actor() = default;

    /// @return Horizontal position in cells.
    float getX() const { return x; }
    /// @return Vertical position in cells.
    float getY() const { return y; }
    /// @return Current direction code (0 right, 1 down, 2 left, 3 up).
    int getDir() const { return dir; }

    /// Moves the actor; no collision checking is done here.
    void setPosition(float nx, float ny) { x = nx; y = ny; }
    /// Changes the facing direction.
    void setDir(int ndir) { dir = ndir; }

protected:
    float x, y;
    int dir;
};

#endif
