"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { p: number; b: number }> = {
  "Slight edge": { p: 0.55, b: 1 },
  "Coin-flip, 2:1 payoff": { p: 0.5, b: 2 },
  "Longshot 3:1": { p: 0.35, b: 3 },
  "No edge (do not bet)": { p: 0.5, b: 1 },
};

export function KellyCriterionStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ p, b }, update] = useShareableNumbers({ p: 0.55, b: 1 });
  const q = 1 - p;
  const kelly = (b * p - q) / b;
  const growth = (f: number) => f <= 0 || f >= 1 ? -Infinity : p * Math.log(1 + b * f) + q * Math.log(1 - f);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H / 2 + 60, pw = W - 65, ph = H - 60;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy - ph / 2); ctx.lineTo(ox, oy + ph / 2); ctx.stroke();
    let gmax = 0; for (let i = 1; i < 100; i++) gmax = Math.max(gmax, growth(i / 100));
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); let started = false; for (let i = 0; i <= pw; i++) { const f = i / pw; const gr = growth(f); if (!isFinite(gr)) { started = false; continue; } const y = oy - (gr / (gmax || 1)) * (ph / 2); const x = ox + i; started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true; } ctx.stroke();
    if (kelly > 0) { const kx = ox + kelly * pw; ctx.strokeStyle = "#a3e635"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(kx, oy + ph / 2); ctx.lineTo(kx, oy - (gmax / (gmax || 1)) * (ph / 2)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#a3e635"; ctx.fillText("Kelly optimum", kx + 4, oy - 40); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("long-run growth rate vs fraction bet", ox + 6, 20); ctx.fillText("bet fraction →", ox + pw - 90, oy + ph / 2 - 4);
  }, [p, b, kelly]);

  const explain =
    kelly <= 0
      ? "With these odds bp ≤ q, so your expected edge is non-positive — Kelly says stake nothing, because any bet shrinks your bankroll over the long run."
      : kelly > 0.25
      ? `A ${(kelly * 100).toFixed(0)}% stake is aggressive: it maximizes growth but the swings are brutal, which is why most practitioners bet half-Kelly (~${(kelly * 50).toFixed(0)}%) for far smoother compounding at little cost to growth.`
      : `Kelly stakes ${(kelly * 100).toFixed(1)}% of your bankroll per bet — the fraction that maximizes long-run growth; betting more raises volatility without raising growth, and eventually courts ruin.`;

  const code = `import numpy as np
p, b = ${p}, ${b}
q = 1 - p
kelly = (b*p - q) / b
growth = lambda f: p*np.log(1+b*f) + q*np.log(1-f)
print("Kelly fraction", kelly)
print("half-Kelly (safer)", kelly/2)`;

  return (
    <StudioChrome title="Kelly Criterion" tagline="the mathematically optimal bet size"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Win probability p" value={p} min={0.3} max={0.8} step={0.01} onChange={(v) => update({ p: v })} />
        <Slider label="Win/loss payoff ratio b" value={b} min={0.2} max={5} step={0.1} onChange={(v) => update({ b: v })} />
        <p className="mt-3 text-xs text-slate-500">The Kelly criterion gives the bet fraction that maximizes long-run growth: f = (bp − q)/b. Bet less and you grow slower; bet more and volatility eventually ruins you. Many practitioners use a fraction of Kelly to tame the swings. Educational tool, not financial advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Kelly fraction" value={kelly > 0 ? `${(kelly * 100).toFixed(1)}%` : "do not bet"} />
        <Stat label="Edge (bp − q)" value={(b * p - q).toFixed(3)} />
        <Stat label="Half-Kelly (safer)" value={kelly > 0 ? `${(kelly * 50).toFixed(1)}%` : "—"} />
        <Equation tex={`f^* = \\frac{bp - q}{b} = \\frac{(${b})(${p}) - ${q.toFixed(2)}}{${b}} = ${kelly.toFixed(3)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
