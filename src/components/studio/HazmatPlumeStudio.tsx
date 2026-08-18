"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

// Gaussian plume dispersion (Pasquill-Gifford). Ground-level centerline concentration.
const STABILITY: Record<string, { a: number; b: number; c: number; d: number; label: string }> = {
  A: { a: 0.22, b: 0.0001, c: 0.20, d: 0, label: "A very unstable" },
  C: { a: 0.11, b: 0.0001, c: 0.08, d: 0.0002, label: "C slightly unstable" },
  D: { a: 0.08, b: 0.0001, c: 0.06, d: 0.0015, label: "D neutral" },
  F: { a: 0.04, b: 0.0001, c: 0.016, d: 0.0003, label: "F very stable" },
};

const PRESETS: Record<string, { rate: number; wind: number; threshold: number }> = {
  "Small spill, breezy": { rate: 20, wind: 8, threshold: 1 },
  "Tanker rupture": { rate: 400, wind: 2, threshold: 1 },
  "Calm night": { rate: 100, wind: 1, threshold: 0.5 },
  "Windy day": { rate: 150, wind: 12, threshold: 2 },
};

export function HazmatPlumeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ rate, wind, threshold }, update] = useShareableNumbers({ rate: 50, wind: 4, threshold: 1 });
  const [stab, setStab] = useState("D");
  const [pad, setPad] = useState(0);

  useEffect(() => {
    const Q = rate; const u = Math.max(0.5, wind); const S = STABILITY[stab];
    const sigmaY = (x: number) => S.a * x / Math.pow(1 + S.b * x, 0.5);
    const sigmaZ = (x: number) => S.c * x / Math.pow(1 + S.d * x, 0.5);
    const conc = (x: number, y: number) => { if (x <= 0) return 0; const sy = sigmaY(x), sz = sigmaZ(x); if (sy <= 0 || sz <= 0) return 0;
      return (Q / (Math.PI * u * sy * sz)) * Math.exp(-(y * y) / (2 * sy * sy)) * 1000; }; // mg/m^3 ground level (z=0,H=0)
    // protective action distance: where centerline conc drops below threshold
    let padDist = 0; for (let x = 5; x < 20000; x += 5) { if (conc(x, 0) < threshold) { padDist = x; break; } }
    setPad(padDist);
    const W = 520, H = 300; const ctx = hidpi(canvasRef.current!, W, H); const img = ctx.createImageData(W, H);
    const scaleX = (padDist > 0 ? padDist * 1.4 : 4000) / W; const scaleY = scaleX; // meters/px
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) { const x = px * scaleX; const y = (py - H / 2) * scaleY; const c = conc(x, y);
      const t = Math.min(1, Math.log10(c + 1) / 3); const idx = (py * W + px) * 4;
      img.data[idx] = 20 + t * 235; img.data[idx + 1] = 40 + (1 - t) * 60; img.data[idx + 2] = 60 * (1 - t); img.data[idx + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(2, H / 2, 6, 0, 7); ctx.fill();
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    if (padDist > 0 && padDist / scaleX < W) { const zx = padDist / scaleX; ctx.beginPath(); ctx.moveTo(zx, 0); ctx.lineTo(zx, H); ctx.stroke(); }
    ctx.setLineDash([]); ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText("release", 8, H / 2 - 10); ctx.fillText("downwind →", W - 90, H - 10);
  }, [rate, wind, stab, threshold]);

  const explain =
    wind <= 1.5
      ? "Light wind gives little dilution, so the plume stays concentrated and the protective action distance stretches far downwind."
      : stab === "F"
      ? "Very stable air (class F) suppresses vertical mixing, so the plume stays tight and travels a long way before dropping below the action level."
      : stab === "A"
      ? "Very unstable air (class A) mixes the release rapidly, spreading it wide and diluting it close to the source."
      : "Concentration falls off as the wind stretches and vertical mixing thins the plume — stronger wind and less stable air pull the protective distance in toward the source.";

  const code = `import numpy as np
Q, u = ${rate}, ${Math.max(0.5, wind)}          # g/s, m/s
a, c = 0.08, 0.06              # Pasquill class D coefficients
sy = lambda x: a*x/np.sqrt(1 + 1e-4*x)
sz = lambda x: c*x/np.sqrt(1 + 1.5e-3*x)
conc = lambda x: Q/(np.pi*u*sy(x)*sz(x))*1000  # mg/m^3 on centerline
print([round(conc(x), 2) for x in (100, 500, 1000)])`;

  return (
    <StudioChrome title="Hazmat Plume Dispersion" tagline="Gaussian plume · protective action"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Release rate (g/s)" value={rate} min={1} max={500} step={1} onChange={(v) => update({ rate: v })} />
        <Slider label="Wind speed (m/s)" value={wind} min={0.5} max={15} step={0.5} onChange={(v) => update({ wind: v })} />
        <Slider label="Action level (mg/m³)" value={threshold} min={0.1} max={20} step={0.1} onChange={(v) => update({ threshold: v })} />
        <div className="mt-3 grid grid-cols-4 gap-1">{Object.keys(STABILITY).map((k) => <button key={k} onClick={() => setStab(k)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${stab === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">A Gaussian plume estimates how a gas or vapor release disperses downwind. Stability class (A unstable to F stable) sets how fast the plume spreads. The dashed line is the protective action distance where concentration falls below your action level. Screening estimate only — use ERG and monitors on scene.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Protective distance" value={pad > 0 ? `${(pad).toLocaleString()} m` : ">20 km"} />
        <Stat label="Stability" value={STABILITY[stab].label} />
        <Stat label="Wind" value={`${wind} m/s`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
