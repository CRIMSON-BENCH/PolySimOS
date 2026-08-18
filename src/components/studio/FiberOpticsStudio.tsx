"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { n1: number; n2: number; coreD: number }> = {
  "Single-mode (long-haul)": { n1: 1.4520, n2: 1.4470, coreD: 9 },
  "Multimode OM3 (50µm)": { n1: 1.4820, n2: 1.4770, coreD: 50 },
  "Multimode OM1 (62µm)": { n1: 1.4960, n2: 1.4870, coreD: 62 },
  "High-NA (wide cone)": { n1: 1.5900, n2: 1.4200, coreD: 100 },
};

export function FiberOpticsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ n1, n2, coreD }, update] = useShareableNumbers({ n1: 1.48, n2: 1.46, coreD: 50 });

  const critical = Math.asin(Math.min(1, n2 / n1)) * 180 / Math.PI;
  const NA = Math.sqrt(Math.max(0, n1 * n1 - n2 * n2)); const acceptance = Math.asin(Math.min(1, NA)) * 180 / Math.PI;
  const V = Math.PI * coreD * 1e-6 * NA / (1310e-9); const modes = V < 2.405 ? 1 : Math.round(V * V / 2);

  useEffect(() => {
    const W = 540, H = 240; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2, coreH = 60;
    ctx.fillStyle = "#1e3a5f"; ctx.fillRect(0, cy - coreH, W, coreH * 2);
    ctx.fillStyle = "#22d3ee"; ctx.globalAlpha = 0.15; ctx.fillRect(0, cy - coreH / 2, W, coreH); ctx.globalAlpha = 1;
    ctx.strokeStyle = "#475569"; ctx.beginPath(); ctx.moveTo(0, cy - coreH / 2); ctx.lineTo(W, cy - coreH / 2); ctx.moveTo(0, cy + coreH / 2); ctx.lineTo(W, cy + coreH / 2); ctx.stroke();
    // bouncing ray (TIR)
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); let x = 0, y = cy + coreH / 2, dir = -1; ctx.moveTo(x, y);
    const step = 60; while (x < W) { x += step; y += dir * coreH; if (y <= cy - coreH / 2) { y = cy - coreH / 2; dir = 1; } else if (y >= cy + coreH / 2) { y = cy + coreH / 2; dir = -1; } ctx.lineTo(x, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("core (higher n) — light trapped by total internal reflection", 10, 20); ctx.fillText("cladding", 10, cy - coreH - 4);
  }, [n1, n2, coreD]);

  const explain =
    modes <= 1
      ? `The normalized frequency V = ${V.toFixed(2)} is below the 2.405 cutoff, so only one mode propagates — single-mode fiber. A narrow core plus a small index gap is exactly the recipe for low-dispersion, long-haul links.`
      : NA > 0.3
      ? `Large index contrast gives a high numerical aperture (${NA.toFixed(2)}) and a wide ${acceptance.toFixed(0)}° acceptance cone — easy to couple light in, but the ~${modes} modes spread the pulse and limit distance.`
      : `Rays steeper than the ${critical.toFixed(1)}° critical angle reflect and stay trapped; here V = ${V.toFixed(1)} allows ~${modes} modes, so this behaves as multimode fiber — cheap and easy to launch, but modal dispersion caps the bandwidth.`;

  const code = `import numpy as np
n1, n2, core_um = ${n1}, ${n2}, ${coreD}
critical = np.degrees(np.arcsin(min(1, n2 / n1)))
NA = np.sqrt(max(0, n1**2 - n2**2))
acceptance = np.degrees(np.arcsin(min(1, NA)))
V = np.pi * core_um * 1e-6 * NA / 1310e-9
modes = 1 if V < 2.405 else round(V**2 / 2)
print("critical", round(critical, 1), "NA", round(NA, 3))
print("V", round(V, 2), "->", "single-mode" if modes <= 1 else f"multimode ~{modes}")`;

  return (
    <StudioChrome title="Fiber Optics" tagline="total internal reflection"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Core index n₁" value={n1} min={1.4} max={1.6} step={0.005} onChange={(v) => update({ n1: v })} />
        <Slider label="Cladding index n₂" value={n2} min={1.35} max={n1 - 0.005} step={0.005} onChange={(v) => update({ n2: v })} />
        <Slider label="Core diameter (µm)" value={coreD} min={4} max={100} step={1} onChange={(v) => update({ coreD: v })} />
        <p className="mt-3 text-xs text-slate-500">An optical fiber traps light in a high-index core surrounded by lower-index cladding: rays hitting the boundary above the critical angle undergo total internal reflection and bounce down the fiber for kilometers. The numerical aperture sets the acceptance cone, and the core size decides whether it carries one mode (single-mode, for long-haul) or many (multimode).</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Critical angle" value={`${critical.toFixed(1)}°`} /><Stat label="Numerical aperture" value={NA.toFixed(3)} /><Stat label="Acceptance angle" value={`${acceptance.toFixed(1)}°`} /><Stat label="Fiber type" value={modes <= 1 ? "single-mode" : `multimode (~${modes})`} /><Equation tex={`NA = \\sqrt{n_1^2 - n_2^2} = \\sqrt{${n1.toFixed(3)}^2 - ${n2.toFixed(3)}^2} = ${NA.toFixed(3)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={240} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
