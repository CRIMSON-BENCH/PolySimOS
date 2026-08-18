"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { coupon: number; ytm: number; years: number; face: number }> = {
  "Par bond": { coupon: 5, ytm: 5, years: 10, face: 1000 },
  "Deep discount": { coupon: 1, ytm: 8, years: 20, face: 1000 },
  "Long bond": { coupon: 3, ytm: 4, years: 30, face: 1000 },
  "Short & safe": { coupon: 6, ytm: 5, years: 2, face: 1000 },
};

export function BondDurationStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ coupon, ytm, years, face }, update] = useShareableNumbers({ coupon: 5, ytm: 5, years: 10, face: 1000 });
  const priceAt = (y: number) => { const r = y / 100; let p = 0; for (let t = 1; t <= years; t++) p += (coupon / 100 * face) / Math.pow(1 + r, t); return p + face / Math.pow(1 + r, years); };
  const price = priceAt(ytm);
  const r = ytm / 100; let mac = 0; for (let t = 1; t <= years; t++) mac += t * (coupon / 100 * face) / Math.pow(1 + r, t); mac += years * face / Math.pow(1 + r, years); mac /= price;
  const modDur = mac / (1 + r);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 32, pw = W - 70, ph = H - 52, ymin = 1, ymax = 12;
    const pMax = priceAt(ymin), pMin = priceAt(ymax);
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const y = ymin + (ymax - ymin) * i / pw; const py = oy - ((priceAt(y) - pMin) / (pMax - pMin)) * ph; i ? ctx.lineTo(ox + i, py) : ctx.moveTo(ox + i, py); } ctx.stroke();
    const mx = ox + ((ytm - ymin) / (ymax - ymin)) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(mx, oy); ctx.lineTo(mx, oy - ((price - pMin) / (pMax - pMin)) * ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("bond price vs yield (convex, downward)", ox + 6, oy - ph + 12); ctx.fillText("yield % →", ox + pw - 56, oy + 18);
  }, [coupon, ytm, years, face, price]);

  const explain =
    coupon > ytm
      ? `Coupon (${coupon}%) tops the yield (${ytm}%), so the bond trades at a premium above par; its rich coupons pull the modified duration down to ${modDur.toFixed(1)}.`
      : coupon < ytm
      ? `Yield (${ytm}%) tops the coupon (${coupon}%), so the bond trades at a discount below par; a modified duration of ${modDur.toFixed(1)} means roughly a ${modDur.toFixed(1)}% price drop per +1% yield.`
      : `Coupon equals yield, so the bond prices right at par — yet its ${modDur.toFixed(1)}-year modified duration still exposes it to rate swings.`;

  const code = `coupon, ytm, years, face = ${coupon}, ${ytm}, ${years}, ${face}
r = ytm / 100; cf = coupon / 100 * face
price = sum(cf / (1 + r) ** t for t in range(1, years + 1)) + face / (1 + r) ** years
mac = (sum(t * cf / (1 + r) ** t for t in range(1, years + 1)) + years * face / (1 + r) ** years) / price
mod = mac / (1 + r)
print("price", round(price, 2), "macaulay", round(mac, 2), "modified", round(mod, 2))`;

  return (
    <StudioChrome title="Bond Duration & Price" tagline="interest-rate sensitivity"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Coupon rate (%)" value={coupon} min={0} max={12} step={0.25} onChange={(v) => update({ coupon: v })} />
        <Slider label="Yield to maturity (%)" value={ytm} min={1} max={12} step={0.25} onChange={(v) => update({ ytm: v })} />
        <Slider label="Years to maturity" value={years} min={1} max={30} step={1} onChange={(v) => update({ years: v })} />
        <Slider label="Face value ($)" value={face} min={100} max={10000} step={100} onChange={(v) => update({ face: v })} />
        <p className="mt-3 text-xs text-slate-500">A bond&apos;s price moves opposite to yields, and duration measures how much. Modified duration approximates the percent price drop for a 1% rise in yield — longer maturities and lower coupons mean higher duration and bigger swings. Educational tool, not financial advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Bond price" value={`$${price.toFixed(2)}`} />
        <Stat label="Macaulay duration" value={`${mac.toFixed(2)} yr`} />
        <Stat label="Modified duration" value={`${modDur.toFixed(2)}`} />
        <Stat label="≈ price change / +1% yield" value={`${(-modDur).toFixed(2)}%`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
