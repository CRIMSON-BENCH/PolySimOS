"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Photoelectric effect: KEmax = h f - phi.
const H_EV = 4.1357e-15; // eV·s
export function PhotoelectricStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [freq, setFreq] = useState(8); // 10^14 Hz
  const [work, setWork] = useState(2.3); // eV work function

  const f = freq * 1e14; const photonE = H_EV * f; const KE = photonE - work; const emits = KE > 0;
  const f0 = work / H_EV / 1e14; // threshold in 10^14 Hz

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 40, pw = W - 80, ph = H - 70; const fMax = 20;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // KE = hf - phi line (above threshold)
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); let started = false;
    for (let i = 0; i <= pw; i++) { const fi = (i / pw) * fMax; const ke = H_EV * fi * 1e14 - work; const y = oy - Math.max(0, ke) / 4 * ph; if (ke >= 0) { started ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); started = true; } }
    ctx.stroke();
    // threshold marker + current point
    const fx = ox + (freq / fMax) * pw; ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(fx, oy); ctx.lineTo(fx, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    if (emits) { ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(fx, oy - KE / 4 * ph, 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("max kinetic energy vs frequency", ox + 6, oy - ph + 12); ctx.fillText(`threshold f₀ = ${f0.toFixed(1)}×10¹⁴ Hz`, ox + pw - 150, oy - 6);
  }, [freq, work]);

  return (
    <StudioChrome title="Photoelectric Effect" tagline="Einstein's photon"
      controls={<div>
        <Slider label="Light frequency (10¹⁴ Hz)" value={freq} min={1} max={20} step={0.1} onChange={setFreq} />
        <Slider label="Work function φ (eV)" value={work} min={1} max={6} step={0.1} onChange={setWork} />
        <p className="mt-3 text-xs text-slate-500">Light ejects electrons from a metal only if each photon carries enough energy — no matter how bright a below-threshold beam is. Einstein explained it with KEmax = hf − φ: energy comes in photon packets of hf, and the work function φ is the escape cost. Below the threshold frequency, nothing happens. This won him the Nobel Prize.</p>
      </div>}
      inspector={<div><Stat label="Photon energy" value={`${photonE.toFixed(2)} eV`} /><Stat label="Max KE" value={emits ? `${KE.toFixed(2)} eV` : "no emission"} /><Stat label="Stopping voltage" value={emits ? `${KE.toFixed(2)} V` : "—"} /><Stat label="Emission" value={emits ? "yes" : "below threshold"} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
