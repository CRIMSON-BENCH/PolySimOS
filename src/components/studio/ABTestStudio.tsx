"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

function normCDF(x: number) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }

export function ABTestStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nA, setNA] = useState(1000);
  const [cA, setCA] = useState(100);
  const [nB, setNB] = useState(1000);
  const [cB, setCB] = useState(125);

  const pA = cA / nA, pB = cB / nB; const pPool = (cA + cB) / (nA + nB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));
  const z = se > 0 ? (pB - pA) / se : 0; const pVal = 2 * (1 - normCDF(Math.abs(z)));
  const lift = pA > 0 ? (pB - pA) / pA * 100 : 0; const sig = pVal < 0.05;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // two conversion-rate distributions (normal approx)
    const ox = 30, oy = H - 40, pw = W - 60, ph = H - 70; const lo = Math.min(pA, pB) - 0.06, hi = Math.max(pA, pB) + 0.06;
    const X = (p: number) => ox + ((p - lo) / (hi - lo)) * pw;
    const draw = (p: number, n: number, col: string) => { const s = Math.sqrt(p * (1 - p) / n); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = lo + (i / 200) * (hi - lo); const y = oy - Math.exp(-((x - p) ** 2) / (2 * s * s)) * ph * 0.9; i ? ctx.lineTo(ox + (i / 200) * pw, y) : ctx.moveTo(ox + (i / 200) * pw, y); } ctx.stroke();
      ctx.strokeStyle = col; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(p), oy); ctx.lineTo(X(p), oy - ph * 0.9); ctx.stroke(); ctx.setLineDash([]); };
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    draw(pA, nA, "#64748b"); draw(pB, nB, "#22d3ee");
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("A (gray) vs B (cyan) conversion rate", ox + 6, 16); ctx.fillText("conversion rate →", ox + pw - 110, oy + 20);
  }, [nA, cA, nB, cB]);

  return (
    <StudioChrome title="A/B Test Significance" tagline="two-proportion z-test"
      controls={<div>
        <Slider label="A visitors" value={nA} min={100} max={5000} step={100} onChange={setNA} />
        <Slider label="A conversions" value={cA} min={0} max={nA} step={5} onChange={setCA} />
        <Slider label="B visitors" value={nB} min={100} max={5000} step={100} onChange={setNB} />
        <Slider label="B conversions" value={cB} min={0} max={nB} step={5} onChange={setCB} />
        <p className="mt-3 text-xs text-slate-500">An A/B test compares two conversion rates to see if a difference is real or just noise. The two-proportion z-test pools the data to estimate the standard error, then a p-value below 0.05 signals a statistically significant difference. Bigger samples separate the two curves and make small lifts detectable.</p>
      </div>}
      inspector={<div><Stat label="Rate A" value={`${(pA * 100).toFixed(2)}%`} /><Stat label="Rate B" value={`${(pB * 100).toFixed(2)}%`} /><Stat label="Lift" value={`${lift > 0 ? "+" : ""}${lift.toFixed(1)}%`} /><Stat label="p-value" value={pVal.toFixed(4)} /><Stat label="Result" value={sig ? "significant" : "not significant"} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
