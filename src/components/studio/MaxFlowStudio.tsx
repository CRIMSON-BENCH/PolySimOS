"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Max flow (Edmonds-Karp) on a fixed network.
export function MaxFlowStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capSA, setCapSA] = useState(10);
  const [capBT, setCapBT] = useState(10);

  const nodes = [{ id: 0, x: 40, y: 160, l: "S" }, { id: 1, x: 200, y: 70, l: "A" }, { id: 2, x: 200, y: 250, l: "B" }, { id: 3, x: 360, y: 70, l: "C" }, { id: 4, x: 360, y: 250, l: "D" }, { id: 5, x: 500, y: 160, l: "T" }];
  const edges: [number, number, number][] = [[0, 1, capSA], [0, 2, 8], [1, 3, 9], [2, 4, capBT], [1, 2, 4], [3, 5, 10], [4, 5, 10], [3, 4, 6]];
  const N = 6;
  // Edmonds-Karp
  const cap = Array.from({ length: N }, () => new Array(N).fill(0)); edges.forEach(([u, v, c]) => cap[u][v] = c);
  const flow = Array.from({ length: N }, () => new Array(N).fill(0)); let maxflow = 0;
  for (;;) { const par = new Array(N).fill(-1); par[0] = 0; const q = [0]; while (q.length) { const u = q.shift()!; for (let v = 0; v < N; v++) if (par[v] < 0 && cap[u][v] - flow[u][v] > 0) { par[v] = u; q.push(v); } }
    if (par[5] < 0) break; let bottle = Infinity; for (let v = 5; v !== 0; v = par[v]) bottle = Math.min(bottle, cap[par[v]][v] - flow[par[v]][v]);
    for (let v = 5; v !== 0; v = par[v]) { flow[par[v]][v] += bottle; flow[v][par[v]] -= bottle; } maxflow += bottle; }

  useEffect(() => {
    const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    edges.forEach(([u, v, c]) => { const a = nodes[u], b = nodes[v]; const f = flow[u][v]; ctx.strokeStyle = f > 0 ? "#22d3ee" : "#334155"; ctx.lineWidth = f > 0 ? 1.5 + f / 2 : 1.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText(`${Math.max(0, f)}/${c}`, mx - 10, my - 4); });
    nodes.forEach((n) => { ctx.fillStyle = n.id === 0 ? "#a3e635" : n.id === 5 ? "#f472b6" : "#1e293b"; ctx.strokeStyle = "#64748b"; ctx.beginPath(); ctx.arc(n.x, n.y, 20, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = n.id === 0 || n.id === 5 ? "#0b1220" : "#e2e8f0"; ctx.font = "bold 13px sans-serif"; ctx.fillText(n.l, n.x - 5, n.y + 4); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("source S → sink T", 14, 20);
  }, [capSA, capBT]);

  return (
    <StudioChrome title="Maximum Flow" tagline="Edmonds-Karp network flow"
      controls={<div>
        <Slider label="Capacity S→A" value={capSA} min={0} max={20} step={1} onChange={setCapSA} />
        <Slider label="Capacity B→D" value={capBT} min={0} max={20} step={1} onChange={setCapBT} />
        <p className="mt-3 text-xs text-slate-500">The max-flow problem asks how much can be pushed from a source to a sink through a network of capacity-limited edges. Edmonds-Karp repeatedly finds an augmenting path and saturates it until none remain. By the max-flow min-cut theorem, the answer equals the capacity of the cheapest set of edges that, if cut, disconnects source from sink — the bottleneck.</p>
      </div>}
      inspector={<div><Stat label="Maximum flow" value={String(maxflow)} /><Stat label="Nodes" value={String(N)} /><Stat label="Bottleneck" value="min cut" /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
