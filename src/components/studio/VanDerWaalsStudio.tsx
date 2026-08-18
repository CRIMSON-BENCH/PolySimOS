"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function VanDerWaalsStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(1.4), [b, setB] = useState(0.039), [T, setT] = useState(320);
  const R = 0.08314; // L·bar/(mol·K)
  const Pvdw = (V: number) => R * T / (V - b) - a / (V * V);
  const Pideal = (V: number) => R * T / V;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55, Vmin = b + 0.02, Vmax = 1.2, Pmax = 120;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const plot = (f: (V: number) => number, col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); let started = false; for (let i = 0; i <= pw; i++) { const V = Vmin + (Vmax - Vmin) * i / pw; const P = f(V); if (P < 0 || P > Pmax) { started = false; continue; } const x = ox + i, y = oy - (P / Pmax) * ph; started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true; } ctx.stroke(); };
    plot(Pideal, "#64748b"); plot(Pvdw, "#22d3ee");
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("P–V isotherm · ideal (grey) vs van der Waals (cyan)", ox + 6, oy - ph + 12); ctx.fillText("volume →", ox + pw - 54, oy + 18);
  }, [a, b, T]);

  return (
    <StudioChrome title="Van der Waals Real Gas" tagline="where the ideal gas law breaks"
      controls={<div>
        <Slider label="Attraction a (L²·bar/mol²)" value={a} min={0} max={6} step={0.1} onChange={setA} />
        <Slider label="Volume b (L/mol)" value={b} min={0.01} max={0.1} step={0.005} onChange={setB} />
        <Slider label="Temperature (K)" value={T} min={150} max={500} step={5} onChange={setT} />
        <p className="mt-3 text-xs text-slate-500">Real gases deviate from PV = nRT because molecules attract each other (the a term) and occupy volume (the b term). Van der Waals adds both corrections, and below the critical temperature the isotherm even loops — predicting condensation. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="P at V=0.3 L (vdW)" value={`${Pvdw(0.3).toFixed(1)} bar`} />
        <Stat label="P at V=0.3 L (ideal)" value={`${Pideal(0.3).toFixed(1)} bar`} />
        <Stat label="Deviation" value={`${((Pvdw(0.3) / Pideal(0.3) - 1) * 100).toFixed(0)}%`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
