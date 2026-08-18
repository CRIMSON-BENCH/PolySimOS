"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function MSTStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nNodes, setNNodes] = useState(9);
  const [seed, setSeed] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let s = seed * 6997 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const N = Math.round(nNodes); const nodes = Array.from({ length: N }, () => ({ x: 40 + rnd() * 460, y: 30 + rnd() * 300 }));
    // build edges between nearby nodes
    const edges: [number, number, number][] = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y); if (d < 200) edges.push([i, j, Math.round(d)]); }
    edges.sort((a, b) => a[2] - b[2]);
    // Kruskal with union-find
    const par = Array.from({ length: N }, (_, i) => i); const find = (x: number): number => par[x] === x ? x : (par[x] = find(par[x]));
    const mst = new Set<number>(); let tot = 0;
    edges.forEach(([u, v, w], idx) => { const ru = find(u), rv = find(v); if (ru !== rv) { par[ru] = rv; mst.add(idx); tot += w; } });
    setTotal(tot);
    const ctx = hidpi(canvasRef.current!, 540, 360); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 360);
    edges.forEach(([u, v], idx) => { const on = mst.has(idx); ctx.strokeStyle = on ? "#a3e635" : "#1e293b"; ctx.lineWidth = on ? 2.5 : 1; ctx.beginPath(); ctx.moveTo(nodes[u].x, nodes[u].y); ctx.lineTo(nodes[v].x, nodes[v].y); ctx.stroke(); });
    nodes.forEach((n) => { ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(n.x, n.y, 7, 0, 7); ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("minimum spanning tree (green)", 12, 20);
  }, [nNodes, seed]);

  return (
    <StudioChrome title="Minimum Spanning Tree" tagline="Kruskal's algorithm"
      controls={<div>
        <Slider label="Nodes" value={nNodes} min={5} max={20} step={1} onChange={setNNodes} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New graph</button>
        <p className="mt-3 text-xs text-slate-500">A minimum spanning tree connects every node with the least possible total edge weight and no cycles. Kruskal&apos;s algorithm sorts all edges and adds the cheapest that does not form a cycle, using a union-find structure to detect them. It designs efficient road, power, and network layouts that reach everywhere for the lowest cost.</p>
      </div>}
      inspector={<div><Stat label="Nodes" value={String(Math.round(nNodes))} /><Stat label="Tree edges" value={String(Math.round(nNodes) - 1)} /><Stat label="Total weight" value={String(total)} /></div>}
    ><canvas ref={canvasRef} width={540} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
