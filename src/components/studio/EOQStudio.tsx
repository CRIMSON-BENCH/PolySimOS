"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { D: number; S: number; Hc: number }> = {
  "High-volume retail": { D: 40000, S: 50, Hc: 2 },
  "Bulk pricey orders": { D: 6000, S: 250, Hc: 1 },
  "Cheap reorders": { D: 15000, S: 20, Hc: 3 },
  "Costly storage": { D: 20000, S: 80, Hc: 8 },
};

// Economic Order Quantity.
export function EOQStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ D, S, Hc }, update] = useShareableNumbers({ D: 10000, S: 50, Hc: 2 });

  const eoq = Math.sqrt(2 * D * S / Hc); const totalCost = (q: number) => (D / q) * S + (q / 2) * Hc;
  const optCost = totalCost(eoq); const orders = D / eoq;

  const explain =
    orders > 20
      ? `Ordering is cheap relative to holding here, so the optimum is many small batches — about ${orders.toFixed(0)} orders a year — and even then yearly ordering and holding costs come out equal.`
      : orders < 4
      ? `A high order cost or low holding cost favours large, infrequent batches — only about ${orders.toFixed(1)} orders a year — yet ordering and holding costs still balance exactly at the EOQ.`
      : `At the EOQ the two curves cross: yearly ordering cost equals yearly holding cost, giving about ${orders.toFixed(1)} orders a year at the minimum total cost.`;

  const code = `import math
D, S, H = ${D}, ${S}, ${Hc}
eoq = math.sqrt(2*D*S/H)
print("EOQ", round(eoq), "units")
print("orders/yr", round(D/eoq, 1))
print("min total cost", round((D/eoq)*S + (eoq/2)*H))`;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 35, pw = W - 70, ph = H - 55; const qMax = eoq * 3, cMax = totalCost(eoq * 0.15);
    const X = (q: number) => ox + (q / qMax) * pw; const Y = (c: number) => oy - (c / cMax) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const plot = (fn: (q: number) => number, col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 1; i <= pw; i++) { const q = (i / pw) * qMax; const y = Y(fn(q)); i === 1 ? ctx.moveTo(ox + i, y) : ctx.lineTo(ox + i, y); } ctx.stroke(); };
    plot((q) => (D / q) * S, "#f472b6"); plot((q) => (q / 2) * Hc, "#a3e635"); plot(totalCost, "#22d3ee");
    ctx.strokeStyle = "#e2e8f0"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(eoq), oy); ctx.lineTo(X(eoq), Y(optCost)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#f9a8d4"; ctx.font = "10px sans-serif"; ctx.fillText("ordering", ox + 6, oy - ph + 14); ctx.fillStyle = "#bef264"; ctx.fillText("holding", ox + 60, oy - ph + 14); ctx.fillStyle = "#67e8f9"; ctx.fillText("total", ox + 116, oy - ph + 14);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("EOQ", X(eoq) - 12, oy + 14); ctx.fillText("order quantity →", ox + pw - 100, oy + 26);
  }, [D, S, Hc, eoq, optCost]);

  return (
    <StudioChrome title="Economic Order Quantity" tagline="the inventory sweet spot"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Annual demand D" value={D} min={500} max={50000} step={500} onChange={(v) => update({ D: v })} />
        <Slider label="Cost per order S ($)" value={S} min={10} max={300} step={10} onChange={(v) => update({ S: v })} />
        <Slider label="Holding cost H ($/unit/yr)" value={Hc} min={0.5} max={10} step={0.5} onChange={(v) => update({ Hc: v })} />
        <p className="mt-3 text-xs text-slate-500">Order too often and ordering costs pile up; order too much and holding costs balloon. The Economic Order Quantity, EOQ = √(2DS/H), is the order size that minimizes their sum. At the optimum the ordering and holding costs are exactly equal — the crossing point of the two curves. The foundation of inventory management.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="EOQ" value={`${eoq.toFixed(0)} units`} /><Stat label="Orders / year" value={orders.toFixed(1)} /><Stat label="Min total cost" value={`$${optCost.toFixed(0)}`} /><Equation tex={`Q^* = \\sqrt{\\frac{2DS}{H}} = \\sqrt{\\frac{2\\cdot${D}\\cdot${S}}{${Hc}}} = ${eoq.toFixed(0)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
