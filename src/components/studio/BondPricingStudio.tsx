"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { face: number; coupon: number; yield_: number; yearsN: number }> = {
  "Premium bond": { face: 1000, coupon: 0.06, yield_: 0.04, yearsN: 10 },
  "Discount bond": { face: 1000, coupon: 0.03, yield_: 0.07, yearsN: 15 },
  "Par bond": { face: 1000, coupon: 0.05, yield_: 0.05, yearsN: 10 },
  "Long duration": { face: 1000, coupon: 0.02, yield_: 0.05, yearsN: 30 },
};

export function BondPricingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ face, coupon, yield_, yearsN }, update] = useShareableNumbers({ face: 1000, coupon: 0.05, yield_: 0.04, yearsN: 10 });
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

  const explain =
    price > face
      ? `The coupon beats the ${(yield_ * 100).toFixed(1)}% yield, so the bond sells at a premium — about ${(price / face * 100 - 100).toFixed(1)}% over par — and its ${modDur.toFixed(1)} modified duration is the % price drop per +1% yield.`
      : price < face
      ? `The ${(yield_ * 100).toFixed(1)}% yield beats the coupon, so the bond sells at a discount below par, and a ${modDur.toFixed(1)} modified duration means a roughly ${modDur.toFixed(1)}% price fall per +1% yield.`
      : `Coupon equals yield, so the bond prices right at par — yet its ${modDur.toFixed(1)} modified duration still exposes it to rate moves.`;

  const code = `face, coupon, y, years, freq = ${face}, ${coupon}, ${yield_}, ${yearsN}, ${freq}
n = years * freq; c = face * coupon / freq; per = y / freq
price = sum(c / (1 + per) ** t for t in range(1, n + 1)) + face / (1 + per) ** n
dur = (sum((t / freq) * c / (1 + per) ** t for t in range(1, n + 1)) + (n / freq) * face / (1 + per) ** n) / price
mod = dur / (1 + per)
print("price", round(price, 2), "macaulay", round(dur, 2), "modified", round(mod, 2))`;

  return (
    <StudioChrome title="Bond Pricing & Duration" tagline="price · yield · interest-rate risk"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Face value ($)" value={face} min={100} max={10000} step={100} onChange={(v) => update({ face: v })} />
        <Slider label="Coupon rate" value={coupon} min={0} max={0.12} step={0.005} onChange={(v) => update({ coupon: v })} />
        <Slider label="Yield to maturity" value={yield_} min={0.005} max={0.15} step={0.005} onChange={(v) => update({ yield_: v })} />
        <Slider label="Years to maturity" value={yearsN} min={1} max={30} step={1} onChange={(v) => update({ yearsN: v })} />
        <div className="mt-3 flex gap-2">{[1, 2, 4].map((f) => <button key={f} onClick={() => setFreq(f)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${freq === f ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{f === 1 ? "Annual" : f === 2 ? "Semi" : "Quarterly"}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">A bond&apos;s price is the present value of its coupons and face value, discounted at the yield. Price moves inversely to yield along a convex curve. Duration measures that sensitivity — a modified duration of 8 means roughly an 8% price drop per 1% rise in yield. Educational tool, not investment advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Price" value={`$${price.toFixed(2)}`} /><Stat label="Premium/discount" value={price > face ? "premium" : price < face ? "discount" : "par"} /><Stat label="Macaulay duration" value={`${dur.toFixed(2)} yr`} /><Stat label="Modified duration" value={modDur.toFixed(2)} /><Equation tex={`P=\\sum_{t=1}^{${n}}\\frac{${c.toFixed(2)}}{(1+${per.toFixed(4)})^{t}}+\\frac{${face}}{(1+${per.toFixed(4)})^{${n}}}=\\$${price.toFixed(2)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
