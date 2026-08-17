"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const COLORS = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#c084fc", "#fb7185"];

export function GraphColoringStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nNodes, setNNodes] = useState(10);
  const [seed, setSeed] = useState(1);
  const [used, setUsed] = useState(0);

  useEffect(() => {
    let s = seed * 3299 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const N = Math.round(nNodes); const nodes = Array.from({ length: N }, (_, i) => ({ x: 270 + Math.cos(i / N * 6.283) * 140, y: 180 + Math.sin(i / N * 6.283) * 130 }));
    const adj: boolean[][] = Array.from({ length: N }, () => new Array(N).fill(false)); const edges: [number, number][] = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (rnd() < 0.28) { adj[i][j] = adj[j][i] = true; edges.push([i, j]); }
    // greedy coloring
    const color = new Array(N).fill(-1);
    for (let i = 0; i < N; i++) { const forbidden = new Set<number>(); for (let j = 0; j < N; j++) if (adj[i][j] && color[j] >= 0) forbidden.add(color[j]); let c = 0; while (forbidden.has(c)) c++; color[i] = c; }
    setUsed(Math.max(...color) + 1);
    const ctx = canvasRef.current!.getContext("2d")!; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 360);
    edges.forEach(([u, v]) => { ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(nodes[u].x, nodes[u].y); ctx.lineTo(nodes[v].x, nodes[v].y); ctx.stroke(); });
    nodes.forEach((n, i) => { ctx.fillStyle = COLORS[color[i] % COLORS.length]; ctx.beginPath(); ctx.arc(n.x, n.y, 13, 0, 7); ctx.fill(); ctx.strokeStyle = "#0b1220"; ctx.lineWidth = 2; ctx.stroke(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("no two connected nodes share a color", 12, 20);
  }, [nNodes, seed]);

  return (
    <StudioChrome title="Graph Coloring" tagline="the chromatic number"
      controls={<div>
        <Slider label="Nodes" value={nNodes} min={5} max={16} step={1} onChange={setNNodes} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New graph</button>
        <p className="mt-3 text-xs text-slate-500">Graph coloring assigns colors to nodes so that no edge connects two of the same color, using as few colors as possible. The greedy algorithm colors nodes in order, picking the lowest color not used by a neighbor. It models scheduling exams, assigning radio frequencies, and register allocation in compilers — all cases where conflicting items must be separated.</p>
      </div>}
      inspector={<div><Stat label="Nodes" value={String(Math.round(nNodes))} /><Stat label="Colors used" value={String(used)} /><Stat label="Method" value="greedy" /></div>}
    ><canvas ref={canvasRef} width={540} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
