"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { stories: number; wPer: number; SDS: number; R: number; I: number }> = {
  "Low-rise office": { stories: 3, wPer: 1500, SDS: 0.6, R: 6, I: 1.0 },
  "Mid-rise, high seismic": { stories: 8, wPer: 2000, SDS: 1.2, R: 6, I: 1.0 },
  "Hospital (I=1.5)": { stories: 6, wPer: 2500, SDS: 1.0, R: 5, I: 1.5 },
  "Stiff, low ductility": { stories: 4, wPer: 1800, SDS: 1.0, R: 3, I: 1.0 },
};

// Seismic base shear (equivalent lateral force) + vertical distribution.
export function BaseShearStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ stories, wPer, SDS, R, I }, update] = useShareableNumbers({ stories: 6, wPer: 1500, SDS: 1.0, R: 6, I: 1.0 });

  const n = Math.round(stories); const W = n * wPer;
  const Cs = Math.min(SDS * I / R, 0.15); const V = Cs * W;
  const storyH = 3.5; // m each
  // vertical distribution Fx = V * (wx hx) / sum(wi hi), k=1
  const heights = Array.from({ length: n }, (_, i) => (i + 1) * storyH);
  const denom = heights.reduce((s, h) => s + wPer * h, 0);
  const forces = heights.map((h) => V * (wPer * h) / denom);

  useEffect(() => {
    const Wc = 460, Hc = 340; const ctx = hidpi(canvasRef.current!, Wc, Hc); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, Wc, Hc);
    const bx = 140, base = Hc - 30, sh = Math.min(38, (Hc - 60) / n), bw = 90;
    const fMax = Math.max(...forces);
    for (let i = 0; i < n; i++) { const y = base - (i + 1) * sh; ctx.fillStyle = "#334155"; ctx.strokeStyle = "#64748b"; ctx.fillRect(bx, y, bw, sh - 2); ctx.strokeRect(bx, y, bw, sh - 2);
      // force arrow
      const fl = (forces[i] / fMax) * 90; ctx.strokeStyle = "#f472b6"; ctx.fillStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 6, y + sh / 2); ctx.lineTo(bx - 6 - fl, y + sh / 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx - 6 - fl, y + sh / 2); ctx.lineTo(bx - fl, y + sh / 2 - 4); ctx.lineTo(bx - fl, y + sh / 2 + 4); ctx.fill();
      ctx.fillStyle = "#e2e8f0"; ctx.font = "10px sans-serif"; ctx.fillText(`${forces[i].toFixed(0)} kN`, bx + bw + 6, y + sh / 2 + 3); }
    ctx.fillStyle = "#a3e635"; ctx.fillRect(bx - 10, base, bw + 20, 8);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("lateral seismic forces", bx - 40, 20);
  }, [stories, wPer, SDS, R, I]);

  const explain =
    SDS * I / R > 0.15
      ? `Cs would be ${(SDS * I / R).toFixed(3)} but is capped at 0.15, so base shear is code-floored here — cutting R further will not add demand.`
      : `Cs = SDS·I/R = ${Cs.toFixed(3)}; because force is shared by weight × height, the roof draws the most (${forces[n - 1].toFixed(0)} kN) even though every floor weighs the same.`;

  const code = `SDS, R, I = ${SDS}, ${R}, ${I}
w_per, n = ${wPer}, ${n}
W = n * w_per
Cs = min(SDS * I / R, 0.15)
V = Cs * W
h = [(i + 1) * 3.5 for i in range(n)]
denom = sum(w_per * hx for hx in h)
F = [V * w_per * hx / denom for hx in h]
print("V", V, "roof force", F[-1])`;

  return (
    <StudioChrome title="Seismic Base Shear" tagline="equivalent lateral force"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Number of stories" value={stories} min={1} max={12} step={1} onChange={(v) => update({ stories: v })} />
        <Slider label="Weight per floor (kN)" value={wPer} min={500} max={4000} step={100} onChange={(v) => update({ wPer: v })} />
        <Slider label="Design accel. SDS (g)" value={SDS} min={0.2} max={1.5} step={0.05} onChange={(v) => update({ SDS: v })} />
        <Slider label="Response factor R" value={R} min={1.5} max={8} step={0.5} onChange={(v) => update({ R: v })} />
        <Slider label="Importance factor I" value={I} min={1} max={1.5} step={0.05} onChange={(v) => update({ I: v })} />
        <p className="mt-3 text-xs text-slate-500">The equivalent lateral force method estimates the total earthquake base shear as V = Cs·W, where the seismic coefficient Cs scales the design acceleration by the structure&apos;s ductility (R) and importance (I). The base shear is distributed up the building, concentrating force at the top. Educational tool, not a code design.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Seismic coeff. Cs" value={Cs.toFixed(3)} /><Stat label="Total weight W" value={`${W.toLocaleString()} kN`} /><Stat label="Base shear V" value={`${V.toFixed(0)} kN`} /><Stat label="Roof force" value={`${forces[n - 1].toFixed(0)} kN`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={460} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
