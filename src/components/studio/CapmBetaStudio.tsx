"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { rf: number; rm: number; beta: number }> = {
  "Defensive utility": { rf: 3, rm: 9, beta: 0.5 },
  "Market tracker": { rf: 3, rm: 9, beta: 1 },
  "Aggressive tech": { rf: 3, rm: 9, beta: 1.8 },
  "Low-rate boom": { rf: 0.5, rm: 12, beta: 1.3 },
};

export function CapmBetaStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ rf, rm, beta }, update] = useShareableNumbers({ rf: 3, rm: 9, beta: 1.2 });
  const expected = rf + beta * (rm - rf);

  const explain =
    beta > 1
      ? `Beta above 1 amplifies the market premium: this asset is expected to return ${expected.toFixed(2)}%, above the ${rm}% market, and to swing harder in both directions.`
      : beta < 1
      ? `Beta below 1 dampens the market premium: the ${expected.toFixed(2)}% expected return sits below the ${rm}% market, the trade-off for a smoother ride.`
      : "At beta 1 the asset moves with the market, so its expected return equals the market return — no extra premium, no discount.";

  const code = `rf, rm, beta = ${rf}, ${rm}, ${beta}
expected = rf + beta * (rm - rf)   # CAPM
premium = beta * (rm - rf)
print("expected return %", round(expected, 2), "premium %", round(premium, 2))`;

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
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Risk-free rate (%)" value={rf} min={0} max={6} step={0.25} onChange={(v) => update({ rf: v })} />
        <Slider label="Market return (%)" value={rm} min={4} max={15} step={0.5} onChange={(v) => update({ rm: v })} />
        <Slider label="Asset beta β" value={beta} min={0} max={2.5} step={0.05} onChange={(v) => update({ beta: v })} />
        <p className="mt-3 text-xs text-slate-500">The Capital Asset Pricing Model says an asset&apos;s expected return equals the risk-free rate plus beta times the market risk premium. Beta measures how much a stock swings with the market — a beta of 2 is twice as volatile, and demands twice the premium. Educational tool, not financial advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Expected return" value={`${expected.toFixed(2)}%`} />
        <Stat label="Risk premium" value={`${(beta * (rm - rf)).toFixed(2)}%`} />
        <Stat label="Risk profile" value={beta > 1 ? "aggressive" : beta < 1 ? "defensive" : "market"} />
        <Equation tex={`E[R]=R_f+\\beta\\,(R_m-R_f)=${rf}+${beta}\\,(${rm}-${rf})=${expected.toFixed(2)}\\%`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
