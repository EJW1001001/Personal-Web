import { useRef, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────
   Neural Tree Sphere — OPTIMISED Canvas 2D
   ─────────────────────────────────────────────
   Perf improvements over previous version:
   • Node glow pre-rendered to OffscreenCanvas sprite
   • Sphere edge pairs pre-computed as flat Uint16Array
   • Branch/root colours pre-computed at build time
   • Unit vectors pre-computed (skip trig in draw loop)
   • Projection array re-used (zero alloc per frame)
   • Fine twigs & foliage batched into Path2D + dot arrays
   • Root shadows/mains batched into 2 Path2D strokes
   • Static centre/shadow gradients cached on resize
   • Bark fibers batched into single beginPath
   • Edge buckets reduce strokeStyle changes
   ───────────────────────────────────────────── */

// ── Colour palette ──

// Soft brown / café suave for Hero section
const DARK_BROWN = { r: 100, g: 80, b: 60 };
const DARK_BROWN_MID = { r: 125, g: 105, b: 85 };


// ── Branch segment (with pre-computed colour) ──
interface Branch {
  x1: number; y1: number; x2: number; y2: number;
  depth: number; width: number; phase: number;
  children: Branch[];
  r: number; g: number; b: number; alpha: number;
  isLeaf: boolean;
}

// ── Root segment ──
interface Root {
  x1: number; y1: number; x2: number; y2: number;
  phase: number; width: number;
  children: Root[];
  isLeaf: boolean;
}

// ── Sphere vertex (with pre-computed unit vector) ──
interface SphereNode {
  theta: number; phi: number;
  rFactor: number;
  phase: number; speed: number;
  ux: number; uy: number; uz: number;
}

// ── Projected point (re-used each frame) ──
interface Projected { x: number; y: number; z: number; glow: number }

// ═══════════════════════════════════════════
//  Tree generation
// ═══════════════════════════════════════════

function computeBranchColour(depth: number, maxDepth: number) {
  const depthRatio = depth / maxDepth;
  // All beige
  return {
    r: DARK_BROWN.r,
    g: DARK_BROWN.g,
    b: DARK_BROWN.b,
    alpha: 0.85 - depthRatio * 0.2,
  };
}

function buildBranches(
  x: number, y: number, angle: number, length: number,
  depth: number, maxDepth: number, width: number,
  cx: number, cy: number, maxR: number,
): Branch {
  // Make branches longer
  let ex = x + Math.cos(angle) * length * 1.18;
  let ey = y + Math.sin(angle) * length * 1.18;

  const dx = ex - cx, dy = ey - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const limit = maxR * 0.88;
  if (dist > limit) { const s = limit / dist; ex = cx + dx * s; ey = cy + dy * s; }

  const col = computeBranchColour(depth, maxDepth);
  const branch: Branch = {
    x1: x, y1: y, x2: ex, y2: ey,
    depth, width, phase: Math.random() * Math.PI * 2,
    children: [],
    r: col.r, g: col.g, b: col.b, alpha: col.alpha,
    isLeaf: false,
  };

  if (depth < maxDepth) {
    const n = depth < 2 ? 3 : depth < 4 ? (Math.random() < 0.6 ? 3 : 2) : depth < 7 ? (Math.random() < 0.45 ? 3 : 2) : (Math.random() < 0.35 ? 2 : 1);
    const spread = depth < 2 ? 0.7 + depth * 0.1 : depth < 5 ? 0.5 + depth * 0.04 : 0.3 + depth * 0.03;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      const bendOut = depth < 3 ? t * 0.3 : 0;
      const a = angle + t * spread + bendOut + (Math.random() - 0.5) * 0.2;
  // Make sub-branches a bit longer
  const shrink = depth < 2 ? 0.78 + Math.random() * 0.1 : 0.7 + Math.random() * 0.13;
  branch.children.push(buildBranches(ex, ey, a, length * shrink, depth + 1, maxDepth, width * 0.68, cx, cy, maxR));
    }
  }
  branch.isLeaf = branch.children.length === 0;
  return branch;
}

