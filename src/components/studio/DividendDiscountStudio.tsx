"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function DividendDiscountStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [d1, setD1] = useState(2), [g, setG] = useState(4), [r, setR] = useState(9);
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

  return (
    <StudioChrome title="Dividend Discount (Gordon)" tagline="valuing a dividend stock"
      controls={<div>
        <Slider label="Next dividend D₁ ($)" value={d1} min={0.5} max={10} step={0.25} onChange={setD1} />
        <Slider label="Dividend growth g (%)" value={g} min={0} max={8} step={0.25} onChange={setG} />
        <Slider label="Required return r (%)" value={r} min={4} max={15} step={0.25} onChange={setR} />
        <p className="mt-3 text-xs text-slate-500">The Gordon growth model prices a stock as P = D₁/(r − g): next year&apos;s dividend divided by the gap between your required return and the dividend growth rate. As growth nears the discount rate the value shoots up — which is why the model is so sensitive. Educational tool, not financial advice.</p>
      </div>}
      inspector={<div>
        <Stat label="Fair value" value={isFinite(value) ? `$${value.toFixed(2)}` : "undefined (g ≥ r)"} />
        <Stat label="Implied dividend yield" value={`${yieldPct.toFixed(2)}%`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
