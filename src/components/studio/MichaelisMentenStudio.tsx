"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { Vmax: number; Km: number; S: number }> = {
  "High affinity (low Km)": { Vmax: 100, Km: 1, S: 5 },
  "Low affinity (high Km)": { Vmax: 100, Km: 20, S: 5 },
  "Saturating [S]": { Vmax: 150, Km: 5, S: 50 },
  "Sub-saturating [S]": { Vmax: 100, Km: 12, S: 2 },
};

export function MichaelisMentenStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ Vmax, Km, S }, update] = useShareableNumbers({ Vmax: 100, Km: 5, S: 5 });
  const v = Vmax * S / (Km + S);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55, Smax = Km * 8;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // Vmax asymptote
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, oy - ph * 0.92); ctx.lineTo(ox + pw, oy - ph * 0.92); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const s = Smax * i / pw; const y = oy - (Vmax * s / (Km + s)) / Vmax * ph * 0.92; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // Km marker (half Vmax)
    const kx = ox + (Km / Smax) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(kx, oy); ctx.lineTo(kx, oy - ph * 0.46); ctx.stroke(); ctx.setLineDash([]);
    const px = ox + (Math.min(S, Smax) / Smax) * pw, py = oy - (v / Vmax) * ph * 0.92; ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("reaction rate vs substrate — saturates at Vmax", ox + 6, oy - ph + 12); ctx.fillText("[S] →", ox + pw - 40, oy + 18); ctx.fillText("Km", kx - 6, oy - ph * 0.46 - 6);
  }, [Vmax, Km, S, v]);

  const frac = S / (Km + S);
  const explain =
    frac > 0.8
      ? `At [S] = ${S} mM you are well above Km (${Km} mM), so the enzyme runs near saturation at ${(frac * 100).toFixed(0)}% of Vmax — adding more substrate barely raises the rate.`
      : frac < 0.3
      ? `At [S] = ${S} mM you are far below Km (${Km} mM), so the rate is roughly first-order: it rises almost linearly with substrate and sits at just ${(frac * 100).toFixed(0)}% of Vmax.`
      : `At [S] near Km (${Km} mM) the enzyme works at about half speed (${(frac * 100).toFixed(0)}% of Vmax) — this is the steepest, most substrate-sensitive part of the curve.`;

  const code = `Vmax, Km, S = ${Vmax}, ${Km}, ${S}
v = Vmax * S / (Km + S)
print("rate v =", round(v, 2), "umol/min")
print("fraction of Vmax =", round(100 * S / (Km + S)), "%")`;

  return (
    <StudioChrome title="Michaelis–Menten Enzyme Kinetics" tagline="how enzymes saturate"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Vmax (µmol/min)" value={Vmax} min={10} max={300} step={10} onChange={(val) => update({ Vmax: val })} />
        <Slider label="Km (mM)" value={Km} min={0.5} max={30} step={0.5} onChange={(val) => update({ Km: val })} />
        <Slider label="Substrate [S] (mM)" value={S} min={0.1} max={60} step={0.1} onChange={(val) => update({ S: val })} />
        <p className="mt-3 text-xs text-slate-500">Enzymes speed reactions but saturate: as substrate rises, the rate approaches a ceiling Vmax. Km — the substrate level giving half Vmax — measures how tightly the enzyme binds. Low Km means high affinity. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Reaction rate v" value={`${v.toFixed(1)} µmol/min`} />
        <Stat label="Fraction of Vmax" value={`${(v / Vmax * 100).toFixed(0)}%`} />
        <Stat label="Km (half-Vmax [S])" value={`${Km} mM`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