function flattenBranches(b: Branch, out: Branch[]) {
  out.push(b);
  for (const c of b.children) flattenBranches(c, out);
}

function buildRoots(
  x: number, y: number, angle: number, length: number,
  depth: number, maxDepth: number, width: number,
  cx: number, cy: number, maxR: number,
): Root {
  let ex = x + Math.cos(angle) * length;
  let ey = y + Math.sin(angle) * length;

  const dx = ex - cx, dy = ey - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const limit = maxR * 0.88;
  if (dist > limit) { const s = limit / dist; ex = cx + dx * s; ey = cy + dy * s; }

  const root: Root = { x1: x, y1: y, x2: ex, y2: ey, phase: Math.random() * Math.PI * 2, width, children: [], isLeaf: false };
  if (depth < maxDepth) {
    const n = depth < 2 ? (Math.random() < 0.6 ? 3 : 2) : depth < 4 ? (Math.random() < 0.5 ? 3 : 2) : (Math.random() < 0.4 ? 2 : 1);
    const spread = 0.32 + depth * 0.07;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      const a = angle + t * spread + (Math.random() - 0.5) * 0.25;
      root.children.push(buildRoots(ex, ey, a, length * (0.6 + Math.random() * 0.15), depth + 1, maxDepth, width * 0.65, cx, cy, maxR));
    }
  }
  root.isLeaf = root.children.length === 0;
  return root;
}

function flattenRoots(r: Root, out: Root[]) {
  out.push(r);
  for (const c of r.children) flattenRoots(c, out);
}

// ═══════════════════════════════════════════
//  Geodesic sphere generation
// ═══════════════════════════════════════════

function buildSphere(nodeCount: number): { nodes: SphereNode[]; edgePairs: Uint16Array } {
  const nodes: SphereNode[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < nodeCount; i++) {
    const yNorm = 1 - (i / (nodeCount - 1)) * 2;
    const theta = Math.acos(yNorm);
    const phi = goldenAngle * i;

    // Pre-compute unit vector (avoids trig every frame)
    const sinT = Math.sin(theta);
    nodes.push({
      theta, phi,
      rFactor: 0.95 + Math.random() * 0.1,
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.3,
      ux: sinT * Math.cos(phi),
      uy: Math.cos(theta),
      uz: sinT * Math.sin(phi),
    });
  }

  // Build adjacency — collect unique edge pairs into a flat Uint16Array
  const tempEdges: number[] = [];
  const edgeSet = new Set<number>();

  for (let i = 0; i < nodeCount; i++) {
    const ni = nodes[i];
    const dists: { idx: number; d: number }[] = [];
    for (let j = 0; j < nodeCount; j++) {
      if (j === i) continue;
      const nj = nodes[j];
      const ddx = ni.ux - nj.ux, ddy = ni.uy - nj.uy, ddz = ni.uz - nj.uz;
      dists.push({ idx: j, d: ddx * ddx + ddy * ddy + ddz * ddz }); // squared dist (skip sqrt)
    }
    dists.sort((a, b) => a.d - b.d);
    const connectCount = 3 + (i % 2);
    for (let k = 0; k < Math.min(connectCount, dists.length); k++) {
      const j = dists[k].idx;
      const lo = i < j ? i : j, hi = i < j ? j : i;
      const key = lo * nodeCount + hi;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        tempEdges.push(lo, hi);
      }
    }
  }

  return { nodes, edgePairs: new Uint16Array(tempEdges) };
}

// ═══════════════════════════════════════════
//  Pre-render glow sprite (OffscreenCanvas)
//  Eliminates 120 createRadialGradient/frame
// ═══════════════════════════════════════════

