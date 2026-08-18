"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { pairs: number; nH: number; nL: number }> = {
  "Titania stack": { pairs: 8, nH: 2.3, nL: 1.45 },
  "High contrast": { pairs: 12, nH: 3.5, nL: 1.3 },
  "Low contrast": { pairs: 20, nH: 1.9, nL: 1.6 },
  "Few layers": { pairs: 4, nH: 2.3, nL: 1.45 },
};

// Distributed Bragg reflector reflectivity.
export function BraggMirrorStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ pairs, nH, nL }, update] = useShareableNumbers({ pairs: 8, nH: 2.3, nL: 1.45 });
  const lam0 = 550;

  // peak reflectivity of a quarter-wave stack (n0=air, ns=glass)
  const n0 = 1, ns = 1.5; const N = Math.round(pairs);
  const ratio = Math.pow(nL / nH, 2 * N); const num = n0 * Math.pow(nH, 2 * N) - ns * Math.pow(nL, 2 * N);
  const den = n0 * Math.pow(nH, 2 * N) + ns * Math.pow(nL, 2 * N); const R = (num / den) ** 2;
  const stopband = 4 / Math.PI * Math.asin((nH - nL) / (nH + nL)) * lam0;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // reflectivity spectrum (schematic: flat-top stopband centered at lam0)
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const lam = 350 + (i / pw) * 400; const detune = Math.abs(lam - lam0) / (stopband / 2); const r = R / (1 + Math.pow(detune, 2 * N)); const y = oy - r * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("reflectivity vs wavelength", ox + 6, oy - ph + 12); ctx.fillText("stopband →", ox + pw / 2 - 30, oy - ph + 26);
    // layer stack graphic
    for (let i = 0; i < Math.min(N, 12); i++) { ctx.fillStyle = "#1e3a5f"; ctx.fillRect(ox + i * 16, oy - ph - 24, 8, 16); ctx.fillStyle = "#334155"; ctx.fillRect(ox + i * 16 + 8, oy - ph - 24, 8, 16); }
  }, [pairs, nH, nL]);

  const contrast = nH / nL;
  const explain =
    R * 100 >= 99.9
      ? "This stack already exceeds 99.9% reflectivity — enough layer pairs and index contrast push it past any polished metal mirror."
      : contrast < 1.25
      ? "Low index contrast means each interface reflects weakly, so you need many more layer pairs to reach high reflectivity."
      : Math.round(pairs) <= 5
      ? "Too few layers: reflections have not yet fully added in phase, so peak reflectivity stays modest — add pairs to climb toward 99%."
      : "Each added pair multiplies the residual transmission, so reflectivity approaches 100% geometrically — a little more contrast buys many fewer layers.";

  const code = `n0, ns = 1.0, 1.5
nH, nL, N = ${nH}, ${nL}, ${Math.round(pairs)}
num = n0*nH**(2*N) - ns*nL**(2*N)
den = n0*nH**(2*N) + ns*nL**(2*N)
R = (num/den)**2
print("peak reflectivity %", R*100)`;

  return (
    <StudioChrome title="Bragg Mirror (DBR)" tagline="a mirror from interference"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Layer pairs" value={pairs} min={2} max={30} step={1} onChange={(v) => update({ pairs: v })} />
        <Slider label="High index n_H" value={nH} min={1.8} max={3.5} step={0.05} onChange={(v) => update({ nH: v })} />
        <Slider label="Low index n_L" value={nL} min={1.3} max={1.8} step={0.05} onChange={(v) => update({ nL: v })} />
        <p className="mt-3 text-xs text-slate-500">A distributed Bragg reflector stacks alternating quarter-wave layers of high and low index. Their reflections add up in phase over a band of wavelengths — the stopband — creating a mirror that can exceed 99.99% reflectivity, far better than metal. More layer pairs and higher index contrast deepen the reflectivity. Used in lasers, fiber gratings, and dielectric mirrors.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Peak reflectivity" value={`${(R * 100).toFixed(3)}%`} />
        <Stat label="Layer pairs" value={String(Math.round(pairs))} />
        <Stat label="Index contrast" value={contrast.toFixed(2)} />
        <Stat label="Stopband width" value={`${stopband.toFixed(0)} nm`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
