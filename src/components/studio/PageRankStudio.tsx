"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const NODES = [[90, 90], [250, 60], [420, 100], [130, 250], [300, 230], [440, 250]].map(([x, y]) => ({ x, y }));
const LINKS: [number, number][] = [[0, 1], [1, 2], [2, 4], [3, 0], [3, 4], [4, 1], [5, 4], [4, 3], [1, 3], [2, 5]];

export function PageRankStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [damping, setDamping] = useState(0.85);

  const N = NODES.length; const out: number[][] = Array.from({ length: N }, () => []); LINKS.forEach(([u, v]) => out[u].push(v));
  let pr = new Array(N).fill(1 / N);
  for (let it = 0; it < 60; it++) { const next = new Array(N).fill((1 - damping) / N);
    for (let u = 0; u < N; u++) { if (out[u].length === 0) { for (let v = 0; v < N; v++) next[v] += damping * pr[u] / N; } else for (const v of out[u]) next[v] += damping * pr[u] / out[u].length; } pr = next; }
  const maxPr = Math.max(...pr);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 320);
    LINKS.forEach(([u, v]) => { const a = NODES[u], b = NODES[v]; ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      const ang = Math.atan2(b.y - a.y, b.x - a.x); const ex = b.x - Math.cos(ang) * 20, ey = b.y - Math.sin(ang) * 20; ctx.fillStyle = "#475569"; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(ang - 0.4) * 8, ey - Math.sin(ang - 0.4) * 8); ctx.lineTo(ex - Math.cos(ang + 0.4) * 8, ey - Math.sin(ang + 0.4) * 8); ctx.fill(); });
    NODES.forEach((n, i) => { const r = 8 + (pr[i] / maxPr) * 22; ctx.fillStyle = "#22d3ee"; ctx.globalAlpha = 0.4 + 0.6 * pr[i] / maxPr; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = "#e2e8f0"; ctx.font = "10px sans-serif"; ctx.fillText(`${(pr[i] * 100).toFixed(0)}%`, n.x - 10, n.y + 3); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("node size ∝ PageRank", 12, 18);
  }, [damping]);

  return (
    <StudioChrome title="PageRank" tagline="the algorithm that built Google"
      controls={<div>
        <Slider label="Damping factor d" value={damping} min={0.5} max={0.95} step={0.05} onChange={setDamping} />
        <p className="mt-3 text-xs text-slate-500">PageRank ranks nodes by importance: a page is important if important pages link to it. It is computed by imagining a random surfer who follows links with probability d and jumps randomly otherwise, then finding where they spend the most time. This eigenvector of the link matrix launched Google and now ranks everything from proteins to social influence.</p>
      </div>}
      inspector={<div><Stat label="Damping" value={damping.toFixed(2)} /><Stat label="Top node" value={`${(maxPr * 100).toFixed(1)}%`} /><Stat label="Method" value="power iteration" /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
