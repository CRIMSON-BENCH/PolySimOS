"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function NernstCellStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [E0, setE0] = useState(1.1), [n, setN] = useState(2), [Q, setQ] = useState(1), [T, setT] = useState(298);
  const E = E0 - (8.314 * T / (n * 96485)) * Math.log(Q);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy - ph / 2); ctx.lineTo(ox + pw, oy - ph / 2); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const Emax = E0 + 0.3, Emin = E0 - 0.3;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const q = Math.pow(10, -6 + 12 * i / pw); const e = E0 - (8.314 * T / (n * 96485)) * Math.log(q); const y = oy - ((e - Emin) / (Emax - Emin)) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    const qx = ox + ((Math.log10(Q) + 6) / 12) * pw; const qy = oy - ((E - Emin) / (Emax - Emin)) * ph; ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(qx, qy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("cell voltage vs reaction quotient Q (log)", ox + 6, 20); ctx.fillText("Q →", ox + pw - 30, oy - ph / 2 - 6);
  }, [E0, n, Q, T, E]);

  return (
    <StudioChrome title="Nernst Equation / Galvanic Cell" tagline="voltage from concentration"
      controls={<div>
        <Slider label="Standard EMF E° (V)" value={E0} min={0.1} max={2.5} step={0.05} onChange={setE0} />
        <Slider label="Electrons transferred n" value={n} min={1} max={4} step={1} onChange={setN} />
        <Slider label="Reaction quotient Q" value={Q} min={0.001} max={1000} step={0.001} onChange={setQ} />
        <Slider label="Temperature (K)" value={T} min={273} max={373} step={1} onChange={setT} />
        <p className="mt-3 text-xs text-slate-500">A battery&apos;s voltage depends on concentrations, not just chemistry. The Nernst equation E = E° − (RT/nF)·lnQ shows the cell voltage sliding as reactants are consumed — and reaching zero when the reaction hits equilibrium. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Cell voltage E" value={`${E.toFixed(3)} V`} />
        <Stat label="Thermal term RT/nF" value={`${(8.314 * T / (n * 96485)).toFixed(4)} V`} />
        <Stat label="Spontaneous?" value={E > 0 ? "yes (E > 0)" : "no"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
