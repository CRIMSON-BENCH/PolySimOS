"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { g: number; pr: number }> = {
  "Air (γ=1.4)": { g: 1.4, pr: 0.2 },
  "Rocket hot gas (γ=1.2)": { g: 1.2, pr: 0.05 },
  "Monatomic (γ=1.67)": { g: 1.67, pr: 0.3 },
  "Barely choked": { g: 1.4, pr: 0.5 },
};

export function CompressibleNozzleStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ g, pr }, update] = useShareableNumbers({ g: 1.4, pr: 0.2 });
  // exit Mach from pressure ratio (isentropic): p/p0 = (1 + (g-1)/2 M²)^(-g/(g-1))
  const Me = Math.sqrt((2 / (g - 1)) * (Math.pow(1 / pr, (g - 1) / g) - 1));
  const areaRatio = (M: number) => (1 / M) * Math.pow((2 / (g + 1)) * (1 + (g - 1) / 2 * M * M), (g + 1) / (2 * (g - 1)));
  const AeAstar = Me > 0 ? areaRatio(Me) : 1;

  const explain =
    Me > 1
      ? `Exit Mach ${Me.toFixed(2)} is supersonic — the flow chokes at Mach 1 in the throat, then the diverging section keeps accelerating it, which demands an area ratio Ae/A* of ${AeAstar.toFixed(2)}.`
      : `A back-pressure ratio this high barely drives the throat to Mach 1, so the exit stays near-sonic (M ${Me.toFixed(2)}) and almost no supersonic expansion occurs.`;

  const code = `import numpy as np
g, pr = ${g}, ${pr}
Me = np.sqrt((2/(g-1)) * ((1/pr)**((g-1)/g) - 1))
AeAstar = (1/Me) * ((2/(g+1)) * (1 + (g-1)/2*Me**2))**((g+1)/(2*(g-1)))
print("exit Mach", round(Me, 3), "| area ratio Ae/A*", round(AeAstar, 3))`;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2;
    // converging-diverging nozzle profile: throat at x=0.4
    ctx.strokeStyle = "#64748b"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const x = i / 100; const r = x < 0.4 ? 70 - (x / 0.4) * 45 : 25 + ((x - 0.4) / 0.6) * (18 + AeAstar * 8); const px = 40 + x * (W - 80); i ? ctx.lineTo(px, cy - r) : ctx.moveTo(px, cy - r); } ctx.stroke();
    ctx.beginPath(); for (let i = 0; i <= 100; i++) { const x = i / 100; const r = x < 0.4 ? 70 - (x / 0.4) * 45 : 25 + ((x - 0.4) / 0.6) * (18 + AeAstar * 8); const px = 40 + x * (W - 80); i ? ctx.lineTo(px, cy + r) : ctx.moveTo(px, cy + r); } ctx.stroke();
    // Mach color flow
    for (let i = 0; i < 100; i++) { const x = i / 100; const M = x < 0.4 ? 0.2 + x * 2 : 1 + (x - 0.4) / 0.6 * (Me - 1); const px = 40 + x * (W - 80); ctx.strokeStyle = M > 1 ? "#f472b6" : "#22d3ee"; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(px, cy - 8); ctx.lineTo(px, cy + 8); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("subsonic (cyan) → throat → supersonic (pink)", 40, 24);
  }, [g, pr, Me, AeAstar]);

  return (
    <StudioChrome title="Compressible Nozzle Flow" tagline="converging–diverging & choked flow"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Specific-heat ratio γ" value={g} min={1.1} max={1.67} step={0.01} onChange={(v) => update({ g: v })} />
        <Slider label="Back/stagnation pressure ratio" value={pr} min={0.02} max={0.9} step={0.01} onChange={(v) => update({ pr: v })} />
        <p className="mt-3 text-xs text-slate-500">In a converging–diverging (de Laval) nozzle, gas accelerates to Mach 1 at the throat, then goes supersonic in the diverging section. The exit Mach number follows from the pressure ratio via isentropic flow relations. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Exit Mach number" value={Me.toFixed(2)} />
        <Stat label="Area ratio Aₑ/A*" value={AeAstar.toFixed(2)} />
        <Stat label="Flow regime" value={Me > 1 ? "supersonic" : "subsonic"} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
