# Review report: Personal Web (formerly CV_WEB)

Branch: `claude/quality-review` (not pushed). Reviewed against `QUALITY_STANDARDS.md`.

## Summary

Despite its former name (CV_WEB), Personal Web is **Emmanuel's personal portfolio / CV website**
(React 19 + Vite + Tailwind, single page: hero, metrics, technical focus, experience,
education, research interests, skills, projects). It embeds two live, server-driven
demos: a shared **3D Game of Life** (React Three Fiber client, simulation on a
plain-WebSocket server) and a **2-player Pacman** whose logic is a **C++ engine** loaded
into Node through an N-API addon. The TypeScript backend also contains a **Python/NumPy**
2D Game of Life engine behind a stdin/stdout bridge. No current UI component uses that engine.

At the start: the backend did not type-check, there were no tests at all, the frontend
had a lint error, and the backend crashed on startup unless both the C++ addon and a
`backend/venv` were present. Multiplayer Pacman was broken end to end: players never
received game state, pellets could not be eaten, and one ghost never moved.

All of these are fixed now. The backend has 49 Vitest tests, 23 pytest tests and a
CTest suite. Every check (typecheck, lint, builds, all test suites) passes from a fresh
clone. I also added a README with a mermaid diagram, `docs/ARCHITECTURE.md`, two
`.env.example` files, and doc comments (TSDoc, Google-style docstrings, Doxygen). The
existing structure and public behaviour are unchanged, apart from the bug fixes and
one new event, `game_unavailable`.

## How to run & test (verified commands)

All commands were run on Linux, Node 22.23.4, npm 10.9.9, Python 3.13.17, g++ 13.3, CMake.
They were re-run from a fresh `git clone` of the branch.

```bash
# backend
cd backend
npm ci
python3 -m venv venv && venv/bin/pip install -r requirements-dev.txt
npm run build:engine                 # node-gyp rebuild of the C++ addon (optional)
#   here node-gyp could not download headers (403 from nodejs.org), so this worked:
#   npm run build:engine -- --nodedir=/opt/node22
npm run typecheck                    # tsc --noEmit over src + test
npm test                             # vitest run      -> 49 passed (47 + 2 skipped if addon not built)
npm run test:py                      # pytest          -> 23 passed
npm run test:cpp                     # cmake + ctest   -> 100% passed
venv/bin/ruff check src/infrastructure/engine/python   # clean
npm run build                        # tsc -> dist/, node dist/main/server.js starts
npm run dev                          # :5000 Express + Socket.IO
npm run dev:3d                       # :8081 3D Game of Life WebSocket

# frontend
cd frontend
npm ci
npm run lint                         # eslint, clean
npm run build                        # tsc -b && vite build, OK
npm run dev                          # http://localhost:5173
```

End-to-end smoke test (scripted Socket.IO + ws clients against both running servers):
`/api/status` OK, `next_gen` returns the correct blinker phase, an invalid `next_gen`
gets `game_error`, two players matched and both received ~23 `game_state_update`s in
1.2 s, the shared 2D board ticked via Python, the 3D server answered
`state(16x16x16)` and rejected bad or unknown messages. Repeated with the addon
removed and `PYTHON_PATH=/nonexistent`: the server stayed up, Pacman replied
`game_unavailable`, `/api/status` reported `pacmanEngine: "unavailable"`, and Python
failures were logged and retried.

## Test results before/after

| Check | Before | After |
|---|---|---|
| Backend `tsc --noEmit` | **FAIL**, 6 errors (`ws` has no types, implicit any) | pass (src + tests) |
| Backend unit tests | none existed | **49 passed** (Vitest) |
| Python engine tests | none existed | **23 passed** (pytest) |
| C++ engine tests | none existed | **CTest pass** (8 test groups) |
| ruff (Python) | 4 findings | clean |
| C++ `-Wall -Wextra -Wpedantic` | clean | clean |
| Frontend `npm run lint` | **1 error** (react-hooks/immutability in WireframeTree) | clean |
| Frontend `npm run build` | pass (chunk-size warning) | pass (same warning) |
| C++ addon (node-gyp) | builds with `--nodedir` | builds with `--nodedir` |
| Backend starts without addon / venv | **crash** (`Cannot find module` / unhandled `spawn ENOENT`) | starts, features degrade |
| `npm audit` | backend 8 prod vulns (1 critical), frontend 18 | 0 / 0 (`npm audit fix`, no `--force`) |

The new C++ tests fail on the original `GameEngine.cpp` (pellet scoring and the frozen
ghost) and pass after the fix. The Pacman room bug was reproduced against the original
commit: both clients got `game_start` and then **0** `game_state_update` events.

## Bugs fixed

