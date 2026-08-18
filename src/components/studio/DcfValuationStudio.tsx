"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function DcfValuationStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [cf0, setCf0] = useState(100), [growth, setGrowth] = useState(8), [discount, setDiscount] = useState(10), [tg, setTg] = useState(3), [nyears, setNyears] = useState(10);
  const r = discount / 100, g = growth / 100, gt = tg / 100;
  const flows: number[] = []; let pv = 0; let cf = cf0;
  for (let t = 1; t <= nyears; t++) { cf = cf0 * Math.pow(1 + g, t); flows.push(cf / Math.pow(1 + r, t)); pv += cf / Math.pow(1 + r, t); }
  const terminal = r > gt ? (cf * (1 + gt)) / (r - gt) / Math.pow(1 + r, nyears) : 0;
  const total = pv + terminal;

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 40, bw = (W - 70) / nyears, maxv = Math.max(...flows, 1);
    flows.forEach((v, i) => { const h = (v / maxv) * (H - 90); ctx.fillStyle = "#22d3ee"; ctx.fillRect(ox + i * bw + 2, oy - h, bw - 4, h); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("present value of each year's cash flow (shrinking)", ox, 22); ctx.fillText("years →", W - 70, oy + 18);
  }, [cf0, growth, discount, tg, nyears, flows]);

  return (
    <StudioChrome title="DCF Valuation" tagline="what future cash is worth today"
      controls={<div>
        <Slider label="Year-1 cash flow ($)" value={cf0} min={10} max={1000} step={10} onChange={setCf0} />
        <Slider label="Growth rate (%)" value={growth} min={0} max={20} step={0.5} onChange={setGrowth} />
        <Slider label="Discount rate (%)" value={discount} min={4} max={20} step={0.5} onChange={setDiscount} />
        <Slider label="Terminal growth (%)" value={tg} min={0} max={5} step={0.25} onChange={setTg} />
        <Slider label="Forecast years" value={nyears} min={3} max={15} step={1} onChange={setNyears} />
        <p className="mt-3 text-xs text-slate-500">Discounted cash flow values a business as the present worth of all its future cash. Distant cash is worth less because of the discount rate, and a terminal value captures everything beyond the forecast horizon. Educational tool, not financial advice.</p>
      </div>}
      inspector={<div>
        <Stat label="PV of forecast" value={`$${pv.toFixed(0)}`} />
        <Stat label="Terminal value (PV)" value={`$${terminal.toFixed(0)}`} />
        <Stat label="Total valuation" value={`$${total.toFixed(0)}`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
