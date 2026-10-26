/**
 * Backend endpoints used by the frontend.
 *
 * Override with `VITE_BACKEND_HTTP_URL` / `VITE_BACKEND_WS_URL` (see
 * `.env.example`). The defaults use the page's own hostname so the site also
 * works when opened from another device on the LAN (`vite --host`).
 */
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

/** Express + Socket.IO server: `/api/status` health check and multiplayer Pacman. */
export const BACKEND_HTTP_URL =
  import.meta.env.VITE_BACKEND_HTTP_URL ?? `http://${hostname}:5000`;

/** Plain WebSocket server for the shared 3D Game of Life. */
export const BACKEND_WS_URL =
  import.meta.env.VITE_BACKEND_WS_URL ?? `ws://${hostname}:8081`;
