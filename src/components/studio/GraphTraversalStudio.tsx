"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi } from "@/lib/studioKit";

const NODES = [[280, 50], [150, 130], [410, 130], [90, 230], [210, 230], [350, 230], [470, 230], [210, 320], [350, 320]].map(([x, y]) => ({ x, y }));
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [4, 7], [5, 8], [4, 5]];

export function GraphTraversalStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"bfs" | "dfs">("bfs");
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const N = NODES.length; const adj: number[][] = Array.from({ length: N }, () => []); EDGES.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
    // compute visit order
    const order: number[] = []; const seen = new Array(N).fill(false);
    if (mode === "bfs") { const q = [0]; seen[0] = true; while (q.length) { const u = q.shift()!; order.push(u); for (const v of adj[u]) if (!seen[v]) { seen[v] = true; q.push(v); } } }
    else { const st = [0]; while (st.length) { const u = st.pop()!; if (seen[u]) continue; seen[u] = true; order.push(u); for (let i = adj[u].length - 1; i >= 0; i--) if (!seen[adj[u][i]]) st.push(adj[u][i]); } }
    let raf = 0; let step = 0; let frame = 0;
    const loop = () => {
      frame++; if (running && frame % 30 === 0 && step < order.length) step++;
      const visited = new Set(order.slice(0, step)); const current = order[step - 1];
      const ctx = hidpi(canvasRef.current!, 560, 360); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 560, 360);
      EDGES.forEach(([u, v]) => { ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(NODES[u].x, NODES[u].y); ctx.lineTo(NODES[v].x, NODES[v].y); ctx.stroke(); });
      NODES.forEach((n, i) => { const vi = order.indexOf(i); const isV = visited.has(i); ctx.fillStyle = i === current ? "#f472b6" : isV ? "#22d3ee" : "#1e293b"; ctx.strokeStyle = "#64748b"; ctx.beginPath(); ctx.arc(n.x, n.y, 17, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = isV ? "#0b1220" : "#94a3b8"; ctx.font = "bold 11px sans-serif"; if (isV && vi >= 0 && vi < step) ctx.fillText(String(vi + 1), n.x - 4, n.y + 4); });
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${mode.toUpperCase()} visit order (numbers)`, 12, 20);
      if (running && frame % 30 === 0 && step >= order.length) step = 0;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [mode, running]);

  const explain =
    mode === "bfs"
      ? "BFS uses a FIFO queue, so it fully visits every node at distance 1 before any at distance 2 — that level-by-level order is exactly why it finds shortest paths in unweighted graphs."
      : "DFS uses a LIFO stack, so it dives down one branch to the end before backtracking — ideal for cycle detection and topological sorting, but the path it finds is rarely the shortest.";

  const code = `from collections import deque
adj = {0:[1,2], 1:[0,3,4], 2:[0,5,6], 3:[1], 4:[1,7,5], 5:[2,8,4], 6:[2], 7:[4], 8:[5]}
def ${mode}(adj, s=0):
    seen, order = {s}, []
    frontier = deque([s])
    while frontier:
        u = frontier.${mode === "bfs" ? "popleft" : "pop"}()
        order.append(u)
        for v in adj[u]:
            if v not in seen:
                seen.add(v); frontier.append(v)
    return order
print(${mode}(adj))`;

  return (
    <StudioChrome title="Graph Traversal (BFS / DFS)" tagline="breadth vs depth"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-2">{(["bfs", "dfs"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-2 py-1 text-xs font-semibold uppercase ${mode === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>)}</div>
        <button onClick={() => setRunning((r) => !r)} className="w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Play"}</button>
        <p className="mt-3 text-xs text-slate-500">The two ways to explore a graph. Breadth-first search fans out level by level using a queue, visiting all near nodes before far ones — ideal for shortest paths. Depth-first search plunges as deep as possible using a stack, backtracking when stuck — ideal for cycle detection and topological sorting. Watch the numbered visit order differ.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Mode" value={mode.toUpperCase()} /><Stat label="Structure" value={mode === "bfs" ? "queue (FIFO)" : "stack (LIFO)"} /><Stat label="Nodes" value={String(NODES.length)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={560} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
