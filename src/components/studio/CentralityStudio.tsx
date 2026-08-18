"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi } from "@/lib/studioKit";

type Metric = "degree" | "betweenness" | "closeness";
const NODES = [[80, 180], [180, 80], [180, 280], [300, 180], [420, 90], [420, 270], [500, 180]].map(([x, y]) => ({ x, y }));
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6]];

export function CentralityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metric, setMetric] = useState<Metric>("betweenness");

  const N = NODES.length; const adj: number[][] = Array.from({ length: N }, () => []); EDGES.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
  const degree = adj.map((a) => a.length);
  // betweenness + closeness via BFS shortest paths
  const bet = new Array(N).fill(0); const closeSum = new Array(N).fill(0);
  for (let s = 0; s < N; s++) { const dist = new Array(N).fill(-1); const nPaths = new Array(N).fill(0); const order: number[] = []; const preds: number[][] = Array.from({ length: N }, () => []);
    dist[s] = 0; nPaths[s] = 1; const q = [s]; while (q.length) { const u = q.shift()!; order.push(u); for (const w of adj[u]) { if (dist[w] < 0) { dist[w] = dist[u] + 1; q.push(w); } if (dist[w] === dist[u] + 1) { nPaths[w] += nPaths[u]; preds[w].push(u); } } }
    for (let t = 0; t < N; t++) if (dist[t] > 0) closeSum[s] += dist[t];
    const delta = new Array(N).fill(0); for (let i = order.length - 1; i >= 0; i--) { const w = order[i]; for (const v of preds[w]) delta[v] += (nPaths[v] / nPaths[w]) * (1 + delta[w]); if (w !== s) bet[w] += delta[w]; }
  }
  const closeness = closeSum.map((c) => c > 0 ? (N - 1) / c : 0);
  const vals = metric === "degree" ? degree : metric === "betweenness" ? bet : closeness; const maxV = Math.max(...vals, 1e-9);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, 560, 340); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 560, 340);
    EDGES.forEach(([u, v]) => { ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(NODES[u].x, NODES[u].y); ctx.lineTo(NODES[v].x, NODES[v].y); ctx.stroke(); });
    NODES.forEach((n, i) => { const r = 10 + (vals[i] / maxV) * 22; ctx.fillStyle = "#22d3ee"; ctx.globalAlpha = 0.35 + 0.65 * vals[i] / maxV; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = "#e2e8f0"; ctx.font = "bold 11px sans-serif"; ctx.fillText(String.fromCharCode(65 + i), n.x - 4, n.y + 4); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`node size ∝ ${metric} centrality`, 12, 20);
  }, [metric, vals, maxV]);

  const topI = vals.indexOf(Math.max(...vals));
  const topLabel = String.fromCharCode(65 + topI);
  const explain =
    metric === "degree"
      ? `By degree, node ${topLabel} leads simply because it has the most direct links — a raw popularity count that ignores the wider network.`
      : metric === "betweenness"
      ? `By betweenness, node ${topLabel} is the key broker: it sits on the most shortest paths, so removing it would fracture the network even if it has few direct links.`
      : `By closeness, node ${topLabel} reaches every other node in the fewest hops on average — the best-positioned spreader in the network.`;

  const code = `import networkx as nx
edges = [(0,1),(0,2),(1,3),(2,3),(3,4),(3,5),(4,6),(5,6)]
G = nx.Graph(edges)
c = nx.${metric}_centrality(G)
print("most central:", max(c, key=c.get))
print(c)`;

  return (
    <StudioChrome title="Network Centrality" tagline="who matters most"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-2">{(["degree", "betweenness", "closeness"] as Metric[]).map((m) => <button key={m} onClick={() => setMetric(m)} className={`rounded-lg px-1 py-1 text-xs font-semibold capitalize ${metric === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">Centrality measures which nodes are most important in a network. Degree counts direct connections; betweenness counts how often a node lies on shortest paths (a bridge or broker); closeness measures how near a node is to all others. Switching metrics changes who matters — a key insight for social networks, infrastructure, and epidemiology.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Metric" value={metric} /><Stat label="Most central" value={String.fromCharCode(65 + topI)} /><Stat label="Nodes" value={String(NODES.length)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={560} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
