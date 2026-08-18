"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { rA: number; rB: number; sA: number; sB: number; corr: number }> = {
  "Stocks + bonds": { rA: 0.05, rB: 0.11, sA: 0.06, sB: 0.2, corr: 0.1 },
  "Uncorrelated pair": { rA: 0.08, rB: 0.1, sA: 0.15, sB: 0.18, corr: 0 },
  "Perfect diversifier": { rA: 0.09, rB: 0.09, sA: 0.15, sB: 0.15, corr: -0.9 },
  "Redundant (high corr)": { rA: 0.08, rB: 0.12, sA: 0.14, sB: 0.24, corr: 0.9 },
};

// Two-asset efficient frontier.
export function EfficientFrontierStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ rA, rB, sA, sB, corr }, update] = useShareableNumbers({ rA: 0.08, rB: 0.14, sA: 0.12, sB: 0.28, corr: 0.2 });
  const [minVar, setMinVar] = useState({ w: 0, ret: 0, vol: 0 });

  useEffect(() => {
    const W = 500, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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

  const explain =
    corr <= -0.5
      ? "Strongly negative correlation: blending the two assets can push risk far below either one alone — diversification at its most powerful."
      : corr >= 0.8
      ? "Highly correlated assets move together, so mixing them barely lowers risk and the frontier is nearly a straight line."
      : Math.abs(sA - sB) > 0.1
      ? "The assets differ sharply in volatility, so the minimum-variance blend leans heavily toward the calmer one to hold total risk down."
      : "Imperfect correlation bows the frontier leftward: some blends carry less risk than either asset held on its own.";

  const code = `import numpy as np
rA, rB, sA, sB, corr = ${rA}, ${rB}, ${sA}, ${sB}, ${corr}
w = np.linspace(0, 1, 101)
ret = w*rA + (1 - w)*rB
vol = np.sqrt(w**2*sA**2 + (1 - w)**2*sB**2 + 2*w*(1 - w)*corr*sA*sB)
i = int(vol.argmin())
print("min-var weight A", w[i], "ret", ret[i], "vol", vol[i])`;

  return (
    <StudioChrome title="Efficient Frontier" tagline="Markowitz portfolio theory"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Asset A return" value={rA} min={0} max={0.2} step={0.005} onChange={(v) => update({ rA: v })} />
        <Slider label="Asset A volatility" value={sA} min={0.02} max={0.4} step={0.01} onChange={(v) => update({ sA: v })} />
        <Slider label="Asset B return" value={rB} min={0} max={0.2} step={0.005} onChange={(v) => update({ rB: v })} />
        <Slider label="Asset B volatility" value={sB} min={0.02} max={0.4} step={0.01} onChange={(v) => update({ sB: v })} />
        <Slider label="Correlation" value={corr} min={-1} max={1} step={0.05} onChange={(v) => update({ corr: v })} />
        <p className="mt-3 text-xs text-slate-500">Combining two assets traces a curved frontier of risk versus return. Because they are not perfectly correlated, some mixes have lower risk than either asset alone — the power of diversification. The pink point is the minimum-variance portfolio. Educational tool, not investment advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Min-var weight A" value={`${(minVar.w * 100).toFixed(0)}%`} /><Stat label="Min-var return" value={`${(minVar.ret * 100).toFixed(1)}%`} /><Stat label="Min-var volatility" value={`${(minVar.vol * 100).toFixed(1)}%`} /><Equation tex={`\\sigma_p^2 = w^2\\sigma_A^2 + (1-w)^2\\sigma_B^2 + 2w(1-w)\\rho\\,\\sigma_A\\sigma_B,\\quad \\rho=${corr.toFixed(2)},\\ w^*=${(minVar.w * 100).toFixed(0)}\\%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
