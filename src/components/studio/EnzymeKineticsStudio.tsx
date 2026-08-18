"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { Vmax: number; Km: number; inhibitor: number }> = {
  "Textbook": { Vmax: 100, Km: 5, inhibitor: 0 },
  "High affinity": { Vmax: 100, Km: 1, inhibitor: 0 },
  "Fast enzyme": { Vmax: 200, Km: 3, inhibitor: 0 },
  "Strong inhibition": { Vmax: 100, Km: 5, inhibitor: 4 },
};

// Michaelis-Menten enzyme kinetics with optional competitive inhibitor.
export function EnzymeKineticsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ Vmax, Km, inhibitor }, update] = useShareableNumbers({ Vmax: 100, Km: 5, inhibitor: 0 });
  const [lineweaver, setLineweaver] = useState(false);

  const KmApp = Km * (1 + inhibitor);
  const v = (S: number) => Vmax * S / (KmApp + S);

  const explain =
    inhibitor > 0.01
      ? `The competitive inhibitor pushes the half-saturation point from Km ${Km} up to ${KmApp.toFixed(1)} — you need far more substrate for the same rate, yet Vmax stays pinned at ${Vmax}.`
      : Km <= 2
      ? `Low Km (${Km}) means high affinity: the enzyme reaches half its top speed at just ${Km} units of substrate, so it saturates quickly.`
      : `With Km ${Km}, the rate hits half of Vmax (${Vmax}) at [S]=${Km}; pushing substrate well past Km barely raises v as the curve flattens toward saturation.`;

  const code = `Vmax, Km, I = ${Vmax}, ${Km}, ${inhibitor}
KmApp = Km * (1 + I)      # competitive inhibitor raises apparent Km
v = lambda S: Vmax * S / (KmApp + S)
print("v at [S]=Km:", round(v(Km), 1))
print("v at [S]=10*Km:", round(v(10 * Km), 1))`;

  useEffect(() => {
    const W = 520, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Vmax" value={Vmax} min={20} max={200} step={5} onChange={(v) => update({ Vmax: v })} />
        <Slider label="Km" value={Km} min={0.5} max={20} step={0.5} onChange={(v) => update({ Km: v })} />
        <Slider label="Inhibitor [I]/Ki (competitive)" value={inhibitor} min={0} max={5} step={0.25} onChange={(v) => update({ inhibitor: v })} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={lineweaver} onChange={(e) => setLineweaver(e.target.checked)} /> Lineweaver-Burk plot</label>
        <p className="mt-3 text-xs text-slate-500">Michaelis-Menten kinetics describe how reaction rate rises with substrate and saturates at Vmax. Km is the substrate concentration giving half-maximal rate — a measure of enzyme affinity. A competitive inhibitor raises the apparent Km without changing Vmax, seen as a shift in the double-reciprocal Lineweaver-Burk line.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Vmax" value={String(Vmax)} /><Stat label="Apparent Km" value={KmApp.toFixed(1)} /><Stat label="v at [S]=Km" value={v(Km).toFixed(1)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
