"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function CapmBetaStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [rf, setRf] = useState(3), [rm, setRm] = useState(9), [beta, setBeta] = useState(1.2);
  const expected = rf + beta * (rm - rf);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 32, pw = W - 65, ph = H - 52, bmax = 2.5, rmax = rf + bmax * (rm - rf) * 1.1;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // security market line
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy - (rf / rmax) * ph); ctx.lineTo(ox + pw, oy - ((rf + bmax * (rm - rf)) / rmax) * ph); ctx.stroke();
    // markers rf (beta 0) and market (beta 1)
    [{ b: 0, l: "risk-free" }, { b: 1, l: "market" }, { b: beta, l: "you" }].forEach((m, i) => { const x = ox + (m.b / bmax) * pw; const rr = rf + m.b * (rm - rf); const y = oy - (rr / rmax) * ph; ctx.fillStyle = i === 2 ? "#f472b6" : "#a3e635"; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#94a3b8"; ctx.fillText(m.l, x - 10, y - 10); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("Security Market Line: expected return vs beta", ox + 6, oy - ph + 12); ctx.fillText("beta →", ox + pw - 44, oy + 18);
  }, [rf, rm, beta, expected]);

  return (
    <StudioChrome title="CAPM & Beta" tagline="pricing risk"
      controls={<div>
        <Slider label="Risk-free rate (%)" value={rf} min={0} max={6} step={0.25} onChange={setRf} />
        <Slider label="Market return (%)" value={rm} min={4} max={15} step={0.5} onChange={setRm} />
        <Slider label="Asset beta β" value={beta} min={0} max={2.5} step={0.05} onChange={setBeta} />
        <p className="mt-3 text-xs text-slate-500">The Capital Asset Pricing Model says an asset&apos;s expected return equals the risk-free rate plus beta times the market risk premium. Beta measures how much a stock swings with the market — a beta of 2 is twice as volatile, and demands twice the premium. Educational tool, not financial advice.</p>
      </div>}
      inspector={<div>
        <Stat label="Expected return" value={`${expected.toFixed(2)}%`} />
        <Stat label="Risk premium" value={`${(beta * (rm - rf)).toFixed(2)}%`} />
        <Stat label="Risk profile" value={beta > 1 ? "aggressive" : beta < 1 ? "defensive" : "market"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
