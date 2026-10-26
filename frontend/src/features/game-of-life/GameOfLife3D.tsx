import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BACKEND_WS_URL } from "../../config/backend";

const SIZE = 16;
const MAX_RECONNECT_DELAY_MS = 15000;

function CellMesh({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <mesh position={[x - SIZE / 2, y - SIZE / 2, z - SIZE / 2]}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color="#4A5D4E" roughness={0.3} metalness={0.7} />
    </mesh>
  );
}

function GridRenderer({ grid }: { grid: number[][][] }) {
  const cells = [];
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      for (let z = 0; z < grid[x][y].length; z++) {
        if (grid[x][y][z] === 1) {
          cells.push(<CellMesh key={`${x}-${y}-${z}`} x={x} y={y} z={z} />);
        }
      }
    }
  }
  return <>{cells}</>;
}

export default function GameOfLife3D() {
  const [grid, setGrid] = useState<number[][][]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string>("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 3000;

    const connect = () => {
      if (cancelled) return;
      try {
        const socket = new WebSocket(BACKEND_WS_URL);

        socket.onopen = () => {
          if (cancelled) {
            socket.close();
            return;
          }
          ws.current = socket;
          reconnectDelay = 3000;
          setConnected(true);
          setError("");
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "state" && data.grid) {
              setGrid(data.grid);
            }
          } catch {
            setError("Parse error");
          }
        };

        socket.onerror = () => {
          setError("Connection error");
          setConnected(false);
        };

        socket.onclose = () => {
          setConnected(false);
          if (cancelled) return;
          setError("Disconnected");
          reconnectTimeout = setTimeout(connect, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
        };
      } catch {
        setError("Failed to connect");
        if (!cancelled) {
          reconnectTimeout = setTimeout(connect, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws.current?.close();
    };
  }, []);

  const send = (type: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type }));
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px" }}>
      {/* Debug info */}
      <div style={{ fontSize: 12, color: "#666", textAlign: "center", backgroundColor: "#f0f0f0", padding: "12px 16px", borderRadius: 8, width: "100%" }}>
        <p><strong>Status:</strong> {connected ? "🟢 Connected" : "🔴 Disconnected"}</p>
        {error && <p style={{ color: "red", margin: "4px 0" }}><strong>Error:</strong> {error}</p>}
        <p><strong>Grid:</strong> {grid.length > 0 ? `${grid.length}×${grid[0]?.length}×${grid[0]?.[0]?.length}` : "Waiting..."}</p>
      </div>

      {/* Canvas */}
      <div style={{ width: "100%", height: 600, background: "#f9f7f2", borderRadius: 12, overflow: "hidden", position: "relative", border: "1px solid #ddd" }}>
        {connected && grid.length > 0 ? (
          <Canvas camera={{ position: [SIZE * 1.5, SIZE * 1.5, SIZE * 1.5], fov: 75 }}>
            <ambientLight intensity={0.7} />
            <pointLight position={[SIZE, SIZE, SIZE]} intensity={0.7} />
            <OrbitControls />
            <GridRenderer grid={grid} />
          </Canvas>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 16, fontWeight: "bold" }}>
              {connected ? "⏳ Waiting for grid..." : "🔌 Connecting to server..."}
            </p>
            {error && <p style={{ color: "red", fontSize: 12 }}>⚠️ {error}</p>}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => send("randomize")}
          disabled={!connected}
          style={{
            padding: "10px 20px",
            background: "#4A5D4E",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: connected ? "pointer" : "not-allowed",
            opacity: connected ? 1 : 0.5,
            fontWeight: "bold",
            fontSize: 14
          }}
        >
          🎲 Randomize
        </button>
        <button
          onClick={() => send("step")}
          disabled={!connected}
          style={{
            padding: "10px 20px",
            background: "#A89272",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: connected ? "pointer" : "not-allowed",
            opacity: connected ? 1 : 0.5,
            fontWeight: "bold",
            fontSize: 14
          }}
        >
          ⏭️ Step
        </button>
        <button
          onClick={() => send("clear")}
          disabled={!connected}
          style={{
            padding: "10px 20px",
            background: "#7A5C3A",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: connected ? "pointer" : "not-allowed",
            opacity: connected ? 1 : 0.5,
            fontWeight: "bold",
            fontSize: 14
          }}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}