function createGlowSprite(size: number): HTMLCanvasElement | OffscreenCanvas {
  const s = size * 2;
  let cvs: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== 'undefined') {
    cvs = new OffscreenCanvas(s, s);
  } else {
    cvs = document.createElement('canvas');
    cvs.width = s;
    cvs.height = s;
  }
  const c = cvs.getContext('2d')!;
  const grad = c.createRadialGradient(size, size, 0, size, size, size);
  grad.addColorStop(0, `rgba(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b},0.45)`);
  grad.addColorStop(0.4, `rgba(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b},0.15)`);
  grad.addColorStop(1, `rgba(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b},0)`);
  c.fillStyle = grad;
  c.fillRect(0, 0, s, s);
  return cvs;
}

// ═══════════════════════════════════════════
//  Component
// ═══════════════════════════════════════════

const WireframeTree = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  const branchesRef = useRef<Branch[]>([]);
  const rootsRef = useRef<Root[]>([]);
  const sphereNodesRef = useRef<SphereNode[]>([]);
  const edgePairsRef = useRef<Uint16Array>(new Uint16Array(0));
  const sizeRef = useRef({ w: 0, h: 0 });
  const geomRef = useRef({ cx: 0, cy: 0, sphereR: 0 });

  // Re-used projection buffer (zero-alloc per frame)
  const projectedRef = useRef<Projected[]>([]);

  // Pre-rendered glow sprite
  const glowSpriteRef = useRef<HTMLCanvasElement | OffscreenCanvas | null>(null);
  const glowSpriteSize = useRef(0);

  // Cached static gradients
  const centreGradRef = useRef<CanvasGradient | null>(null);
  const shadowGradRef = useRef<CanvasGradient | null>(null);
  const shadowGeomRef = useRef({ y: 0, rx: 0, ry: 0 });

  const rebuild = useCallback((W: number, H: number) => {
  const cx = W * 0.5;
  const cy = H * 0.48;
  // Make the sphere wider horizontally
  const sphereR = Math.min(W * 1.18, H) * 0.46;
    geomRef.current = { cx, cy, sphereR };

    // ── branches ──
  // Shorten trunk: reduce length multiplier
  const trunkLen = sphereR * 0.19;
  // Move tree further down
  buildBranches(cx, cy + sphereR * 0.22, -Math.PI / 2, trunkLen, 0, 10, 8, cx, cy, sphereR);
  // Adjust the base of the trunk to blend with roots
  // Move the trunk base slightly lower for overlap
  const trunkBaseY = cy + sphereR * 0.22;
  const trunk = buildBranches(cx, trunkBaseY + sphereR * 0.025, -Math.PI / 2, trunkLen, 0, 10, 8, cx, cy, sphereR);
  const bArr: Branch[] = [];
  flattenBranches(trunk, bArr);
  branchesRef.current = bArr;

    // ── roots ──
    const rootAngles = [
      Math.PI / 2 - 0.45, Math.PI / 2 - 0.18, Math.PI / 2,
      Math.PI / 2 + 0.18, Math.PI / 2 + 0.45,
      Math.PI / 2 - 0.7, Math.PI / 2 + 0.7,
    ];
    const rArr: Root[] = [];
    for (const a of rootAngles) {
  // Start roots slightly higher to overlap with trunk base
  const root = buildRoots(cx, cy + sphereR * 0.22 - sphereR * 0.012, a, trunkLen * 0.55, 0, 6, 2.5, cx, cy, sphereR);
      flattenRoots(root, rArr);
    }
    rootsRef.current = rArr;

    // ── sphere ──
    const { nodes, edgePairs } = buildSphere(120);
    sphereNodesRef.current = nodes;
    edgePairsRef.current = edgePairs;

    // ── projection buffer (re-use across frames) ──
    if (projectedRef.current.length !== nodes.length) {
      projectedRef.current = nodes.map(() => ({ x: 0, y: 0, z: 0, glow: 0 }));
    }

    // ── glow sprite ──
    const spriteR = 14;
    glowSpriteSize.current = spriteR;
    glowSpriteRef.current = createGlowSprite(spriteR);

    // ── static gradients (cached on resize, not recreated per frame) ──
    const cvs = canvasRef.current;
    if (cvs) {
      const ctx = cvs.getContext('2d');
      if (ctx) {
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sphereR * 0.6);
        cg.addColorStop(0, `rgba(${DARK_BROWN_MID.r}, ${DARK_BROWN_MID.g}, ${DARK_BROWN_MID.b}, 0.12)`);
        cg.addColorStop(0.4, `rgba(${DARK_BROWN_MID.r}, ${DARK_BROWN_MID.g}, ${DARK_BROWN_MID.b}, 0.05)`);
        cg.addColorStop(1, 'rgba(250, 249, 246, 0)');
        centreGradRef.current = cg;

        const sy = cy + sphereR * 0.95;
        const sg = ctx.createRadialGradient(cx, sy, 0, cx, sy, sphereR * 0.55);
        sg.addColorStop(0, `rgba(${DARK_BROWN_MID.r}, ${DARK_BROWN_MID.g}, ${DARK_BROWN_MID.b}, 0.15)`);
        sg.addColorStop(1, 'rgba(250, 249, 246, 0)');
        shadowGradRef.current = sg;
        shadowGeomRef.current = { y: sy, rx: sphereR * 0.55, ry: sphereR * 0.08 };
      }
    }
  }, []);

  // ── Draw loop ──
  const draw = useCallback((time: number) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = cvs.width / dpr;
    const H = cvs.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const t = time * 0.001;
    const { cx, cy, sphereR } = geomRef.current;
    const nodes = sphereNodesRef.current;
    const edgePairs = edgePairsRef.current;
    const projected = projectedRef.current;

    const rotY = t * 0.08;
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);
    const fov = 800;
    const fovOffset = sphereR * 0.5;

    // ─── 1 · Project sphere nodes (re-use buffer, no allocation) ───
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const breathe = 1 + Math.sin(t * node.speed + node.phase) * 0.025;
      const R = sphereR * node.rFactor * breathe;

  // Make the sphere circular (no stretch)
  const ovalFactor = 1;
  const x3raw = node.ux * R * ovalFactor;
  const y3 = node.uy * R;
      const z3raw = node.uz * R;

      const rx = x3raw * cosR - z3raw * sinR;
      const rz = x3raw * sinR + z3raw * cosR;

      const perspective = fov / (fov + rz + fovOffset);
      const p = projected[i];
      p.x = cx + rx * perspective;
      p.y = cy + y3 * perspective;
      p.z = rz;
      p.glow = 0.3 + perspective * 0.7;
    }

    // ─── 1b · Draw sphere edges (bucketed to reduce strokeStyle changes) ───
    ctx.lineCap = 'round';
    const edgeCount = edgePairs.length >> 1;

    // 4 buckets by glow level → fewer style changes (was 1 per edge)
    const bucketPaths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const bucketAlphaSum = [0, 0, 0, 0];
    const bucketCounts = [0, 0, 0, 0];

    for (let e = 0; e < edgeCount; e++) {
      const i = edgePairs[e * 2];
      const j = edgePairs[e * 2 + 1];
      const a = projected[i], b = projected[j];
      const avgGlow = (a.glow + b.glow) * 0.5;

      const bi = avgGlow < 0.45 ? 0 : avgGlow < 0.6 ? 1 : avgGlow < 0.75 ? 2 : 3;
      bucketPaths[bi].moveTo(a.x, a.y);
      bucketPaths[bi].lineTo(b.x, b.y);
      bucketAlphaSum[bi] += avgGlow * 0.25;
      bucketCounts[bi]++;
    }

  // Make sphere edge lines thicker
  const bucketWidths = [1.7, 2.1, 2.5, 2.9];
    for (let bi = 0; bi < 4; bi++) {
      if (bucketCounts[bi] === 0) continue;
      const avgAlpha = bucketAlphaSum[bi] / bucketCounts[bi];
  ctx.strokeStyle = `rgba(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b},${(avgAlpha * 1.1).toFixed(3)})`;
      ctx.lineWidth = bucketWidths[bi];
      ctx.stroke(bucketPaths[bi]);
    }

    // ─── 2 · Curved web lines (batched into single Path2D) ───
    const webCount = 24;
    const webPath = new Path2D();
    for (let i = 0; i < webCount; i++) {
      const angle0 = (i / webCount) * Math.PI * 2 + t * 0.04;
      const angle1 = angle0 + Math.PI * (0.6 + Math.sin(t * 0.1 + i) * 0.3);
      const R1 = sphereR * (0.95 + Math.sin(t * 0.15 + i * 0.7) * 0.12);
      const R2 = sphereR * (0.95 + Math.cos(t * 0.12 + i * 1.1) * 0.12);

  // Make the web circular (no stretch)
  const ovalFactor = 1;
  const x0 = cx + Math.cos(angle0) * R1 * ovalFactor;
  const y0 = cy + Math.sin(angle0) * R1 * 0.85;
  const x1 = cx + Math.cos(angle1) * R2 * ovalFactor;
  const y1 = cy + Math.sin(angle1) * R2 * 0.85;

  const midA = (angle0 + angle1) * 0.5;
  const bulge = sphereR * (1.05 + Math.sin(t * 0.2 + i * 2.3) * 0.15);
  const cpx = cx + Math.cos(midA) * bulge * ovalFactor;
  const cpy = cy + Math.sin(midA) * bulge * 0.85;

  webPath.moveTo(x0, y0);
  webPath.quadraticCurveTo(cpx, cpy, x1, y1);
    }
  ctx.strokeStyle = `rgba(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b},0.1)`;
  // Make web lines thicker
  ctx.lineWidth = 1.7;
  ctx.strokeStyle = `rgba(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b},0.2)`;
    ctx.stroke(webPath);

    // ─── 3 · Tree trunk & branches ───
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Batch collectors for fine twigs + dots
    const twigPath = new Path2D();
    const leafDots: { x: number; y: number; r: number }[] = [];
    const mossLeafDots: { x: number; y: number; r: number }[] = [];
    const tipDots: { x: number; y: number; r: number }[] = [];

    for (const seg of branchesRef.current) {
      const sway = Math.sin(t * 0.35 + seg.phase) * seg.depth * 0.35;
      const droop = seg.depth > 3 ? (seg.depth - 3) * 0.8 : 0;
      const swayY = Math.cos(t * 0.25 + seg.phase * 1.3) * seg.depth * 0.12 + droop;

      const x2 = seg.x2 + sway;
      const y2 = seg.y2 + swayY;

      const { r, g, b: bv, alpha } = seg;

      if (seg.depth < 3) {
        // ═══ TRUNK & MAIN BRANCHES — multi-stroke bark/volume ═══
        const ddx = x2 - seg.x1, ddy = y2 - seg.y1;
        const segLen = Math.sqrt(ddx * ddx + ddy * ddy);
        if (segLen < 0.1) continue;
        const invLen = 1 / segLen;
        const perpX = -ddy * invLen;
        const perpY = ddx * invLen;
        const curvature = Math.sin(seg.phase + t * 0.12) * segLen * 0.1;

        const cp1x = seg.x1 + ddx * 0.3 + perpX * curvature;
        const cp1y = seg.y1 + ddy * 0.3 + perpY * curvature;
        const cp2x = seg.x1 + ddx * 0.7 + perpX * curvature * 0.6;
        const cp2y = seg.y1 + ddy * 0.7 + perpY * curvature * 0.6;

        const trunkBoost = seg.depth === 0 ? 2.2 : seg.depth === 1 ? 1.5 : 1;
        const w = Math.max(1.5, seg.width * trunkBoost);

        // Outer bark shadow
        ctx.beginPath();
        ctx.moveTo(seg.x1 + 0.8, seg.y1 + 0.8);
        ctx.bezierCurveTo(cp1x + 0.8, cp1y + 0.8, cp2x + 0.8, cp2y + 0.8, x2 + 0.8, y2 + 0.8);
        ctx.strokeStyle = `rgba(${Math.max(0, r - 60)},${Math.max(0, g - 50)},${Math.max(0, bv - 45)},${(alpha * 0.18).toFixed(3)})`;
  // Reduce shadow width for less blur
  ctx.lineWidth = w * 1.1;
        ctx.stroke();

        // Shadow/depth
        ctx.beginPath();
        ctx.moveTo(seg.x1 + 0.4, seg.y1 + 0.4);
        ctx.bezierCurveTo(cp1x + 0.4, cp1y + 0.4, cp2x + 0.4, cp2y + 0.4, x2 + 0.4, y2 + 0.4);
        ctx.strokeStyle = `rgba(${Math.max(0, r - 40)},${Math.max(0, g - 35)},${Math.max(0, bv - 30)},${(alpha * 0.3).toFixed(3)})`;
  // Reduce depth width for less blur
  ctx.lineWidth = w * 0.85;
        ctx.stroke();

        // Main trunk
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
        ctx.strokeStyle = `rgba(${r},${g},${bv},${alpha.toFixed(3)})`;
        ctx.lineWidth = w;
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.moveTo(seg.x1 - 0.4, seg.y1 - 0.4);
        ctx.bezierCurveTo(cp1x - 0.4, cp1y - 0.4, cp2x - 0.4, cp2y - 0.4, x2 - 0.4, y2 - 0.4);
        ctx.strokeStyle = `rgba(${Math.min(255, r + 35)},${Math.min(255, g + 30)},${Math.min(255, bv + 25)},${(alpha * 0.25).toFixed(3)})`;
        ctx.lineWidth = w * 0.3;
        ctx.stroke();

        // Bark fibers (batched into single beginPath)
        if (seg.depth < 2) {
          const fiberCount = seg.depth === 0 ? 5 : 3;
          ctx.strokeStyle = `rgba(${r},${g},${bv},${(alpha * 0.12).toFixed(3)})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let f = 0; f < fiberCount; f++) {
            const ft = 0.15 + (f / fiberCount) * 0.7;
            const spread = (f / fiberCount - 0.5) * w * 0.4;
            const fx = seg.x1 + ddx * ft + perpX * spread;
            const fy = seg.y1 + ddy * ft + perpY * spread;
            ctx.moveTo(fx, fy);
            ctx.lineTo(fx + ddx * 0.1, fy + ddy * 0.1);
          }
          ctx.stroke();
        }

      } else if (seg.depth < 7) {
        // ═══ MIDDLE BRANCHES — organic cubic curves ═══
        const ddx = x2 - seg.x1, ddy = y2 - seg.y1;
        const segLen = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        const invLen = 1 / segLen;
        const perpX = -ddy * invLen;
        const perpY = ddx * invLen;
        const curvature = Math.sin(seg.phase + t * 0.15) * segLen * 0.15;

        const cp1x = seg.x1 + ddx * 0.35 + perpX * curvature;
        const cp1y = seg.y1 + ddy * 0.35 + perpY * curvature;
        const cp2x = seg.x1 + ddx * 0.65 + perpX * curvature * 0.4;
        const cp2y = seg.y1 + ddy * 0.65 + perpY * curvature * 0.4;

        const w = Math.max(0.4, seg.width);

        // Shadow
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.bezierCurveTo(cp1x + 0.3, cp1y + 0.3, cp2x + 0.3, cp2y + 0.3, x2, y2);
        ctx.strokeStyle = `rgba(${Math.max(0, r - 30)},${Math.max(0, g - 25)},${Math.max(0, bv - 20)},${(alpha * 0.2).toFixed(3)})`;
        ctx.lineWidth = w * 1.2;
        ctx.stroke();

        // Main
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
        ctx.strokeStyle = `rgba(${r},${g},${bv},${alpha.toFixed(3)})`;
        ctx.lineWidth = w;
        ctx.stroke();

      } else {
        // ═══ FINE TWIGS — batched into single Path2D ═══
        const droopMx = (seg.x1 + x2) * 0.5 + Math.sin(seg.phase + t * 0.15) * 1.5;
        const droopMy = (seg.y1 + y2) * 0.5 + Math.abs(x2 - seg.x1) * 0.15 + Math.cos(seg.phase + t * 0.1);

        twigPath.moveTo(seg.x1, seg.y1);
        twigPath.quadraticCurveTo(droopMx, droopMy, x2, y2);

        // Sub-twig offshoots + foliage
        if (seg.isLeaf) {
          const twigAngle = Math.atan2(y2 - seg.y1, x2 - seg.x1);
          const twigCount = 2 + Math.floor(Math.abs(Math.sin(seg.phase * 5)) * 2);
          for (let ti = 0; ti < twigCount; ti++) {
            const offset = ((ti / (twigCount - 1 || 1)) - 0.5) * 1.2;
            const ta = twigAngle + offset;
            const twigLen = 4 + Math.sin(seg.phase + ti) * 3;
            const tx = x2 + Math.cos(ta) * twigLen;
            const ty = y2 + Math.sin(ta) * twigLen + twigLen * 0.3;
            const tcpx = x2 + Math.cos(ta) * twigLen * 0.5;
            const tcpy = y2 + Math.sin(ta) * twigLen * 0.5 + twigLen * 0.15;
            twigPath.moveTo(x2, y2);
            twigPath.quadraticCurveTo(tcpx, tcpy, tx, ty);

            const leafPulse = 0.5 + Math.sin(t * 0.6 + seg.phase + ti * 1.5) * 0.5;
            // Make leaf dots larger
            leafDots.push({ x: tx, y: ty, r: leafPulse * 1.7 });
          }

          const clusterCount = 3 + Math.floor(Math.abs(Math.sin(seg.phase * 7)) * 3);
          for (let fi = 0; fi < clusterCount; fi++) {
            const fa = seg.phase + fi * 1.1 + t * 0.05;
            const fr = 2 + Math.sin(fa * 2) * 2;
            const fx = x2 + Math.cos(fa) * fr;
            const fy = y2 + Math.sin(fa) * fr + fr * 0.2;
            const fPulse = 0.4 + Math.sin(t * 0.5 + fa) * 0.3;
            // Make moss leaf dots larger
            mossLeafDots.push({ x: fx, y: fy, r: 1.3 * fPulse });
          }
        }
      }

      // Golden tip dots
      if (seg.isLeaf) {
  // Make tip dots larger
  const pulse = 0.5 + Math.sin(t * 0.8 + seg.phase) * 0.5;
  tipDots.push({ x: x2, y: y2, r: 2.7 * pulse });
      }
    }

    // Draw all fine twigs (ONE stroke call instead of hundreds)
  ctx.strokeStyle = `rgba(${DARK_BROWN.r - 20},${DARK_BROWN.g - 15},${DARK_BROWN.b - 10},0.45)`;
    ctx.lineWidth = 0.25;
    ctx.stroke(twigPath);

    // Draw batched leaf dots (ONE fill call)
    if (leafDots.length > 0) {
  ctx.fillStyle = `rgba(${DARK_BROWN.r},${DARK_BROWN.g},${DARK_BROWN.b},0.3)`;
      ctx.beginPath();
      for (const d of leafDots) {
        ctx.moveTo(d.x + d.r, d.y);
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Draw batched moss foliage dots (ONE fill call)
    if (mossLeafDots.length > 0) {
  ctx.fillStyle = `rgba(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b},0.25)`;
      ctx.beginPath();
      for (const d of mossLeafDots) {
        ctx.moveTo(d.x + d.r, d.y);
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Draw batched golden tip dots (ONE fill call)
    if (tipDots.length > 0) {
  ctx.fillStyle = `rgba(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b},0.42)`;
      ctx.beginPath();
      for (const d of tipDots) {
        ctx.moveTo(d.x + d.r, d.y);
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // ─── 4 · Roots (batched into 2 Path2D strokes) ───
    const rootShadowPath = new Path2D();
    const rootMainPath = new Path2D();
    const rootTipDots: { x: number; y: number; r: number }[] = [];

    for (const seg of rootsRef.current) {
      const sway = Math.sin(t * 0.2 + seg.phase) * 1.5;
      const x2 = seg.x2 + sway;
      const y2 = seg.y2;

      const ddx = x2 - seg.x1, ddy = y2 - seg.y1;
      const segLen = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      const invLen = 1 / segLen;
      const perpX = -ddy * invLen;
      const perpY = ddx * invLen;
      const curvature = Math.sin(seg.phase + t * 0.12) * segLen * 0.12;

      const cp1x = seg.x1 + ddx * 0.3 + perpX * curvature;
      const cp1y = seg.y1 + ddy * 0.3 + perpY * curvature;
      const cp2x = seg.x1 + ddx * 0.7 + perpX * curvature * 0.5;
      const cp2y = seg.y1 + ddy * 0.7 + perpY * curvature * 0.5;

      rootShadowPath.moveTo(seg.x1 + 0.3, seg.y1 + 0.3);
      rootShadowPath.bezierCurveTo(cp1x + 0.3, cp1y + 0.3, cp2x + 0.3, cp2y + 0.3, x2 + 0.3, y2 + 0.3);

      rootMainPath.moveTo(seg.x1, seg.y1);
      rootMainPath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);

      if (seg.isLeaf) {
        const pulse = 0.5 + Math.sin(t * 0.6 + seg.phase) * 0.5;
        rootTipDots.push({ x: x2, y: y2, r: 1.8 * pulse });
      }
    }

  ctx.strokeStyle = `rgba(${DARK_BROWN.r},${DARK_BROWN.g},${DARK_BROWN.b},0.25)`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke(rootShadowPath);

  ctx.strokeStyle = `rgba(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b},0.5)`;
    ctx.lineWidth = 1.8;
    ctx.stroke(rootMainPath);

    if (rootTipDots.length > 0) {
  ctx.fillStyle = `rgba(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b},0.5)`;
      ctx.beginPath();
      for (const d of rootTipDots) {
        ctx.moveTo(d.x + d.r, d.y);
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // ─── 5 · Sphere glow nodes (pre-rendered sprite — no gradient creation) ───
    const sprite = glowSpriteRef.current;
    const spriteR = glowSpriteSize.current;
    if (sprite) {
  const goldStr = `rgb(${DARK_BROWN_MID.r},${DARK_BROWN_MID.g},${DARK_BROWN_MID.b})`;
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const node = nodes[i];
        const pulse = 0.6 + Math.sin(t * node.speed * 2 + node.phase) * 0.4;
        const nodeAlpha = p.glow * pulse;
        const glowR = 8 + pulse * 5;
        const scale = glowR / spriteR;

        ctx.globalAlpha = nodeAlpha;
        ctx.drawImage(
          sprite as CanvasImageSource,
          p.x - spriteR * scale,
          p.y - spriteR * scale,
          spriteR * 2 * scale,
          spriteR * 2 * scale,
        );

        ctx.globalAlpha = nodeAlpha * 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = goldStr;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ─── 6 · Centre glow (cached gradient) ───
    if (centreGradRef.current) {
      ctx.fillStyle = centreGradRef.current;
      ctx.fillRect(0, 0, W, H);
    }

    // ─── 7 · Bottom shadow (cached gradient) ───
    if (shadowGradRef.current) {
      const sg = shadowGeomRef.current;
      ctx.fillStyle = shadowGradRef.current;
      ctx.beginPath();
      ctx.ellipse(cx, sg.y, sg.rx, sg.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  // ── Lifecycle ──
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = cvs.parentElement!;
      const rect = parent.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      cvs.style.width = `${w}px`;
      cvs.style.height = `${h}px`;

      if (Math.abs(w - sizeRef.current.w) > 20 || Math.abs(h - sizeRef.current.h) > 20) {
        sizeRef.current = { w, h };
        rebuild(w, h);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [rebuild, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
};

export default WireframeTree;
