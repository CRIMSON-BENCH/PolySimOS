"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Michaelis-Menten enzyme kinetics with optional competitive inhibitor.
export function EnzymeKineticsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [Vmax, setVmax] = useState(100);
  const [Km, setKm] = useState(5);
  const [inhibitor, setInhibitor] = useState(0); // [I]/Ki
  const [lineweaver, setLineweaver] = useState(false);

  const KmApp = Km * (1 + inhibitor);
  const v = (S: number) => Vmax * S / (KmApp + S);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 340; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 35, pw = W - 80, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    if (!lineweaver) {
      const sMax = Km * 12;
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const S = (i / pw) * sMax; const y = oy - (v(S) / (Vmax * 1.05)) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
      // Vmax and Km/2 markers
      ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); const vmY = oy - (Vmax / (Vmax * 1.05)) * ph; ctx.beginPath(); ctx.moveTo(ox, vmY); ctx.lineTo(ox + pw, vmY); ctx.stroke();
      const halfY = oy - (Vmax / 2 / (Vmax * 1.05)) * ph; const kmX = ox + (KmApp / sMax) * pw; ctx.beginPath(); ctx.moveTo(ox, halfY); ctx.lineTo(kmX, halfY); ctx.lineTo(kmX, oy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("Vmax", ox + pw - 40, vmY - 4); ctx.fillText("Km", kmX - 8, oy - 4); ctx.fillText("reaction rate v vs [S]", ox + 8, oy - ph + 14);
    } else {
      // Lineweaver-Burk: 1/v vs 1/S
      ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 1; i <= pw; i++) { const invS = (i / pw) * 1.0; const vv = Vmax * (1 / invS) / (KmApp + 1 / invS); const invV = 1 / vv; const y = oy - (invV / 0.06) * ph; if (y > 10) { i === 1 ? ctx.moveTo(ox + i, y) : ctx.lineTo(ox + i, y); } } ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("1/v vs 1/[S] (Lineweaver-Burk)", ox + 8, oy - ph + 14); ctx.fillText("1/[S] →", ox + pw - 50, oy + 18);
    }
  }, [Vmax, Km, inhibitor, lineweaver]);

  return (
    <StudioChrome title="Enzyme Kinetics (Michaelis-Menten)" tagline="reaction rate vs substrate"
      controls={<div>
        <Slider label="Vmax" value={Vmax} min={20} max={200} step={5} onChange={setVmax} />
        <Slider label="Km" value={Km} min={0.5} max={20} step={0.5} onChange={setKm} />
        <Slider label="Inhibitor [I]/Ki (competitive)" value={inhibitor} min={0} max={5} step={0.25} onChange={setInhibitor} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={lineweaver} onChange={(e) => setLineweaver(e.target.checked)} /> Lineweaver-Burk plot</label>
        <p className="mt-3 text-xs text-slate-500">Michaelis-Menten kinetics describe how reaction rate rises with substrate and saturates at Vmax. Km is the substrate concentration giving half-maximal rate — a measure of enzyme affinity. A competitive inhibitor raises the apparent Km without changing Vmax, seen as a shift in the double-reciprocal Lineweaver-Burk line.</p>
      </div>}
      inspector={<div><Stat label="Vmax" value={String(Vmax)} /><Stat label="Apparent Km" value={KmApp.toFixed(1)} /><Stat label="v at [S]=Km" value={v(Km).toFixed(1)} /></div>}
    ><canvas ref={canvasRef} width={520} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
