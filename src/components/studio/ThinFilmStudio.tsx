"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Thin-film / anti-reflection coating reflectance vs wavelength.
export function ThinFilmStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thickness, setThickness] = useState(100); // nm
  const [nf, setNf] = useState(1.38); // film index (MgF2)
  const ns = 1.52; // substrate glass

  // reflectance of single film on substrate (normal incidence)
  const refl = (lam: number) => { const r1 = (1 - nf) / (1 + nf); const r2 = (nf - ns) / (nf + ns); const phase = 4 * Math.PI * nf * thickness / lam; const num = r1 * r1 + r2 * r2 + 2 * r1 * r2 * Math.cos(phase); const den = 1 + r1 * r1 * r2 * r2 + 2 * r1 * r2 * Math.cos(phase); return num / den; };
  const idealT = 550 / (4 * nf); // quarter-wave thickness for 550nm

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const lam = 400 + (i / pw) * 400; const R = refl(lam); const y = oy - (R / 0.1) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // color band
    for (let i = 0; i < pw; i++) { const lam = 400 + (i / pw) * 400; const hue = 280 - (lam - 400) / 400 * 280; ctx.fillStyle = `hsl(${hue},70%,50%)`; ctx.globalAlpha = 0.3; ctx.fillRect(ox + i, oy + 2, 1, 8); } ctx.globalAlpha = 1;
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("reflectance vs wavelength (400–800 nm)", ox + 6, oy - ph + 12);
  }, [thickness, nf]);

  return (
    <StudioChrome title="Thin-Film / AR Coating" tagline="interference kills reflections"
      controls={<div>
        <Slider label="Film thickness (nm)" value={thickness} min={40} max={300} step={2} onChange={setThickness} />
        <Slider label="Film index n_f" value={nf} min={1.2} max={2.4} step={0.02} onChange={setNf} />
        <p className="mt-3 text-xs text-slate-500">Coat glass with a film a quarter-wavelength thick and its two reflections cancel by destructive interference — an anti-reflection coating. It works best at one wavelength (the reflectance dips to near zero there), giving camera lenses and glasses their faint purple sheen. The same physics makes soap bubbles and oil slicks shimmer with color.</p>
      </div>}
      inspector={<div><Stat label="Ideal thickness (550nm)" value={`${idealT.toFixed(0)} nm`} /><Stat label="Min reflectance" value={`${(Math.min(...Array.from({ length: 100 }, (_, i) => refl(400 + i * 4))) * 100).toFixed(2)}%`} /><Stat label="Film index" value={nf.toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
