#ifndef ACTOR_HPP
#define ACTOR_HPP

class Actor {
public:
    Actor(float x, float y, int dir) : x(x), y(y), dir(dir) {}
    virtual ~Actor() {}

    float getX() const { return x; }
    float getY() const { return y; }
    int getDir() const { return dir; }

    void setPosition(float nx, float ny) { x = nx; y = ny; }
    void setDir(int ndir) { dir = ndir; }

protected:
    float x, y;
    int dir;
};

#endif
