import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { UpdateGameStateUseCase } from '../application/update-game-state.js';
import { MultiplayerUseCase } from '../application/multiplayer.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const updateGameState = new UpdateGameStateUseCase();
const multiplayer = new MultiplayerUseCase();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json());

// Basic REST status for health-checks
app.get('/api/status', (req, res) => {
  res.json({
    message: "Backend status: Ready (Clean Architecture)",
    status: "active",
    timestamp: new Date().toISOString()
  });
});

// Real-time communication via Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Game of Life socket logic
  socket.on('next_gen', (gridByClient: number[][]) => {
    const nextGrid = updateGameState.execute(gridByClient);
    socket.emit('game_update', nextGrid);
  });


  // Multiplayer Mini-game logic
  socket.on('join_game', () => {
    multiplayer.addToQueue(socket.id, io);
  });

  socket.on('scored', () => {
    // This was the old handleScore, we can keep it or remove it
    // multiplayer.handleScore(socket.id, io);
  });

  socket.on('player_move', (dir: string) => {
    multiplayer.handlePlayerMove(socket.id, dir);
  });

  socket.on('leave_game', () => {
    multiplayer.disconnectPlayer(socket.id, io);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    multiplayer.disconnectPlayer(socket.id, io);
  });

  // Game of Life handlers
  socket.on('gol_toggle_cell', ({ x, y, value }) => {
    multiplayer.handleGolToggle(x, y, value, io);
  });

  socket.on('gol_start', () => {
    multiplayer.handleGolStart(io);
  });

  socket.on('gol_stop', () => {
    multiplayer.handleGolStop();
  });

  socket.on('gol_reset', () => {
    multiplayer.handleGolReset(io);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[BACKEND] Server listening on port ${PORT}`);
});
