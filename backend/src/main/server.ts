/**
 * Entry point for the main backend (`npm start` / `npm run dev`): an Express
 * HTTP server with a health-check route plus a Socket.IO server on the same
 * port for the 2D Game of Life, shared Game of Life board and multiplayer Pacman.
 *
 * Environment (see `.env.example`):
 * - `PORT` - HTTP/Socket.IO port (default `5000`).
 * - `CORS_ORIGIN` - allowed origin(s), comma separated (default `*`).
 *
 * The 3D Game of Life uses a separate plain-WebSocket server, see
 * `game-of-life-3d-server.ts`.
 *
 * @packageDocumentation
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { UpdateGameStateUseCase } from '../application/update-game-state.js';
import { MultiplayerUseCase } from '../application/multiplayer.js';
import { isValidGrid2D } from '../domain/game-of-life.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : '*';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
});

const updateGameState = new UpdateGameStateUseCase();
const multiplayer = new MultiplayerUseCase();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

/** Health check used by the frontend to show the "Systems_Link" badge. */
app.get('/api/status', (_req, res) => {
  res.json({
    message: 'Backend status: Ready (Clean Architecture)',
    status: 'active',
    pacmanEngine: multiplayer.pacmanAvailable ? 'available' : 'unavailable',
    timestamp: new Date().toISOString(),
  });
});

io.on('connection', socket => {
  console.log('[Socket] Client connected:', socket.id);

  // Stateless 2D Game of Life: the client sends its grid, gets the next one back.
  socket.on('next_gen', (gridByClient: unknown) => {
    if (!isValidGrid2D(gridByClient)) {
      socket.emit('game_error', { message: 'next_gen expects a non-empty rectangular grid of 0/1' });
      return;
    }
    socket.emit('game_update', updateGameState.execute(gridByClient));
  });

  // Multiplayer Pacman
  socket.on('join_game', () => multiplayer.addToQueue(socket.id, io));
  socket.on('player_move', (dir: unknown) => multiplayer.handlePlayerMove(socket.id, dir));
  socket.on('leave_game', () => multiplayer.disconnectPlayer(socket.id, io));

  // Shared Game of Life board (Python engine)
  socket.on('gol_toggle_cell', (payload: { x?: unknown; y?: unknown; value?: unknown } | undefined) => {
    const { x, y, value } = payload ?? {};
    if (typeof x === 'number' && typeof y === 'number' && typeof value === 'number') {
      multiplayer.handleGolToggle(x, y, value, io);
    }
  });
  socket.on('gol_start', () => multiplayer.handleGolStart(io));
  socket.on('gol_stop', () => multiplayer.handleGolStop());
  socket.on('gol_reset', () => multiplayer.handleGolReset(io));

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
    multiplayer.disconnectPlayer(socket.id, io);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[BACKEND] Server listening on port ${PORT}`);
});
