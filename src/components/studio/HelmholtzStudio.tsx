"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

// Helmholtz resonator: f = (c/2pi) sqrt(A/(V*Leff)).
const C = 343;

const PRESETS: Record<string, { volume: number; neckD: number; neckL: number }> = {
  "Wine bottle": { volume: 750, neckD: 1.8, neckL: 6 },
  "Speaker bass port": { volume: 3000, neckD: 5, neckL: 15 },
  "Ocarina": { volume: 200, neckD: 1, neckL: 2 },
  "Small jar": { volume: 500, neckD: 2, neckL: 5 },
};

export function HelmholtzStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ volume, neckD, neckL }, update] = useShareableNumbers({ volume: 500, neckD: 2, neckL: 5 });

  const V = volume * 1e-6; const r = neckD / 2 * 1e-2; const A = Math.PI * r * r; const Leff = (neckL * 1e-2) + 1.7 * r;
  const f = (C / (2 * Math.PI)) * Math.sqrt(A / (V * Leff));

  useEffect(() => {
    const W = 420, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2; const bodyR = Math.cbrt(volume) * 4; const neckW = neckD * 8, neckH = neckL * 8;
    ctx.fillStyle = "rgba(34,211,238,0.18)"; ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, 210, bodyR, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(148,163,184,0.2)"; ctx.strokeStyle = "#64748b"; ctx.fillRect(cx - neckW / 2, 210 - bodyR - neckH, neckW, neckH); ctx.strokeRect(cx - neckW / 2, 210 - bodyR - neckH, neckW, neckH);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("air cavity (spring)", cx - 40, 210); ctx.fillText("neck (mass)", cx + neckW / 2 + 6, 210 - bodyR - neckH / 2);
  }, [volume, neckD, neckL]);

  const explain = `This cavity sings near ${f.toFixed(0)} Hz — a ${(C / f).toFixed(2)} m wavelength. Enlarge the cavity or lengthen the neck and the pitch drops, because both add to the mass-on-a-spring that sets the tone.`;

  const code = `import math
C = 343
volume, neckD, neckL = ${volume}, ${neckD}, ${neckL}
V = volume * 1e-6
r = neckD / 2 * 1e-2
A = math.pi * r * r
Leff = neckL * 1e-2 + 1.7 * r
f = C / (2 * math.pi) * math.sqrt(A / (V * Leff))
print("frequency_Hz", round(f))`;

  return (
    <StudioChrome title="Helmholtz Resonator" tagline="the resonance of a bottle"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Cavity volume (cm³)" value={volume} min={50} max={3000} step={50} onChange={(v) => update({ volume: v })} />
        <Slider label="Neck diameter (cm)" value={neckD} min={0.5} max={6} step={0.1} onChange={(v) => update({ neckD: v })} />
        <Slider label="Neck length (cm)" value={neckL} min={1} max={20} step={0.5} onChange={(v) => update({ neckL: v })} />
        <p className="mt-3 text-xs text-slate-500">Blow across a bottle and it sings at its Helmholtz frequency. The plug of air in the neck acts as a mass and the air in the cavity as a spring, giving f = (c/2π)√(A/VL). Bigger cavities and longer necks lower the pitch — the principle behind bass ports, mufflers, and ocarinas.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Resonant frequency" value={`${f.toFixed(0)} Hz`} /><Stat label="Wavelength" value={`${(C / f).toFixed(2)} m`} /><Stat label="Cavity" value={`${volume} cm³`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={420} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
