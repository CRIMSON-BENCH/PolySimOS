"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { taps: number; fc: number }> = {
  "Gentle (few taps)": { taps: 11, fc: 0.25 },
  "Sharp cutoff": { taps: 81, fc: 0.2 },
  "Low cutoff": { taps: 41, fc: 0.08 },
  "Wide passband": { taps: 31, fc: 0.4 },
};

export function FirFilterStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ taps, fc }, update] = useShareableNumbers({ taps: 21, fc: 0.2 });
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

  const twNyq = 6.6 / taps; // approx Hamming transition width, in units of Nyquist
  const explain =
    taps >= 61
      ? `${taps} taps give a steep transition (~${twNyq.toFixed(2)} × Nyquist wide) and strong stopband rejection — the price is ${M} samples of delay.`
      : taps <= 15
      ? `Only ${taps} taps means a gentle, gradual roll-off (~${twNyq.toFixed(2)} × Nyquist wide): cheap and low-latency, but leaky right near the cutoff.`
      : `${taps} taps balance sharpness against cost — transition band ~${twNyq.toFixed(2)} × Nyquist, group delay ${M} samples.`;

  const code = `import numpy as np
taps, fc = ${taps}, ${fc}                  # fc as a fraction of Nyquist
n = np.arange(taps); M = (taps-1)/2; k = n - M
sinc = np.where(k == 0, 2*fc, np.sin(2*np.pi*fc*k)/(np.pi*k))
win = 0.54 - 0.46*np.cos(2*np.pi*n/(taps-1))  # Hamming
h = sinc*win; h = h/h.sum()
H = np.abs([np.sum(h*np.exp(-1j*w*n)) for w in np.linspace(0, np.pi, 512)])
print("passband gain", round(float(H[0]), 3), "delay", M)`;

  return (
    <StudioChrome title="FIR Filter Designer" tagline="windowed-sinc low-pass"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Number of taps" value={taps} min={5} max={81} step={2} onChange={(v) => update({ taps: v })} />
        <Slider label="Cutoff (× Nyquist)" value={fc} min={0.05} max={0.45} step={0.01} onChange={(v) => update({ fc: v })} />
        <p className="mt-3 text-xs text-slate-500">An FIR filter convolves the signal with a set of tap coefficients. A windowed sinc gives a low-pass response whose transition band sharpens as you add taps — more taps mean a crisper cutoff but more computation and delay. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Taps" value={`${taps}`} />
        <Stat label="Cutoff" value={`${(fc * 2).toFixed(2)} × Nyquist`} />
        <Stat label="Group delay" value={`${((taps - 1) / 2).toFixed(0)} samples`} />
        <Equation tex={`y[n] = \\sum_{k=0}^{${taps - 1}} b_k\\,x[n-k],\\quad f_c = ${(fc * 2).toFixed(2)}\\,f_{\\mathrm{Nyq}}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
