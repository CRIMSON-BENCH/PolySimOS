"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { p: number }> = {
  "Ring lattice": { p: 0 },
  "Small-world": { p: 0.1 },
  "Half rewired": { p: 0.5 },
  "Random graph": { p: 1 },
};

// Watts-Strogatz small-world network.
export function SmallWorldStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ p }, update] = useShareableNumbers({ p: 0.1 });
  const [seed, setSeed] = useState(1);
  const [stats, setStats] = useState({ cluster: 0, pathLen: 0 });

  useEffect(() => {
    const N = 24, K = 4; let s = seed * 5651 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const adj: Set<number>[] = Array.from({ length: N }, () => new Set());
    for (let i = 0; i < N; i++) for (let k = 1; k <= K / 2; k++) { adj[i].add((i + k) % N); adj[(i + k) % N].add(i); }
    // rewire
    for (let i = 0; i < N; i++) for (let k = 1; k <= K / 2; k++) { if (rnd() < p) { const j = (i + k) % N; adj[i].delete(j); adj[j].delete(i); let nn = (rnd() * N) | 0; while (nn === i || adj[i].has(nn)) nn = (rnd() * N) | 0; adj[i].add(nn); adj[nn].add(i); } }
    // clustering coefficient
    let cSum = 0; for (let i = 0; i < N; i++) { const nb = [...adj[i]]; let links = 0; for (let a = 0; a < nb.length; a++) for (let b = a + 1; b < nb.length; b++) if (adj[nb[a]].has(nb[b])) links++; const poss = nb.length * (nb.length - 1) / 2; cSum += poss ? links / poss : 0; }
    // avg path length via BFS
    let pSum = 0, cnt = 0; for (let src = 0; src < N; src++) { const d = new Array(N).fill(-1); d[src] = 0; const q = [src]; while (q.length) { const u = q.shift()!; for (const v of adj[u]) if (d[v] < 0) { d[v] = d[u] + 1; q.push(v); } } for (let t = 0; t < N; t++) if (t !== src && d[t] > 0) { pSum += d[t]; cnt++; } }
    setStats({ cluster: cSum / N, pathLen: pSum / cnt });
    const ctx = hidpi(canvasRef.current!, 400, 360); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 400, 360);
    const cx = 200, cy = 180, R = 140; const pos = Array.from({ length: N }, (_, i) => ({ x: cx + Math.cos(i / N * 6.283) * R, y: cy + Math.sin(i / N * 6.283) * R }));
    for (let i = 0; i < N; i++) for (const j of adj[i]) if (j > i) { const long = Math.min((j - i + N) % N, (i - j + N) % N) > K / 2; ctx.strokeStyle = long ? "#f472b6" : "#334155"; ctx.lineWidth = long ? 1.5 : 1; ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke(); }
    pos.forEach((pp) => { ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(pp.x, pp.y, 6, 0, 7); ctx.fill(); });
    ctx.fillStyle = "#f9a8d4"; ctx.font = "11px sans-serif"; ctx.fillText("pink = rewired shortcut", 10, 20);
  }, [p, seed]);

  const explain =
    p < 0.02
      ? "Pure ring lattice: high local clustering, but news must hop neighbor-to-neighbor the whole way around — long average paths."
      : p < 0.2
      ? "Small-world regime: a few random shortcuts collapse the average path length while clustering stays high — the six-degrees effect."
      : p < 0.6
      ? "Many edges rewired: paths are now short, but the tight local clustering of the ring is starting to fade."
      : "Nearly random graph: paths are short but clustering is low — the ordered neighborhood structure has essentially dissolved.";

  const code = `import networkx as nx
G = nx.watts_strogatz_graph(24, 4, ${p})
print("clustering", nx.average_clustering(G))
print("avg path length", nx.average_shortest_path_length(G))`;

  return (
    <StudioChrome title="Small-World Network" tagline="Watts-Strogatz rewiring"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Rewiring probability p" value={p} min={0} max={1} step={0.02} onChange={(v) => update({ p: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">Regenerate</button>
        <p className="mt-3 text-xs text-slate-500">Start with an orderly ring where everyone knows their neighbors, then randomly rewire a few connections. Even a handful of long-range shortcuts collapses the average path length — the six-degrees-of-separation effect — while keeping high local clustering. This small-world structure appears in social networks, the brain, and power grids.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Rewiring p" value={p.toFixed(2)} /><Stat label="Clustering" value={stats.cluster.toFixed(3)} /><Stat label="Avg path length" value={stats.pathLen.toFixed(2)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={400} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
