"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function ActiveFilterStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [fc, setFc] = useState(1000), [order, setOrder] = useState(2), [type, setType] = useState(0); // 0 low, 1 high
  const mag = (f: number) => { const r = f / fc; const lp = 1 / Math.sqrt(1 + Math.pow(r, 2 * order)); const hp = Math.pow(r, order) / Math.sqrt(1 + Math.pow(r, 2 * order)); return type ? hp : lp; };

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const fmin = 10, fmax = 1e6, dbMin = -60;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const f = fmin * Math.pow(fmax / fmin, i / pw); const db = 20 * Math.log10(mag(f)); const y = oy - Math.max(0, (db - dbMin) / -dbMin) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    const fx = ox + (Math.log(fc / fmin) / Math.log(fmax / fmin)) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(fx, oy); ctx.lineTo(fx, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${type ? "high" : "low"}-pass · order ${order} · −${order * 20} dB/decade`, ox + 6, oy - ph + 12); ctx.fillText("frequency (log) →", ox + pw - 110, oy + 18); ctx.fillText("pink = cutoff fc", fx + 4, oy - ph + 26);
  }, [fc, order, type]);

  return (
    <StudioChrome title="Active Filter (Bode Plot)" tagline="shaping a frequency response"
      controls={<div>
        <label className="mb-2 block text-xs text-slate-400">Type</label>
        <select value={type} onChange={(e) => setType(Number(e.target.value))} className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value={0}>Low-pass</option><option value={1}>High-pass</option></select>
        <Slider label="Cutoff fc (Hz)" value={fc} min={20} max={100000} step={20} onChange={setFc} />
        <Slider label="Filter order" value={order} min={1} max={6} step={1} onChange={setOrder} />
        <p className="mt-3 text-xs text-slate-500">A filter passes some frequencies and blocks others. The cutoff fc = 1/(2πRC) is where the response falls 3 dB; beyond it the magnitude rolls off at 20 dB per decade per order — steeper filters cut harder. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Cutoff frequency" value={`${fc >= 1000 ? (fc / 1000).toFixed(1) + " kHz" : fc + " Hz"}`} />
        <Stat label="Roll-off" value={`${order * 20} dB/decade`} />
        <Stat label="At 10×fc" value={`${(20 * Math.log10(mag(type ? fc / 10 : fc * 10))).toFixed(0)} dB`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
