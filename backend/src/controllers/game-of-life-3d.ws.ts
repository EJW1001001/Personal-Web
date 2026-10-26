/**
 * WebSocket controller for the shared 3D Game of Life.
 *
 * @remarks
 * Protocol (JSON text frames):
 * - client -> server: `{ "type": "step" | "randomize" | "clear" }`
 * - server -> client: `{ "type": "state", "grid": number[][][] }` sent on
 *   connect and broadcast to every client after each command, or
 *   `{ "type": "error", "message": string }` sent only to the sender.
 *
 * @packageDocumentation
 */
import { WebSocketServer, WebSocket } from 'ws';
import { GameOfLife3DService } from '../services/game-of-life-3d.service.js';
import type { Grid3D } from '../domain/game-of-life-3d.js';

/** Commands a client may send. */
type ClientCommand = 'step' | 'randomize' | 'clear';

/**
 * Attaches the 3D Game of Life protocol to a `ws` server.
 *
 * @param wss - The WebSocket server to attach to.
 * @param service - Simulation state shared by all clients of this server.
 *   Defaults to a new randomly seeded 16x16x16 volume.
 */
export function setupGameOfLife3DWSS(
  wss: WebSocketServer,
  service: GameOfLife3DService = new GameOfLife3DService(),
): void {
  const broadcast = (grid: Grid3D) => {
    const payload = JSON.stringify({ type: 'state', grid });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    });
  };

  const handlers: Record<ClientCommand, () => Grid3D> = {
    step: () => service.step(),
    randomize: () => service.randomize(),
    clear: () => service.clear(),
  };

  wss.on('connection', (ws: WebSocket) => {
    ws.send(JSON.stringify({ type: 'state', grid: service.getState() }));

    ws.on('message', msg => {
      let data: unknown;
      try {
        data = JSON.parse(msg.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
        return;
      }
      const type = (data as { type?: unknown } | null)?.type;
      if (typeof type === 'string' && Object.hasOwn(handlers, type)) {
        broadcast(handlers[type as ClientCommand]());
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown command' }));
      }
    });
  });
}
