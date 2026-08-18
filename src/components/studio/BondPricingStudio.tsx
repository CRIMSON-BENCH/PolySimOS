"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function BondPricingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [face, setFace] = useState(1000);
  const [coupon, setCoupon] = useState(0.05);
  const [yield_, setYield] = useState(0.04);
  const [yearsN, setYearsN] = useState(10);
  const [freq, setFreq] = useState(2);

  const priceAt = (y: number) => { const n = yearsN * freq; const c = face * coupon / freq; const per = y / freq; let p = 0; for (let t = 1; t <= n; t++) p += c / Math.pow(1 + per, t); p += face / Math.pow(1 + per, n); return p; };
  const price = priceAt(yield_);
  // Macaulay duration
  const n = yearsN * freq, c = face * coupon / freq, per = yield_ / freq;
  let dur = 0; for (let t = 1; t <= n; t++) dur += (t / freq) * (c / Math.pow(1 + per, t)); dur += (n / freq) * (face / Math.pow(1 + per, n)); dur /= price;
  const modDur = dur / (1 + per);

  useEffect(() => {
    const W = 500, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 35, pw = W - 70, ph = H - 55; const yLo = 0, yHi = 0.15;
    const prices = []; for (let i = 0; i <= 100; i++) prices.push(priceAt(yLo + (i / 100) * (yHi - yLo)));
    const pMax = prices[0], pMin = prices[prices.length - 1];
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); prices.forEach((p, i) => { const x = ox + (i / 100) * pw; const y = oy - ((p - pMin) / (pMax - pMin)) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    const mx = ox + (yield_ / yHi) * pw; const my = oy - ((price - pMin) / (pMax - pMin)) * ph;
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(mx, my, 5, 0, 7); ctx.fill();
    // par line
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); const py = oy - ((face - pMin) / (pMax - pMin)) * ph; ctx.beginPath(); ctx.moveTo(ox, py); ctx.lineTo(ox + pw, py); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("price vs yield", ox + 6, oy - ph + 12); ctx.fillText("par", ox + pw - 24, py - 4); ctx.fillText("yield →", ox + pw - 50, oy + 18);
  }, [face, coupon, yield_, yearsN, freq]);

  return (
    <StudioChrome title="Bond Pricing & Duration" tagline="price · yield · interest-rate risk"
      controls={<div>
        <Slider label="Face value ($)" value={face} min={100} max={10000} step={100} onChange={setFace} />
        <Slider label="Coupon rate" value={coupon} min={0} max={0.12} step={0.005} onChange={setCoupon} />
        <Slider label="Yield to maturity" value={yield_} min={0.005} max={0.15} step={0.005} onChange={setYield} />
        <Slider label="Years to maturity" value={yearsN} min={1} max={30} step={1} onChange={setYearsN} />
        <div className="mt-3 flex gap-2">{[1, 2, 4].map((f) => <button key={f} onClick={() => setFreq(f)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${freq === f ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{f === 1 ? "Annual" : f === 2 ? "Semi" : "Quarterly"}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">A bond&apos;s price is the present value of its coupons and face value, discounted at the yield. Price moves inversely to yield along a convex curve. Duration measures that sensitivity — a modified duration of 8 means roughly an 8% price drop per 1% rise in yield. Educational tool, not investment advice.</p>
      </div>}
      inspector={<div><Stat label="Price" value={`$${price.toFixed(2)}`} /><Stat label="Premium/discount" value={price > face ? "premium" : price < face ? "discount" : "par"} /><Stat label="Macaulay duration" value={`${dur.toFixed(2)} yr`} /><Stat label="Modified duration" value={modDur.toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
