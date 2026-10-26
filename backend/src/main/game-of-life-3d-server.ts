import { WebSocketServer } from "ws";
import { setupGameOfLife3DWSS } from "../controllers/game-of-life-3d.ws.js";

const wss = new WebSocketServer({ port: 8081 });
setupGameOfLife3DWSS(wss);
console.log("Game of Life 3D WebSocket server running on ws://localhost:8081");
