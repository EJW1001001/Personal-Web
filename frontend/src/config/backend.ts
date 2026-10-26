const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const BACKEND_HTTP_URL =
  import.meta.env.VITE_BACKEND_HTTP_URL ?? `http://${hostname}:5000`;

export const BACKEND_WS_URL =
  import.meta.env.VITE_BACKEND_WS_URL ?? `ws://${hostname}:8081`;