1. **Pacman players never received game state** (`application/multiplayer.ts`). The
   loop broadcast to `io.to(roomId)`, but no socket ever joined the room. Both sockets
   now join it (`io.in(id).socketsJoin(roomId)`) and leave it when the game ends.
2. **Pellets could never be eaten** (`GameEngine.cpp`). The pellet tile was computed as
   `int(x + 0.5)`, one tile down and right of the player, so walking the open top row
   scored 0. It now uses the tile the player is actually in. Covered by a CTest and by
   a Vitest test against the real addon.
3. **One ghost was permanently frozen.** It was created with direction `4`, which the
   movement code never handles. Its direction is now `0`.
4. **Memory leaks in the C++ engine.** `Actor*`s were never deleted, and re-adding a
   player id leaked the old actor. Added a destructor, delete-on-re-add, and made
   `GameEngine` non-copyable.
5. **Backend crashed at import if the C++ addon was not built.** The addon is now loaded
   through `infrastructure/engine/cpp/pacman-engine.ts`, which returns `null` with a
   hint. `join_game` then replies `game_unavailable`, and the frontend shows an
   "Engine_Offline" state instead of spinning forever.
6. **Backend crashed if `backend/venv` was missing.** The `spawn` had no `'error'`
   listener, so ENOENT was an unhandled error event. The bridge now handles it, rejects
   pending requests, retries on the next call, and resolves the interpreter as
   `PYTHON_PATH` → `venv` → `python3`.
7. **Python bridge parsed stdout per chunk.** Grids larger than one pipe chunk failed
   with JSON parse errors. Output is now buffered and split on newlines (tested with
   200×200).
8. **Python bridge could hand one request's answer to another caller.** It kept a single
   resolver, so concurrent or timed-out requests got mixed up. It now uses a FIFO queue
   that keeps timed-out entries until their late answers arrive.
9. **The Python engine skipped some invalid lines.** A JSON line with no `command` got
   no response, which desynchronised the bridge. It now answers exactly one line per
   request and validates the grid.
10. **`next_gen` with a malformed payload threw** `TypeError: grid.map is not a
    function` inside the handler. Payloads are now validated (`isValidGrid2D`) and
    rejected with `game_error`.
11. **Bad arguments to the N-API binding.** It is built with
    `NAPI_DISABLE_CPP_EXCEPTIONS`, so a non-string id failed hard. Arguments are now
    type-checked and throw a JS `TypeError`.
12. Smaller fixes:
    - Unknown `player_move` directions silently became "right"; they are now ignored.
    - `gol_toggle_cell` accepted any value; it now accepts only 0/1.
    - Unknown 3D WebSocket commands were silently ignored; they now get an error reply.
    - The shared 2D loop could pile up slow Python calls; it now skips busy ticks.
13. **Backend did not type-check.** `ws` was imported directly but only present as a
    transitive dependency with no types. Added `ws` and `@types/ws`.

## Quality changes

- Backend: typed domain grids (`Grid2D`, `Grid3D`) and an engine interface
  (`PacmanEngineInstance`, `Direction` enum) in place of `any`. Engines are
  constructor-injected into `MultiplayerUseCase` and the 3D controller, so they can be
  tested with fakes. Duplicated grid-building code in the 3D service is extracted
  into a helper, and the random source is injectable.
- `server.ts`: removed a duplicate `disconnect` handler and an empty `scored` handler
  (commented-out code). Added `CORS_ORIGIN`; `WS_PORT` is now configurable.
- Python: type hints, Google-style docstrings, specific exceptions instead of a blanket
  `except Exception`, ruff clean. `requirements.txt` / `requirements-dev.txt` added.
- C++: `Maze::SIZE`, `Tile` enum and `hasPellet()` replace magic numbers. Removed an
  unused `M_PI` define and stale comments. Added `static_cast`s.
- Frontend: fixed the WireframeTree RAF loop (lint error). Removed dead code:
  `services/socket.ts` (never imported), `features/game-of-life/GameOfLife.tsx`
  (re-export, never imported), `files_list.txt` (listed 12 non-existent files) and
  `shots4.mjs` (one-off Playwright screenshot script; Playwright is not a dependency).
- New npm scripts: `build`, `typecheck`, `build:engine`, `test`, `test:py`, `test:cpp`.
- `.gitignore`: un-ignores `.env.example` (`.env.*` was hiding it) and ignores ruff,
  pytest and CTest build caches.
- `npm audit fix` (semver-compatible, lockfile only): 0 vulnerabilities in both packages.

## Documentation added

- `README.md`: summary, features, stack, mermaid diagram (frontend ↔ WebSocket /
  Socket.IO ↔ use cases / services ↔ domain / C++ / Python engines), project tree,
  prerequisites, install (including the node-gyp `--nodedir` workaround), env var
  table, run / test commands, known limitations.
