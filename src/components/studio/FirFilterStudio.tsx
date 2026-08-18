"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function FirFilterStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [taps, setTaps] = useState(21), [fc, setFc] = useState(0.2);
  const h: number[] = []; const M = (taps - 1) / 2;
  for (let n = 0; n < taps; n++) { const k = n - M; const sinc = k === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * k) / (Math.PI * k); const win = 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (taps - 1)); h.push(sinc * win); }
  const sum = h.reduce((a, b) => a + b, 0); const hn = h.map((v) => v / sum);
  const mag = (w: number) => { let re = 0, im = 0; hn.forEach((v, n) => { re += v * Math.cos(w * n); im -= v * Math.sin(w * n); }); return Math.sqrt(re * re + im * im); };

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 32, pw = W - 65, ph = H - 52;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const w = Math.PI * i / pw; const m = mag(w); const y = oy - Math.min(1.1, m) / 1.1 * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    const fx = ox + (fc * 2) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(fx, oy); ctx.lineTo(fx, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("FIR low-pass magnitude response", ox + 6, oy - ph + 12); ctx.fillText("frequency (0 → Nyquist) →", ox + pw - 150, oy + 18);
  }, [taps, fc]);

  return (
    <StudioChrome title="FIR Filter Designer" tagline="windowed-sinc low-pass"
      controls={<div>
        <Slider label="Number of taps" value={taps} min={5} max={81} step={2} onChange={setTaps} />
        <Slider label="Cutoff (× Nyquist)" value={fc} min={0.05} max={0.45} step={0.01} onChange={setFc} />
        <p className="mt-3 text-xs text-slate-500">An FIR filter convolves the signal with a set of tap coefficients. A windowed sinc gives a low-pass response whose transition band sharpens as you add taps — more taps mean a crisper cutoff but more computation and delay. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Taps" value={`${taps}`} />
        <Stat label="Cutoff" value={`${(fc * 2).toFixed(2)} × Nyquist`} />
        <Stat label="Group delay" value={`${((taps - 1) / 2).toFixed(0)} samples`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
