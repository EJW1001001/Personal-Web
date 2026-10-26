import { WebSocketServer, WebSocket } from "ws";
import { GameOfLife3DService } from "../services/game-of-life-3d.service.js";

const service = new GameOfLife3DService();

export function setupGameOfLife3DWSS(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket) => {
    // Send initial state
    ws.send(JSON.stringify({ type: "state", grid: service.getState() }));

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === "step") {
          const grid = service.step();
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "state", grid }));
            }
          });
        } else if (data.type === "randomize") {
          const grid = service.randomize();
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "state", grid }));
            }
          });
        } else if (data.type === "clear") {
          const grid = service.clear();
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "state", grid }));
            }
          });
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
      }
    });
  });
}
