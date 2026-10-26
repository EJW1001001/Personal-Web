/**
 * @file binding.cpp
 * @brief N-API (node-addon-api) wrapper exposing GameEngine to Node as `PacmanEngine`.
 *
 * JS usage (see `pacman-engine.ts` for the TypeScript types):
 * @code
 * const { PacmanEngine } = require('./build/Release/pacman_engine.node');
 * const engine = new PacmanEngine();
 * engine.addPlayer(socketId);
 * engine.movePlayer(socketId, 0);   // 0 right, 1 down, 2 left, 3 up
 * engine.tick();
 * const { players, ghosts, maze } = engine.getState();
 * @endcode
 *
 * Built with `NAPI_DISABLE_CPP_EXCEPTIONS`, so wrong argument types throw a
 * JS `TypeError` via explicit checks instead of C++ exceptions.
 */
#include <napi.h>
#include "GameEngine.hpp"

/**
 * @brief JS class `PacmanEngine`; each JS instance owns one GameEngine.
 */
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

/// Registers the `PacmanEngine` class on the module exports.
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

namespace {
/// Throws a JS TypeError and returns true if `info[index]` is not a string.
bool rejectNonString(const Napi::CallbackInfo& info, size_t index) {
    if (info.Length() > index && info[index].IsString()) return false;
    Napi::TypeError::New(info.Env(), "Expected a string player id").ThrowAsJavaScriptException();
    return true;
}
}  // namespace

/// `addPlayer(id: string): void`
Napi::Value PacmanAddon::AddPlayer(const Napi::CallbackInfo& info) {
    if (rejectNonString(info, 0)) return info.Env().Undefined();
    std::string id = info[0].As<Napi::String>();
    engine.addPlayer(id);
    return info.Env().Undefined();
}

/// `removePlayer(id: string): void`
Napi::Value PacmanAddon::RemovePlayer(const Napi::CallbackInfo& info) {
    if (rejectNonString(info, 0)) return info.Env().Undefined();
    std::string id = info[0].As<Napi::String>();
    engine.removePlayer(id);
    return info.Env().Undefined();
}

/// `movePlayer(id: string, dir: number): void`
Napi::Value PacmanAddon::MovePlayer(const Napi::CallbackInfo& info) {
    if (rejectNonString(info, 0)) return info.Env().Undefined();
    if (info.Length() < 2 || !info[1].IsNumber()) {
        Napi::TypeError::New(info.Env(), "Expected a numeric direction").ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }
    std::string id = info[0].As<Napi::String>();
    int dir = info[1].As<Napi::Number>().Int32Value();
    engine.movePlayer(id, dir);
    return info.Env().Undefined();
}

/// `tick(): void` - advances the ghosts one step.
Napi::Value PacmanAddon::Tick(const Napi::CallbackInfo& info) {
    engine.tick();
    return info.Env().Undefined();
}

/// `getState(): { players, ghosts, maze }` - deep copy of the game state as plain JS objects.
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
