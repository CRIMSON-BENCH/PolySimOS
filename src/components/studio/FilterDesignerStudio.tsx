"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

type FType = "lowpass" | "highpass" | "bandpass";

const PRESETS: Record<string, { R: number; C: number; L: number }> = {
  "Audio low-pass": { R: 1000, C: 100, L: 10 },
  "Sub-bass cut": { R: 10000, C: 100, L: 10 },
  "RF cutoff": { R: 1000, C: 10, L: 1 },
  "Sharp resonator": { R: 100, C: 10, L: 100 },
};

export function FilterDesignerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ftype, setFtype] = useState<FType>("lowpass");
  const [{ R, C, L }, update] = useShareableNumbers({ R: 1000, C: 100, L: 10 });

  const fc = 1 / (2 * Math.PI * R * C * 1e-9); // RC cutoff
  const f0 = 1 / (2 * Math.PI * Math.sqrt(L * 1e-3 * C * 1e-9)); // LC resonance
  const Q = (1 / R) * Math.sqrt(L * 1e-3 / (C * 1e-9));

  const mag = (f: number) => {
    const w = 2 * Math.PI * f; const wc = 2 * Math.PI * fc;
    if (ftype === "lowpass") return 1 / Math.sqrt(1 + (w / wc) ** 2);
    if (ftype === "highpass") return (w / wc) / Math.sqrt(1 + (w / wc) ** 2);
    const w0 = 2 * Math.PI * f0; const bw = w0 / Q; return 1 / Math.sqrt(1 + (Q * (w / w0 - w0 / w)) ** 2) * 1 * (bw > 0 ? 1 : 1);
  };

  useEffect(() => {
    const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const logMin = 1, logMax = 7;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 300; i++) { const f = Math.pow(10, logMin + (i / 300) * (logMax - logMin)); const db = 20 * Math.log10(Math.max(1e-4, mag(f))); const y = oy - ((db + 60) / 66) * ph; const x = ox + (i / 300) * pw; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    // -3dB line
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); const y3 = oy - ((-3 + 60) / 66) * ph; ctx.beginPath(); ctx.moveTo(ox, y3); ctx.lineTo(ox + pw, y3); ctx.stroke(); ctx.setLineDash([]);
    // cutoff marker
    const fmark = ftype === "bandpass" ? f0 : fc; const xm = ox + (Math.log10(fmark) - logMin) / (logMax - logMin) * pw;
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xm, oy); ctx.lineTo(xm, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("|H| (dB) vs frequency (log Hz)", ox + 6, oy - ph + 12); ctx.fillText("−3 dB", ox + pw - 40, y3 - 4);
  }, [ftype, R, C, L]);

  const hz = (v: number) => (v > 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v.toFixed(0)} Hz`);
  const explain =
    ftype === "bandpass"
      ? Q >= 5
        ? `High Q (${Q.toFixed(1)}): a narrow, sharply peaked band around ${hz(f0)} — good for picking out a single tone, but prone to ringing.`
        : `Low Q (${Q.toFixed(1)}): a broad, gentle bump around ${hz(f0)} that passes a wide band with little peaking.`
      : ftype === "lowpass"
      ? `Low-pass: signals below the ${hz(fc)} corner pass, above it they roll off at 20 dB/decade, and the response is exactly 3 dB down right at the corner.`
      : `High-pass: signals above the ${hz(fc)} corner pass and lower frequencies roll off — the same 1/(2πRC) corner, with R and C swapping roles.`;

  const code = `import numpy as np
R, C, L = ${R}, ${C}e-9, ${L}e-3          # ohm, farad, henry
fc = 1/(2*np.pi*R*C)                       # RC corner (Hz)
f0 = 1/(2*np.pi*np.sqrt(L*C))              # LC resonance (Hz)
Q  = (1/R)*np.sqrt(L/C)                     # bandpass quality factor
print("fc", round(fc), "f0", round(f0), "Q", round(Q, 2))`;

  return (
    <StudioChrome title="Analog Filter Designer" tagline="RC & RLC frequency response"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-2">{(["lowpass", "highpass", "bandpass"] as FType[]).map((t) => <button key={t} onClick={() => setFtype(t)} className={`rounded-lg px-1 py-1 text-xs font-semibold capitalize ${ftype === t ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{t}</button>)}</div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Resistance R (Ω)" value={R} min={100} max={10000} step={100} onChange={(v) => update({ R: v })} />
        <Slider label="Capacitance C (nF)" value={C} min={1} max={1000} step={1} onChange={(v) => update({ C: v })} />
        {ftype === "bandpass" && <Slider label="Inductance L (mH)" value={L} min={0.1} max={100} step={0.1} onChange={(v) => update({ L: v })} />}
        <p className="mt-3 text-xs text-slate-500">Passive filters shape a signal&apos;s frequency content with resistors, capacitors, and inductors. An RC low-pass or high-pass has a cutoff at 1/(2πRC) where the response drops 3 dB; an RLC bandpass resonates at 1/(2π√(LC)) with sharpness set by its quality factor Q.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Cutoff fc" value={fc > 1000 ? `${(fc / 1000).toFixed(1)} kHz` : `${fc.toFixed(0)} Hz`} /><Stat label="Resonance f₀" value={f0 > 1000 ? `${(f0 / 1000).toFixed(1)} kHz` : `${f0.toFixed(0)} Hz`} /><Stat label="Quality factor Q" value={Q.toFixed(2)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
