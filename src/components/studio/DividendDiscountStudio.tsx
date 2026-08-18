"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { d1: number; g: number; r: number }> = {
  "Utility stock": { d1: 3, g: 2, r: 7 },
  "Growth stock": { d1: 1, g: 6, r: 9 },
  "High yield": { d1: 5, g: 1, r: 8 },
  "Near-trap (g≈r)": { d1: 2, g: 7, r: 8 },
};

export function DividendDiscountStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ d1, g, r }, update] = useShareableNumbers({ d1: 2, g: 4, r: 9 });
  const value = r > g ? d1 / ((r - g) / 100) : Infinity;
  const yieldPct = isFinite(value) ? d1 / value * 100 : 0;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 32, pw = W - 70, ph = H - 52, gmax = r - 0.2;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const vAt = (gg: number) => d1 / ((r - gg) / 100); const vmax = vAt(gmax * 0.95);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const gg = gmax * i / pw; const v = vAt(gg); const y = oy - Math.min(1, v / vmax) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    if (g < r) { const gx = ox + (g / gmax) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(gx, oy); ctx.lineTo(gx, oy - Math.min(1, value / vmax) * ph); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("share value explodes as growth approaches discount rate", ox + 6, oy - ph + 12); ctx.fillText("growth g →", ox + pw - 70, oy + 18);
  }, [d1, g, r, value]);

  const gap = r - g;
  const explain = !isFinite(value)
    ? "With growth g ≥ required return r the Gordon model diverges — no finite price, because dividends are assumed to out-run your discount rate forever."
    : gap < 1.5
    ? `Only ${gap.toFixed(2)} points separate growth from your required return, so the price hangs on that razor-thin gap — nudge either input and the value swings wildly.`
    : `Fair value P = D₁/(r − g) = $${value.toFixed(2)} rests on a ${gap.toFixed(2)}-point gap; note the ${yieldPct.toFixed(1)}% yield plus ${g}% growth recovers your ${r}% required return.`;

  const code = `d1, g, r = ${d1}, ${g}, ${r}          # $, %, %
if r > g:
    price = d1 / ((r - g) / 100)   # Gordon growth model
    print("fair value", round(price, 2), "yield %", round(d1 / price * 100, 2))
else:
    print("undefined: g >= r, model diverges")`;

  return (
    <StudioChrome title="Dividend Discount (Gordon)" tagline="valuing a dividend stock"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Next dividend D₁ ($)" value={d1} min={0.5} max={10} step={0.25} onChange={(v) => update({ d1: v })} />
        <Slider label="Dividend growth g (%)" value={g} min={0} max={8} step={0.25} onChange={(v) => update({ g: v })} />
        <Slider label="Required return r (%)" value={r} min={4} max={15} step={0.25} onChange={(v) => update({ r: v })} />
        <p className="mt-3 text-xs text-slate-500">The Gordon growth model prices a stock as P = D₁/(r − g): next year&apos;s dividend divided by the gap between your required return and the dividend growth rate. As growth nears the discount rate the value shoots up — which is why the model is so sensitive. Educational tool, not financial advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Fair value" value={isFinite(value) ? `$${value.toFixed(2)}` : "undefined (g ≥ r)"} />
        <Stat label="Implied dividend yield" value={`${yieldPct.toFixed(2)}%`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
