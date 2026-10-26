/**
 * Entry point for the standalone 3D Game of Life WebSocket server
 * (`npm run dev:3d`). It is a separate process from `server.ts` and uses the
 * plain `ws` library, not Socket.IO.
 *
 * Environment: `WS_PORT` (default `8081`).
 *
 * @packageDocumentation
 */
import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { setupGameOfLife3DWSS } from '../controllers/game-of-life-3d.ws.js';

const WS_PORT = parseInt(process.env.WS_PORT || '8081', 10);

const wss = new WebSocketServer({ port: WS_PORT });
setupGameOfLife3DWSS(wss);
console.log(`Game of Life 3D WebSocket server running on ws://localhost:${WS_PORT}`);
