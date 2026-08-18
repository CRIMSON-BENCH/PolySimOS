"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { T: number; logP: number }> = {
  "Ice (−20 °C)": { T: -20, logP: 2 },
  "Liquid water (25 °C)": { T: 25, logP: 2 },
  "Boiling (100 °C)": { T: 100, logP: 2 },
  "Low-pressure vapor": { T: 20, logP: -0.5 },
};

// Water phase diagram (schematic, log-P vs T).
export function PhaseDiagramStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ T, logP }, update] = useShareableNumbers({ T: 25, logP: 2 });

  // schematic boundaries
  const phaseOf = (Tc: number, lp: number) => {
    const P = Math.pow(10, lp);
    // sublimation/melting/vaporization approximations
    const meltT = 0.0; // ~0C
    const vapT = 100 + 28 * (lp - 2.005); // boiling rises with pressure
    if (Tc < meltT && P < 0.6) return "gas";
    if (Tc < meltT) return "solid";
    if (Tc < vapT && P > 0.6) return "liquid";
    if (P < 0.6 && Tc < 0.01) return "solid";
    return "gas";
  };
  const phase = phaseOf(T, logP);

  useEffect(() => {
    const W = 500, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const Tmin = -50, Tmax = 400, lpMin = -1, lpMax = 5;
    const X = (t: number) => ox + ((t - Tmin) / (Tmax - Tmin)) * pw; const Y = (lp: number) => oy - ((lp - lpMin) / (lpMax - lpMin)) * ph;
    // regions (rough shading)
    for (let py = 0; py < ph; py += 3) for (let px = 0; px < pw; px += 3) { const t = Tmin + (px / pw) * (Tmax - Tmin); const lp = lpMin + (1 - py / ph) * (lpMax - lpMin); const ph2 = phaseOf(t, lp);
      ctx.fillStyle = ph2 === "solid" ? "rgba(96,165,250,0.25)" : ph2 === "liquid" ? "rgba(34,211,238,0.22)" : "rgba(244,114,182,0.14)"; ctx.fillRect(ox + px, oy - ph + py, 3, 3); }
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // triple + critical points
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(X(0.01), Y(Math.log10(0.61)), 4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(X(374), Y(Math.log10(22064)), 4, 0, 7); ctx.fill();
    ctx.font = "10px sans-serif"; ctx.fillStyle = "#fde68a"; ctx.fillText("triple", X(0.01) + 5, Y(Math.log10(0.61))); ctx.fillText("critical", X(374) - 44, Y(Math.log10(22064)) + 12);
    // current point
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(X(T), Y(logP), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("solid / liquid / gas", ox + 6, oy - ph + 12); ctx.fillText("temperature (°C) →", ox + pw - 120, oy + 18);
  }, [T, logP]);

  const explain =
    phase === "solid"
      ? "Solid (ice): this temperature–pressure point sits left of the melting line, so water stays frozen."
      : phase === "liquid"
      ? "Liquid: warm enough to melt yet below the boiling line at this pressure, so the stable state is liquid water."
      : logP < Math.log10(0.6)
      ? "Gas: the pressure is below the triple-point line, so water exists as vapor rather than a liquid at any temperature."
      : "Gas (vapor): above the boiling line for this pressure, so water has fully evaporated.";

  const code = `import math
T, logP = ${T}, ${logP}
P = 10**logP  # kPa
vapT = 100 + 28*(logP - 2.005)
if T < 0 and P < 0.6: phase = 'gas'
elif T < 0: phase = 'solid'
elif T < vapT and P > 0.6: phase = 'liquid'
else: phase = 'gas'
print(phase, round(P), 'kPa')`;

  return (
    <StudioChrome title="Phase Diagram (Water)" tagline="solid, liquid, gas"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Temperature (°C)" value={T} min={-50} max={400} step={1} onChange={(v) => update({ T: v })} />
        <Slider label="Pressure log₁₀(kPa)" value={logP} min={-1} max={5} step={0.05} onChange={(v) => update({ logP: v })} />
        <p className="mt-3 text-xs text-slate-500">A phase diagram maps which state — solid, liquid, or gas — a substance takes at each temperature and pressure. The lines are phase boundaries; cross one and the material transforms. All three meet at the triple point, and the liquid-gas line ends at the critical point beyond which liquid and gas become indistinguishable.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Phase" value={phase} /><Stat label="Temperature" value={`${T} °C`} /><Stat label="Pressure" value={`${Math.pow(10, logP).toFixed(0)} kPa`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
