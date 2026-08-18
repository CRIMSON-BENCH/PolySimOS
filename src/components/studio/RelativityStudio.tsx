"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { beta: number }> = {
  "Everyday (0.1c)": { beta: 0.1 },
  "Half light (0.5c)": { beta: 0.5 },
  "Ultra (0.9c)": { beta: 0.9 },
  "Extreme (0.99c)": { beta: 0.99 },
};

export function RelativityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ beta }, update] = useShareableNumbers({ beta: 0.6 }); // v/c
  const gamma = 1 / Math.sqrt(1 - beta * beta);

  useEffect(() => {
    const W = 520, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // rest ruler + moving (contracted) ruler
    const restLen = 300, restY = 90, movY = 200; const ox = 60;
    ctx.strokeStyle = "#64748b"; ctx.lineWidth = 2; ctx.strokeRect(ox, restY, restLen, 30);
    for (let i = 0; i <= 10; i++) { const x = ox + i * restLen / 10; ctx.beginPath(); ctx.moveTo(x, restY); ctx.lineTo(x, restY + 8); ctx.stroke(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("rest frame (proper length)", ox, restY - 8);
    const cLen = restLen / gamma; ctx.strokeStyle = "#22d3ee"; ctx.strokeRect(ox, movY, cLen, 30);
    for (let i = 0; i <= 10; i++) { const x = ox + i * cLen / 10; ctx.beginPath(); ctx.moveTo(x, movY); ctx.lineTo(x, movY + 8); ctx.stroke(); }
    ctx.fillStyle = "#67e8f9"; ctx.fillText(`moving at ${(beta * 100).toFixed(0)}% c — length contracted ×${(1 / gamma).toFixed(2)}`, ox, movY - 8);
    // clock
    ctx.fillStyle = "#f472b6"; ctx.fillText(`1 s of proper time = ${gamma.toFixed(2)} s to the observer`, ox, movY + 60);
  }, [beta, gamma]);

  const c = 299792458;

  const explain =
    beta < 0.1
      ? "At everyday speeds γ ≈ 1 — time dilation and length contraction are far too small to notice."
      : beta < 0.5
      ? "Relativistic effects are now measurable but modest: clocks and lengths shift by a few to tens of percent."
      : beta < 0.9
      ? "Deep in the relativistic regime — moving clocks run visibly slow and rulers shrink markedly along the motion."
      : "Ultra-relativistic: γ climbs steeply, so time dilation and length contraction become extreme as v approaches c.";

  const code = `import numpy as np
beta = ${beta}
gamma = 1/np.sqrt(1 - beta**2)
print("gamma", gamma)
print("length contraction", 1/gamma)`;

  return (
    <StudioChrome title="Special Relativity" tagline="time dilation & length contraction"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Speed v (fraction of c)" value={beta} min={0} max={0.999} step={0.001} onChange={(v) => update({ beta: v })} />
        <p className="mt-3 text-xs text-slate-500">Near the speed of light, space and time warp. The Lorentz factor γ = 1/√(1−v²/c²) governs it all: moving clocks run slow by γ (time dilation), moving objects shrink along their motion by 1/γ (length contraction), and energy grows without bound. At everyday speeds γ ≈ 1, so we never notice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Lorentz factor γ" value={gamma.toFixed(3)} /><Stat label="Time dilation" value={`×${gamma.toFixed(2)}`} /><Stat label="Length contraction" value={`×${(1 / gamma).toFixed(3)}`} /><Stat label="Speed" value={`${(beta * c / 1e6).toFixed(0)} Mm/s`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
