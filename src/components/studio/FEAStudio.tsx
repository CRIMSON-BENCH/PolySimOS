"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { starterTruss, solveTruss } from "@/lib/engines/fea";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 480;

export function FEAStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const base = useMemo(() => starterTruss(), []);
  const [load, setLoad] = useState(-20);
  const [scale, setScale] = useState(20);

  const result = useMemo(() => {
    const nodes = base.nodes.map((n, i) => (i === 3 ? { ...n, fy: load } : { ...n }));
    return { nodes, res: solveTruss(nodes, base.members) };
  }, [base, load]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 180, oy = 300, sc = 1.4;
    const P = (x: number, y: number) => [ox + x * sc, oy - y * sc] as const;
    const { nodes, res } = result;
    const dnode = (i: number) => {
      const dx = res.ok ? res.disp[2 * i] * scale : 0, dy = res.ok ? res.disp[2 * i + 1] * scale : 0;
      return P(nodes[i].x + dx, nodes[i].y + dy);
    };
    // undeformed (ghost)
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1;
    base.members.forEach((m) => { const a = P(nodes[m.a].x, nodes[m.a].y), b = P(nodes[m.b].x, nodes[m.b].y); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); });
    // deformed, colored by axial force
    const maxF = Math.max(1, ...res.memberForce.map((f) => Math.abs(f)));
    base.members.forEach((m, i) => {
      const f = res.memberForce[i] || 0; const t = Math.abs(f) / maxF;
      ctx.strokeStyle = f >= 0 ? `rgba(34,211,238,${0.4 + t * 0.6})` : `rgba(244,114,182,${0.4 + t * 0.6})`;
      ctx.lineWidth = 2 + t * 4;
      const a = dnode(m.a), b = dnode(m.b); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    });
    // nodes + supports + load
    nodes.forEach((n, i) => { const [x, y] = dnode(i); ctx.fillStyle = (n.fixedX || n.fixedY) ? "#a3e635" : "#e2e8f0"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui";
    ctx.fillText("tension", 20, 24); ctx.fillStyle = "#f472b6"; ctx.fillText("compression", 90, 24);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("load ↓ at right tip", W - 180, H - 16);
  }, [result, base, scale]);

  const maxDisp = result.res.ok ? Math.max(...result.res.disp.map(Math.abs)) : 0;
  const maxForce = result.res.ok ? Math.max(...result.res.memberForce.map(Math.abs)) : 0;

  return (
    <StudioChrome
      title="FEA — 2D Truss Studio"
      tagline="direct stiffness method · axial forces"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">A finite-element truss under a tip load. Members are colored by axial force; the shape shows the (scaled) deformation.</p>
          <Slider label="Tip load (down)" value={load} min={-60} max={0} step={2} onChange={setLoad} />
          <Slider label="Deformation ×" value={scale} min={0} max={60} step={2} onChange={setScale} />
        </div>
      }
      inspector={<div><Stat label="Nodes" value={String(base.nodes.length)} /><Stat label="Members" value={String(base.members.length)} /><Stat label="Solve" value={result.res.ok ? "converged" : "singular"} /><Stat label="Max displacement" value={maxDisp.toFixed(3)} /><Stat label="Max axial force" value={maxForce.toFixed(1)} /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
