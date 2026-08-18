"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { cf0: number; growth: number; discount: number; tg: number; nyears: number }> = {
  "High-growth startup": { cf0: 80, growth: 18, discount: 15, tg: 3, nyears: 10 },
  "Stable blue-chip": { cf0: 500, growth: 4, discount: 8, tg: 2.5, nyears: 10 },
  "Value stock": { cf0: 300, growth: 3, discount: 10, tg: 2, nyears: 5 },
  "Speculative long horizon": { cf0: 50, growth: 15, discount: 18, tg: 3, nyears: 15 },
};

export function DcfValuationStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ cf0, growth, discount, tg, nyears }, update] = useShareableNumbers({ cf0: 100, growth: 8, discount: 10, tg: 3, nyears: 10 });
  const r = discount / 100, g = growth / 100, gt = tg / 100;
  const flows: number[] = []; let pv = 0; let cf = cf0;
  for (let t = 1; t <= nyears; t++) { cf = cf0 * Math.pow(1 + g, t); flows.push(cf / Math.pow(1 + r, t)); pv += cf / Math.pow(1 + r, t); }
  const terminal = r > gt ? (cf * (1 + gt)) / (r - gt) / Math.pow(1 + r, nyears) : 0;
  const total = pv + terminal;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 40, bw = (W - 70) / nyears, maxv = Math.max(...flows, 1);
    flows.forEach((v, i) => { const h = (v / maxv) * (H - 90); ctx.fillStyle = "#22d3ee"; ctx.fillRect(ox + i * bw + 2, oy - h, bw - 4, h); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("present value of each year's cash flow (shrinking)", ox, 22); ctx.fillText("years →", W - 70, oy + 18);
  }, [cf0, growth, discount, tg, nyears, flows]);

  const tvShare = total > 0 ? (terminal / total) * 100 : 0;
  const explain =
    r <= gt
      ? "Terminal growth meets or exceeds the discount rate, so the terminal-value formula diverges — a valuation is only meaningful when the discount rate stays above long-run growth."
      : tvShare > 65
      ? `The terminal value is ${tvShare.toFixed(0)}% of the total, so most of this valuation rests on cash beyond year ${nyears} — it is highly sensitive to the terminal-growth and discount-rate assumptions.`
      : tvShare < 35
      ? `Only ${tvShare.toFixed(0)}% of value sits in the terminal, so the explicit forecast years carry the valuation and near-term growth matters most.`
      : `A ${(discount - growth).toFixed(1)}-point gap between discount and growth shrinks each later year of present value; the terminal still accounts for ${tvShare.toFixed(0)}% of the total.`;

  const code = `cf0, g, r, gt, n = ${cf0}, ${growth}/100, ${discount}/100, ${tg}/100, ${nyears}
pv = sum(cf0*(1+g)**t / (1+r)**t for t in range(1, n+1))
cfn = cf0*(1+g)**n
tv = (cfn*(1+gt)/(r-gt)) / (1+r)**n if r > gt else 0.0
print("PV", round(pv), "terminal", round(tv), "total", round(pv+tv))`;

  return (
    <StudioChrome title="DCF Valuation" tagline="what future cash is worth today"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Year-1 cash flow ($)" value={cf0} min={10} max={1000} step={10} onChange={(v) => update({ cf0: v })} />
        <Slider label="Growth rate (%)" value={growth} min={0} max={20} step={0.5} onChange={(v) => update({ growth: v })} />
        <Slider label="Discount rate (%)" value={discount} min={4} max={20} step={0.5} onChange={(v) => update({ discount: v })} />
        <Slider label="Terminal growth (%)" value={tg} min={0} max={5} step={0.25} onChange={(v) => update({ tg: v })} />
        <Slider label="Forecast years" value={nyears} min={3} max={15} step={1} onChange={(v) => update({ nyears: v })} />
        <p className="mt-3 text-xs text-slate-500">Discounted cash flow values a business as the present worth of all its future cash. Distant cash is worth less because of the discount rate, and a terminal value captures everything beyond the forecast horizon. Educational tool, not financial advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="PV of forecast" value={`$${pv.toFixed(0)}`} />
        <Stat label="Terminal value (PV)" value={`$${terminal.toFixed(0)}`} />
        <Stat label="Total valuation" value={`$${total.toFixed(0)}`} />
        <Equation tex={`V=\\sum_{t=1}^{${nyears}}\\frac{FCF_t}{(1+r)^t}+\\frac{TV}{(1+r)^{${nyears}}},\\quad r=${r.toFixed(2)},\\ TV=\\$${Math.round(terminal)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
