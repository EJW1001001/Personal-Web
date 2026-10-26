import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { BACKEND_HTTP_URL } from '../../config/backend';

interface Player {
  x: number;
  y: number;
  dir: number;
  score: number;
}

interface Ghost {
  x: number;
  y: number;
  dir: number;
}

interface GameState {
  players: Record<string, Player>;
  ghosts: Ghost[];
  maze: number[][];
}

const PacmanGame = ({ onBack }: { onBack: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [status, setStatus] = useState<'connecting' | 'waiting' | 'playing' | 'ended' | 'unavailable'>('connecting');

  useEffect(() => {
    const socket = io(BACKEND_HTTP_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('waiting');
      socket.emit('join_game');
    });

    socket.on('waiting_for_opponent', () => {
      setStatus('waiting');
    });

    socket.on('game_start', () => {
      setStatus('playing');
    });

    socket.on('game_state_update', (state: GameState) => {
      setGameState(state);
    });

    socket.on('player_disconnected', () => {
      setStatus('ended');
    });

    // Sent when the backend runs without the compiled C++ engine.
    socket.on('game_unavailable', () => {
      setStatus('unavailable');
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      let dir = '';
      if (e.key === 'ArrowUp') dir = 'up';
      if (e.key === 'ArrowDown') dir = 'down';
      if (e.key === 'ArrowLeft') dir = 'left';
      if (e.key === 'ArrowRight') dir = 'right';

      if (dir && socket.connected) {
        socket.emit('player_move', dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      socket.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Only run once on mount

  useEffect(() => {
    if (!canvasRef.current || !gameState) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { maze, players, ghosts } = gameState;
    const rows = maze.length;
    const cols = maze[0].length;
    const cellSize = Math.min(canvas.width / cols, canvas.height / rows);

    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = maze[r][c];
        const x = c * cellSize;
        const y = r * cellSize;

        if (cell === 1) { // Wall
          ctx.fillStyle = '#2233aa';
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        } else if (cell === 2) { // Pellet
          ctx.fillStyle = '#ffb8ae';
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw players
    Object.entries(players).forEach(([id, p]) => {
      const isMe = id === socketRef.current?.id;
      ctx.fillStyle = isMe ? '#ffff00' : '#00ffff';
      ctx.beginPath();
      const centerX = p.x * cellSize + cellSize / 2;
      const centerY = p.y * cellSize + cellSize / 2;
      
      // Basic Pacman shape based on direction
      let startAngle = 0;
      let endAngle = Math.PI * 2;
      
      // Invert vertical directions because of canvas coordinate system if needed?
      // Actually the engine's 0=Right, 1=Down, 2=Left, 3=Up
      if (p.dir === 0) { startAngle = 0.2 * Math.PI; endAngle = 1.8 * Math.PI; } // Right
      if (p.dir === 1) { startAngle = 0.7 * Math.PI; endAngle = 0.3 * Math.PI; } // Down
      if (p.dir === 2) { startAngle = 1.2 * Math.PI; endAngle = 0.8 * Math.PI; } // Left
      if (p.dir === 3) { startAngle = 1.7 * Math.PI; endAngle = 1.3 * Math.PI; } // Up

      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, cellSize / 2 - 2, startAngle, endAngle);
      ctx.fill();

      // Draw score or ID above
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${isMe ? 'YOU' : 'P2'}: ${p.score}`, centerX, centerY - cellSize/2 - 5);
    });

    // Draw ghosts
    ghosts.forEach((g, idx) => {
      const colors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'];
      ctx.fillStyle = colors[idx % colors.length];
      const centerX = g.x * cellSize + cellSize / 2;
      const centerY = g.y * cellSize + cellSize / 2;
      
      // Draw ghost head
      ctx.beginPath();
      ctx.arc(centerX, centerY - cellSize/4, cellSize / 2 - 3, Math.PI, 0);
      ctx.lineTo(centerX + cellSize / 2 - 3, centerY + cellSize / 2 - 3);
      ctx.lineTo(centerX - cellSize / 2 + 3, centerY + cellSize / 2 - 3);
      ctx.fill();
      
      // Draw eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(centerX - cellSize/5, centerY - cellSize/4, 2, 0, Math.PI * 2);
      ctx.arc(centerX + cellSize/5, centerY - cellSize/4, 2, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [gameState]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-6 md:p-12"
    >
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold text-white mono tracking-tighter uppercase">Project_Pacman_Multi</h2>
          <span className="text-xs text-indigo-400 mono uppercase tracking-widest mt-1">Real-time_C++_Engine_Over_Socket.io</span>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-2 border border-white/20 text-white rounded-full hover:bg-white/10 transition-colors mono text-xs uppercase"
        >
          _Terminate_Session
        </button>
      </div>

      <div className="relative aspect-square w-full max-w-[500px] bg-[#050510] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10">
        {(status === 'connecting' || status === 'waiting') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-6 z-10">
             <div className="relative">
                <div className="w-16 h-16 border-2 border-indigo-500/20 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-t-2 border-indigo-500 rounded-full animate-spin" />
             </div>
             <div className="text-center">
                <p className="mono animate-pulse text-xl font-bold mb-2">
                  {status === 'connecting' ? 'Establishing_Handshake...' : 'Synchronizing_Players...'}
                </p>
                <p className="mono text-[10px] text-white/40">
                  {status === 'waiting' ? 'Waiting for 1 more connection' : 'Connecting to high-performance C++ cluster'}
                </p>
             </div>
          </div>
        )}
        
        {status === 'playing' && (
          <canvas 
            ref={canvasRef} 
            width={500} 
            height={500} 
            className="w-full h-full"
          />
        )}

        {!gameState && status === 'playing' && (
           <div className="absolute inset-0 flex items-center justify-center">
              <p className="mono text-white animate-pulse">Initializing_Grid...</p>
           </div>
        )}

        {status === 'unavailable' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 backdrop-blur-sm gap-4 z-20 px-8 text-center">
             <p className="text-2xl font-bold mono text-amber-400 tracking-tighter uppercase">Engine_Offline</p>
             <p className="mono text-sm opacity-60">The multiplayer engine is not available on this server right now.</p>
          </div>
        )}

        {status === 'ended' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 backdrop-blur-sm gap-6 z-20">
             <p className="text-4xl font-bold mono text-red-500 tracking-tighter uppercase">Network_Fault</p>
             <p className="mono text-sm opacity-60">Opponent disconnected or session expired.</p>
             <button 
               onClick={() => window.location.reload()}
               className="mt-4 px-10 py-4 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 mono uppercase tracking-widest text-xs"
             >
               Reconnect_Session
             </button>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-3 gap-16 text-white/60 mono text-[10px] tracking-widest uppercase">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#ffff00] rounded-full shadow-[0_0_10px_rgba(255,255,0,0.5)]" />
          <span>User_Node (P1)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#00ffff] rounded-full shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
          <span>Peer_Node (P2)</span>
        </div>
        <div className="flex items-center justify-end font-bold text-indigo-400">
          [ ARROW_KEYS ] To Move
        </div>
      </div>
    </motion.div>
  );
};

export default PacmanGame;
