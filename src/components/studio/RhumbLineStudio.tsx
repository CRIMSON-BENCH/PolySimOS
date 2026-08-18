"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { lat1: number; lat2: number; lon2: number }> = {
  "N. America → Europe": { lat1: 40, lat2: 50, lon2: 20 },
  "Equator crossing": { lat1: -30, lat2: 30, lon2: 60 },
  "High-latitude hop": { lat1: 60, lat2: 65, lon2: 100 },
  "Southern route": { lat1: -45, lat2: -35, lon2: 40 },
};

export function RhumbLineStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ lat1, lat2, lon2 }, update] = useShareableNumbers({ lat1: 40, lat2: 50, lon2: 20 });
  const [lon1] = useState(-120);

  const R = 6371; const toR = (d: number) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2; const gc = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dPsi = Math.log(Math.tan(Math.PI / 4 + toR(lat2) / 2) / Math.tan(Math.PI / 4 + toR(lat1) / 2)); const q = Math.abs(dPsi) > 1e-12 ? dLat / dPsi : Math.cos(toR(lat1));
  const rhumb = Math.sqrt(dLat * dLat + q * q * dLon * dLon) * R;

  useEffect(() => {
    const W = 540, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#0b1a2e"; ctx.fillRect(0, 0, W, H);
    const X = (lon: number) => (lon + 180) / 360 * W; const Y = (lat: number) => (90 - lat) / 180 * H;
    ctx.strokeStyle = "#1e3a5f"; for (let lo = -180; lo <= 180; lo += 30) { ctx.beginPath(); ctx.moveTo(X(lo), 0); ctx.lineTo(X(lo), H); ctx.stroke(); } for (let la = -60; la <= 60; la += 30) { ctx.beginPath(); ctx.moveTo(0, Y(la)); ctx.lineTo(W, Y(la)); ctx.stroke(); }
    // rhumb line (straight on this equirectangular-ish view)
    ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(lon1), Y(lat1)); ctx.lineTo(X(lon2), Y(lat2)); ctx.stroke();
    // great circle (curved)
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); for (let t = 0; t <= 1; t += 0.02) { const A = toR(lat1), B = toR(lon1), C = toR(lat2), D = toR(lon2); const d = 2 * Math.asin(Math.sqrt(a)); if (d < 1e-6) break; const A1 = Math.sin((1 - t) * d) / Math.sin(d), A2 = Math.sin(t * d) / Math.sin(d); const xx = A1 * Math.cos(A) * Math.cos(B) + A2 * Math.cos(C) * Math.cos(D); const yy = A1 * Math.cos(A) * Math.sin(B) + A2 * Math.cos(C) * Math.sin(D); const zz = A1 * Math.sin(A) + A2 * Math.sin(C); const lat = Math.atan2(zz, Math.sqrt(xx * xx + yy * yy)) * 180 / Math.PI, lon = Math.atan2(yy, xx) * 180 / Math.PI; t === 0 ? ctx.moveTo(X(lon), Y(lat)) : ctx.lineTo(X(lon), Y(lat)); } ctx.stroke();
    ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(X(lon1), Y(lat1), 5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(X(lon2), Y(lat2), 5, 0, 7); ctx.fill();
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#fde68a"; ctx.fillText("rhumb line (constant bearing)", 8, 18); ctx.fillStyle = "#bef264"; ctx.fillText("great circle (shortest)", 8, 34);
  }, [lat1, lat2, lon2, a, lon1]);

  const extra = rhumb - gc;
  const pct = gc > 0 ? (extra / gc) * 100 : 0;
  const explain =
    extra < 1
      ? "Start and end are nearly aligned, so the rhumb line and great circle almost coincide — no real detour here."
      : `Steering the constant-bearing rhumb line adds about ${extra.toFixed(0)} km (${pct.toFixed(1)}%) over the great circle — the penalty grows with higher latitudes and a wider longitude gap.`;

  const code = `import math
lat1, lat2, lon1, lon2 = ${lat1}, ${lat2}, ${lon1}, ${lon2}
R = 6371.0; r = math.radians
dLat, dLon = r(lat2-lat1), r(lon2-lon1)
a = math.sin(dLat/2)**2 + math.cos(r(lat1))*math.cos(r(lat2))*math.sin(dLon/2)**2
gc = R*2*math.atan2(math.sqrt(a), math.sqrt(1-a))
dPsi = math.log(math.tan(math.pi/4 + r(lat2)/2)/math.tan(math.pi/4 + r(lat1)/2))
q = dLat/dPsi if abs(dPsi) > 1e-12 else math.cos(r(lat1))
rhumb = math.hypot(dLat, q*dLon)*R
print("great-circle", round(gc), "km  rhumb", round(rhumb), "km")`;

  return (
    <StudioChrome title="Rhumb Line vs Great Circle" tagline="two ways to cross an ocean"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Start latitude" value={lat1} min={-70} max={70} step={1} onChange={(v) => update({ lat1: v })} />
        <Slider label="End latitude" value={lat2} min={-70} max={70} step={1} onChange={(v) => update({ lat2: v })} />
        <Slider label="End longitude" value={lon2} min={-170} max={170} step={5} onChange={(v) => update({ lon2: v })} />
        <p className="mt-3 text-xs text-slate-500">A rhumb line holds a constant compass bearing — easy to steer, and a straight line on a Mercator map, but longer. A great circle is the shortest route but its bearing changes continuously, tracing a curve on the map. Ships and planes crossing oceans follow the great circle, adjusting heading along the way to save fuel and time.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Great-circle dist" value={`${gc.toFixed(0)} km`} /><Stat label="Rhumb-line dist" value={`${rhumb.toFixed(0)} km`} /><Stat label="Extra by rhumb" value={`${(rhumb - gc).toFixed(0)} km`} /><Equation tex={`d_{\\text{rhumb}} = R\\,\\dfrac{\\Delta\\varphi}{\\cos\\theta} = ${rhumb.toFixed(0)}\\ \\text{km},\\quad \\Delta\\varphi = ${(lat2 - lat1).toFixed(0)}^\\circ,\\ \\Delta\\lambda = ${(lon2 - lon1).toFixed(0)}^\\circ,\\ \\theta = \\text{const}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
