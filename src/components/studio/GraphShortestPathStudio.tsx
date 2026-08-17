"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";

const NODES = [[70, 90], [200, 50], [200, 180], [340, 80], [340, 220], [470, 130]].map(([x, y]) => ({ x, y }));
const EDGES: [number, number, number][] = [[0, 1, 4], [0, 2, 3], [1, 2, 2], [1, 3, 5], [2, 4, 6], [3, 4, 3], [3, 5, 4], [4, 5, 2], [2, 3, 4]];

export function GraphShortestPathStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [target, setTarget] = useState(5);

  const N = NODES.length; const adj: [number, number][][] = Array.from({ length: N }, () => []);
  EDGES.forEach(([u, v, w]) => { adj[u].push([v, w]); adj[v].push([u, w]); });
  const dist = new Array(N).fill(Infinity); const prev = new Array(N).fill(-1); dist[0] = 0; const seen = new Array(N).fill(false);
  for (let it = 0; it < N; it++) { let u = -1, bd = Infinity; for (let i = 0; i < N; i++) if (!seen[i] && dist[i] < bd) { bd = dist[i]; u = i; } if (u < 0) break; seen[u] = true; for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } }
  const path = new Set<string>(); let c = target; while (prev[c] >= 0) { path.add(`${Math.min(c, prev[c])}-${Math.max(c, prev[c])}`); c = prev[c]; }

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 280);
    EDGES.forEach(([u, v, w]) => { const on = path.has(`${Math.min(u, v)}-${Math.max(u, v)}`); ctx.strokeStyle = on ? "#a3e635" : "#334155"; ctx.lineWidth = on ? 3 : 1.5; ctx.beginPath(); ctx.moveTo(NODES[u].x, NODES[u].y); ctx.lineTo(NODES[v].x, NODES[v].y); ctx.stroke(); const mx = (NODES[u].x + NODES[v].x) / 2, my = (NODES[u].y + NODES[v].y) / 2; ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(String(w), mx - 4, my - 4); });
    NODES.forEach((n, i) => { ctx.fillStyle = i === 0 ? "#22d3ee" : i === target ? "#f472b6" : "#1e293b"; ctx.strokeStyle = "#64748b"; ctx.beginPath(); ctx.arc(n.x, n.y, 18, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = i === 0 || i === target ? "#0b1220" : "#e2e8f0"; ctx.font = "bold 12px sans-serif"; ctx.fillText(String.fromCharCode(65 + i), n.x - 5, n.y - 1); ctx.font = "9px sans-serif"; ctx.fillText(dist[i] === Infinity ? "∞" : String(dist[i]), n.x - 4, n.y + 10); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("click a node to set the destination", 12, 20);
  }, [target]);

  return (
    <StudioChrome title="Shortest Path (Dijkstra)" tagline="weighted graph search"
      controls={<div>
        <p className="mt-1 text-xs text-slate-500">Dijkstra&apos;s algorithm finds the shortest path from a source (A, blue) to every other node in a weighted graph, always expanding the closest unvisited node next. The number inside each node is its shortest distance from A; the green edges trace the optimal route to your chosen destination. It powers GPS routing, network protocols, and logistics. Click any node to re-target.</p>
      </div>}
      inspector={<div><Stat label="Source" value="A" /><Stat label="Destination" value={String.fromCharCode(65 + target)} /><Stat label="Shortest distance" value={dist[target] === Infinity ? "∞" : String(dist[target])} /></div>}
    ><canvas ref={canvasRef} width={540} height={280} onClick={(e) => { const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); const x = (e.clientX - r.left) * 540 / r.width, y = (e.clientY - r.top) * 280 / r.height; let best = target, bd = 900; NODES.forEach((n, i) => { const d = (n.x - x) ** 2 + (n.y - y) ** 2; if (d < bd && i !== 0) { bd = d; best = i; } }); setTarget(best); }} className="mx-auto h-auto max-w-full cursor-pointer rounded-lg" /></StudioChrome>
  );
}
