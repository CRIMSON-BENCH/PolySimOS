"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function SvmMarginStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(45), [offset, setOffset] = useState(0);
  const A = angle * Math.PI / 180;
  const classA = [[-1.2, 0.8], [-0.8, 1.4], [-1.5, 0.2], [-0.6, 0.5], [-1.0, 1.0]];
  const classB = [[1.0, -0.6], [1.4, -1.2], [0.7, -0.3], [1.2, -0.9], [0.9, -1.5]];
  // boundary direction (cosA, sinA); signed distance of points; margin = min |dist|
  const nrm = [Math.cos(A), Math.sin(A)];
  const dist = (p: number[]) => p[0] * nrm[0] + p[1] * nrm[1] - offset;
  const margin = Math.min(...classA.map(p => Math.abs(dist(p))), ...classB.map(p => Math.abs(dist(p))));
  const correct = classA.every(p => dist(p) < 0) && classB.every(p => dist(p) > 0);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const cx = W / 2, cy = H / 2, sc = 80;
    // boundary line perpendicular to nrm through offset*nrm
    const dir = [-Math.sin(A), Math.cos(A)]; const c0 = [offset * nrm[0], offset * nrm[1]];
    const drawLine = (o: number, col: string, dash: boolean) => { ctx.strokeStyle = col; ctx.lineWidth = 2; if (dash) ctx.setLineDash([5, 5]); ctx.beginPath(); const p1 = [c0[0] + o * nrm[0] - dir[0] * 3, c0[1] + o * nrm[1] - dir[1] * 3], p2 = [c0[0] + o * nrm[0] + dir[0] * 3, c0[1] + o * nrm[1] + dir[1] * 3]; ctx.moveTo(cx + p1[0] * sc, cy - p1[1] * sc); ctx.lineTo(cx + p2[0] * sc, cy - p2[1] * sc); ctx.stroke(); ctx.setLineDash([]); };
    drawLine(margin, "#475569", true); drawLine(-margin, "#475569", true); drawLine(0, "#a3e635", false);
    classA.forEach(p => { ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(cx + p[0] * sc, cy - p[1] * sc, 5, 0, Math.PI * 2); ctx.fill(); });
    classB.forEach(p => { ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(cx + p[0] * sc, cy - p[1] * sc, 5, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("maximize the margin between the two classes", 12, 20);
  }, [angle, offset, margin]);

  return (
    <StudioChrome title="SVM Maximum Margin" tagline="the widest possible street"
      controls={<div>
        <Slider label="Boundary angle (°)" value={angle} min={0} max={180} step={1} onChange={setAngle} />
        <Slider label="Boundary offset" value={offset} min={-1.5} max={1.5} step={0.05} onChange={setOffset} />
        <p className="mt-3 text-xs text-slate-500">A support vector machine picks the separating line with the widest margin to the nearest points of each class — the support vectors. A fatter margin generalizes better to new data. Try to hand-tune the line to maximize the dashed gap. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Margin width" value={margin.toFixed(3)} />
        <Stat label="Separates classes?" value={correct ? "yes ✓" : "no — misclassified"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
