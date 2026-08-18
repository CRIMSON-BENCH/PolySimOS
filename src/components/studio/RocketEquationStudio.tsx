"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { isp: number; ratio: number; stages: number }> = {
  "Kerosene single": { isp: 300, ratio: 5, stages: 1 },
  "Hydrolox upper": { isp: 450, ratio: 6, stages: 1 },
  "Two-stage LEO": { isp: 340, ratio: 6, stages: 2 },
  "Ion probe": { isp: 460, ratio: 3, stages: 1 },
};

export function RocketEquationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ isp, ratio, stages }, update] = useShareableNumbers({ isp: 300, ratio: 5, stages: 1 });

  const ve = isp * 9.81, dvStage = ve * Math.log(ratio), dvTotal = dvStage * stages, leo = 9400;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const maxR = 12, maxDv = ve * Math.log(maxR) * Math.max(1, stages);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const r = 1 + (maxR - 1) * i / pw; const dv = ve * Math.log(r) * stages; const x = ox + i, y = oy - (dv / maxDv) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    const yLeo = oy - (leo / maxDv) * ph; if (yLeo > oy - ph) { ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox, yLeo); ctx.lineTo(ox + pw, yLeo); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#a3e635"; ctx.font = "10px sans-serif"; ctx.fillText("LEO 9.4 km/s", ox + 6, yLeo - 4); }
    const mx = ox + ((ratio - 1) / (maxR - 1)) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(mx, oy); ctx.lineTo(mx, oy - (dvTotal / maxDv) * ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("Δv vs mass ratio (Tsiolkovsky)", ox + 6, oy - ph + 12); ctx.fillText("mass ratio m₀/mf →", ox + pw - 120, oy + 18);
  }, [isp, ratio, stages, ve, dvTotal]);

  const explain = dvTotal >= leo
    ? `This configuration clears LEO: ${stages} stage(s) at Isp ${isp}s and mass ratio ${ratio} deliver ${(dvTotal / 1000).toFixed(1)} km/s, above the ~9.4 km/s budget.`
    : `Short of orbit by ${((leo - dvTotal) / 1000).toFixed(1)} km/s. Because Δv scales only with ln(mass ratio), raise Isp, lift the mass ratio, or add a stage rather than just adding propellant.`;

  const code = `import math
isp, ratio, stages = ${isp}, ${ratio}, ${stages}
ve = isp * 9.81
dv_stage = ve * math.log(ratio)
dv_total = dv_stage * stages
print("dv per stage", round(dv_stage), "m/s; total", round(dv_total), "m/s")
print("reaches LEO" if dv_total >= 9400 else "short of LEO")`;

  return (
    <StudioChrome title="Rocket Equation (Tsiolkovsky)" tagline="the tyranny of the rocket equation"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Specific impulse Isp (s)" value={isp} min={200} max={460} step={5} onChange={(v) => update({ isp: v })} />
        <Slider label="Mass ratio m₀/mf per stage" value={ratio} min={1.5} max={12} step={0.5} onChange={(v) => update({ ratio: v })} />
        <Slider label="Number of stages" value={stages} min={1} max={4} step={1} onChange={(v) => update({ stages: v })} />
        <p className="mt-3 text-xs text-slate-500">Δv = Isp·g·ln(m₀/mf). Because Δv grows only with the log of the mass ratio, reaching orbit (~9.4 km/s) demands enormous propellant fractions — which is exactly why rockets stage.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Exhaust velocity" value={`${(ve / 1000).toFixed(2)} km/s`} />
        <Stat label="Δv per stage" value={`${(dvStage / 1000).toFixed(2)} km/s`} />
        <Stat label="Total Δv" value={`${(dvTotal / 1000).toFixed(2)} km/s`} />
        <Stat label="Reaches LEO?" value={dvTotal >= leo ? "yes ✓" : "no"} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
