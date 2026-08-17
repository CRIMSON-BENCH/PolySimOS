"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Two-asset efficient frontier.
export function EfficientFrontierStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rA, setRA] = useState(0.08); const [rB, setRB] = useState(0.14);
  const [sA, setSA] = useState(0.12); const [sB, setSB] = useState(0.28);
  const [corr, setCorr] = useState(0.2);
  const [minVar, setMinVar] = useState({ w: 0, ret: 0, vol: 0 });

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 360; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 35, pw = W - 80, ph = H - 60;
    const pts: { w: number; ret: number; vol: number }[] = [];
    for (let i = 0; i <= 100; i++) { const w = i / 100; const ret = w * rA + (1 - w) * rB; const varr = w * w * sA * sA + (1 - w) * (1 - w) * sB * sB + 2 * w * (1 - w) * corr * sA * sB; pts.push({ w, ret, vol: Math.sqrt(varr) }); }
    const mv = pts.reduce((m, p) => p.vol < m.vol ? p : m, pts[0]); setMinVar(mv);
    const volMax = Math.max(sA, sB) * 1.15, retMin = Math.min(rA, rB) - 0.02, retMax = Math.max(rA, rB) + 0.02;
    const X = (v: number) => ox + (v / volMax) * pw; const Y = (rr: number) => oy - ((rr - retMin) / (retMax - retMin)) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((p, i) => { const x = X(p.vol), y = Y(p.ret); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    // assets
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(X(sA), Y(rA), 5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(X(sB), Y(rB), 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(mv.vol), Y(mv.ret), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText("A", X(sA) + 8, Y(rA)); ctx.fillText("B", X(sB) + 8, Y(rB)); ctx.fillText("min-variance", X(mv.vol) + 8, Y(mv.ret));
    ctx.fillStyle = "#94a3b8"; ctx.fillText("risk (volatility) →", ox + pw - 110, oy + 20); ctx.save(); ctx.translate(16, oy - ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("expected return", -40, 0); ctx.restore();
  }, [rA, rB, sA, sB, corr]);

  return (
    <StudioChrome title="Efficient Frontier" tagline="Markowitz portfolio theory"
      controls={<div>
        <Slider label="Asset A return" value={rA} min={0} max={0.2} step={0.005} onChange={setRA} />
        <Slider label="Asset A volatility" value={sA} min={0.02} max={0.4} step={0.01} onChange={setSA} />
        <Slider label="Asset B return" value={rB} min={0} max={0.2} step={0.005} onChange={setRB} />
        <Slider label="Asset B volatility" value={sB} min={0.02} max={0.4} step={0.01} onChange={setSB} />
        <Slider label="Correlation" value={corr} min={-1} max={1} step={0.05} onChange={setCorr} />
        <p className="mt-3 text-xs text-slate-500">Combining two assets traces a curved frontier of risk versus return. Because they are not perfectly correlated, some mixes have lower risk than either asset alone — the power of diversification. The pink point is the minimum-variance portfolio. Educational tool, not investment advice.</p>
      </div>}
      inspector={<div><Stat label="Min-var weight A" value={`${(minVar.w * 100).toFixed(0)}%`} /><Stat label="Min-var return" value={`${(minVar.ret * 100).toFixed(1)}%`} /><Stat label="Min-var volatility" value={`${(minVar.vol * 100).toFixed(1)}%`} /></div>}
    ><canvas ref={canvasRef} width={500} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
