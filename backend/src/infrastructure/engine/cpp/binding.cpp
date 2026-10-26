#include <napi.h>
#include "GameEngine.hpp"

class PacmanAddon : public Napi::ObjectWrap<PacmanAddon> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    PacmanAddon(const Napi::CallbackInfo& info);

private:
    GameEngine engine;

    Napi::Value AddPlayer(const Napi::CallbackInfo& info);
    Napi::Value RemovePlayer(const Napi::CallbackInfo& info);
    Napi::Value MovePlayer(const Napi::CallbackInfo& info);
    Napi::Value Tick(const Napi::CallbackInfo& info);
    Napi::Value GetState(const Napi::CallbackInfo& info);
};

Napi::Object PacmanAddon::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "PacmanEngine", {
        InstanceMethod("addPlayer", &PacmanAddon::AddPlayer),
        InstanceMethod("removePlayer", &PacmanAddon::RemovePlayer),
        InstanceMethod("movePlayer", &PacmanAddon::MovePlayer),
        InstanceMethod("tick", &PacmanAddon::Tick),
        InstanceMethod("getState", &PacmanAddon::GetState)
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("PacmanEngine", func);
    return exports;
}

PacmanAddon::PacmanAddon(const Napi::CallbackInfo& info) : Napi::ObjectWrap<PacmanAddon>(info) {}

Napi::Value PacmanAddon::AddPlayer(const Napi::CallbackInfo& info) {
    std::string id = info[0].As<Napi::String>();
    engine.addPlayer(id);
    return info.Env().Undefined();
}

Napi::Value PacmanAddon::RemovePlayer(const Napi::CallbackInfo& info) {
    std::string id = info[0].As<Napi::String>();
    engine.removePlayer(id);
    return info.Env().Undefined();
}

Napi::Value PacmanAddon::MovePlayer(const Napi::CallbackInfo& info) {
    std::string id = info[0].As<Napi::String>();
    int dir = info[1].As<Napi::Number>().Int32Value();
    engine.movePlayer(id, dir);
    return info.Env().Undefined();
}

Napi::Value PacmanAddon::Tick(const Napi::CallbackInfo& info) {
    engine.tick();
    return info.Env().Undefined();
}

Napi::Value PacmanAddon::GetState(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    auto state = engine.getState();
    Napi::Object result = Napi::Object::New(env);

    Napi::Object players = Napi::Object::New(env);
    for (auto const& [id, p] : state.players) {
        Napi::Object pObj = Napi::Object::New(env);
        pObj.Set("x", p.x);
        pObj.Set("y", p.y);
        pObj.Set("dir", p.dir);
        pObj.Set("score", p.score);
        players.Set(id, pObj);
    }
    result.Set("players", players);

    Napi::Array ghosts = Napi::Array::New(env, state.ghosts.size());
    for (size_t i = 0; i < state.ghosts.size(); ++i) {
        Napi::Object gObj = Napi::Object::New(env);
        gObj.Set("x", state.ghosts[i].x);
        gObj.Set("y", state.ghosts[i].y);
        gObj.Set("dir", state.ghosts[i].dir);
        ghosts.Set(i, gObj);
    }
    result.Set("ghosts", ghosts);
    
    Napi::Array maze = Napi::Array::New(env, state.maze.size());
    for (size_t i = 0; i < state.maze.size(); ++i) {
        Napi::Array row = Napi::Array::New(env, state.maze[i].size());
        for (size_t j = 0; j < state.maze[i].size(); ++j) {
            row.Set(j, state.maze[i][j]);
        }
        maze.Set(i, row);
    }
    result.Set("maze", maze);

    return result;
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return PacmanAddon::Init(env, exports);
}

NODE_API_MODULE(pacman_engine, InitAll)