- `docs/ARCHITECTURE.md`: processes, layers, all three protocols (WebSocket JSON,
  Socket.IO events, stdin JSON lines), N-API API, C++ model, state and concurrency,
  test map, architectural gaps.
- `backend/.env.example` (`PORT`, `CORS_ORIGIN`, `WS_PORT`, `PYTHON_PATH`,
  `PACMAN_ENGINE_PATH`) and `frontend/.env.example` (`VITE_BACKEND_HTTP_URL`,
  `VITE_BACKEND_WS_URL`), placeholders only. The original code read only `PORT` and
  the two `VITE_*` variables; the others were added in this review.
- TSDoc on every backend module and public class or function, plus the frontend
  `config/backend.ts`, `GameOfLife3D` and `PacmanGame`. Doxygen on `Actor.hpp`,
  `Maze.hpp`, `GameEngine.hpp`, `binding.cpp` and the `.cpp` files. Docstrings in
  `game_of_life_engine.py`.

## Architecture notes

- The structure matches the README: `domain` (pure) ← `services` / `application` ←
  `controllers` / `main`, with `infrastructure` adapters. No dependency points outwards.
- **Small violations, documented but not fixed:**
  - `main/server.ts` is both the composition root and the Socket.IO controller.
    There is no `controllers/socket.controller.ts` to match `game-of-life-3d.ws.ts`.
  - `MultiplayerUseCase` mixes two unrelated features (Pacman and the shared 2D board).
- **Orphaned or half-finished backend features:** the shared 2D board (`gol_*` events
  plus the whole Python engine) and the stateless `next_gen` event have no frontend
  consumer. An older 2D UI appears to have been replaced by the 3D view. They are kept
  (no feature deletion), fixed and tested.
- Two backend processes are needed: Express/Socket.IO on :5000 and a plain `ws`
  server on :8081 for the 3D game.
- The 2D Game of Life rules exist twice (TypeScript domain and Python engine). Both
  are tested on the same patterns.
- **Root `package.json` / `package-lock.json`** list only `three`,
  `@react-three/fiber` and `@react-three/drei`, which `frontend/package.json` already
  declares. Nothing imports from the root. This looks like a stray `npm install` run
  at the repo root. **Not deleted, as requested**; noted in the README.

## Unfinished / TODO items found

- `frontend/src/data/contact.data.ts`: `TODO` placeholder Google Scholar and ORCID URLs.
- "Download CV" links to `/resume.pdf`, which is not in the repo (correctly, since it
  is personal data). It returns 404 until the owner adds it at deploy time.
- Pacman has no win/lose condition: ghosts never collide with players, and the game
  ends only when a player disconnects. No restart without a page reload.
- `removePlayer` in the engine is exposed but never called from TypeScript.
- Frontend 3D chunk is about 900 kB minified (three.js); Vite warns about it.

## Recommended, not done

- Move the Socket.IO handlers from `server.ts` into `controllers/socket.controller.ts`,
  and split `MultiplayerUseCase` into `PacmanMatchmakingUseCase` and `SharedBoardUseCase`.
- Serve the 3D WebSocket on the main HTTP server (`ws` with `noServer` plus an
  `upgrade` handler on a path), so the app needs one process and one port.
- Either add a frontend for the shared 2D board, or remove the Python engine and the
  `gol_*` events if they are obsolete. That is the owner's decision.
- Render 3D cells with a single `InstancedMesh` instead of one `<mesh>` per live cell,
  and split three.js into its own chunk.
- Add ghost–player collisions and a game-over state to Pacman.
- Add a GitHub Actions workflow running typecheck, lint, Vitest, pytest and CTest.
- Restrict `CORS_ORIGIN` in production (it defaults to `*`).
- Contact data (phone number, email, location) is hard-coded in
  `frontend/src/data/contact.data.ts`, and profile photos are in `public/`. This is
  intentional for a CV site, but the owner may not want the phone number in a public
  repo. Not changed.

## Anything you could not verify

- **Visual behaviour in a real browser** (3D rendering, canvas effects, Pacman drawing,
  layout). Only `tsc -b`, `vite build` and ESLint were run on the frontend, and the
  backend protocols were exercised with scripted clients.
- **`node-gyp rebuild` without `--nodedir`**: it failed here only because downloading
  Node headers from nodejs.org returned 403 in this sandbox. On a normal machine it
  should work as documented. Windows / MSVC builds were not tested.
- `vitest` 5 was added as a dev dependency. The backend's existing `ts-node` /
  `ts-node-dev` dev dependencies are unused (scripts use `tsx`) but were left in place.
- The original `backend/.env` on the owner's machine was not available, so I cannot
  confirm it holds no variables beyond those found in the code.
