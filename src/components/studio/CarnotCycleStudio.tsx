"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { Th: number; Tc: number; ratio: number }> = {
  "Steam turbine": { Th: 800, Tc: 320, ratio: 4 },
  "Car engine": { Th: 1000, Tc: 330, ratio: 3 },
  "Low-grade heat": { Th: 400, Tc: 300, ratio: 2 },
  "High efficiency": { Th: 1200, Tc: 200, ratio: 5 },
};

export function CarnotCycleStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ Th, Tc, ratio }, update] = useShareableNumbers({ Th: 600, Tc: 300, ratio: 3 });

  const eff = 1 - Tc / Th; const gamma = 1.4;

  useEffect(() => {
    const W = 500, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 35, pw = W - 80, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // Carnot cycle in PV: V1..V4; isotherm PV=const, adiabat PV^gamma=const
    const V1 = 1, V2 = ratio, V3 = V2 * Math.pow(Th / Tc, 1 / (gamma - 1)), V4 = V1 * Math.pow(Th / Tc, 1 / (gamma - 1));
    const R = 8.314; const P = (V: number, T: number) => R * T / V;
    const Vmax = Math.max(V3, V4) * 1.1, Pmax = P(V1, Th) * 1.1;
    const X = (v: number) => ox + (v / Vmax) * pw; const Y = (p: number) => oy - (p / Pmax) * ph;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    // 1->2 isothermal Th
    for (let v = V1; v <= V2; v += 0.05) { const pt = P(v, Th); v === V1 ? ctx.moveTo(X(v), Y(pt)) : ctx.lineTo(X(v), Y(pt)); }
    // 2->3 adiabatic
    for (let v = V2; v <= V3; v += 0.05) { const T = Th * Math.pow(V2 / v, gamma - 1); ctx.lineTo(X(v), Y(P(v, T))); }
    // 3->4 isothermal Tc
    for (let v = V3; v >= V4; v -= 0.05) { ctx.lineTo(X(v), Y(P(v, Tc))); }
    // 4->1 adiabatic
    for (let v = V4; v >= V1; v -= 0.05) { const T = Tc * Math.pow(V4 / v, gamma - 1); ctx.lineTo(X(v), Y(P(v, T))); }
    ctx.closePath(); ctx.stroke(); ctx.fillStyle = "rgba(34,211,238,0.1)"; ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("Carnot cycle (P-V)", ox + 6, oy - ph + 12); ctx.fillText("volume →", ox + pw - 60, oy + 18);
  }, [Th, Tc, ratio]);

  const explain = `Efficiency here is ${(eff * 100).toFixed(1)}% and is fixed by the temperature ratio alone — widening the expansion ratio enlarges the enclosed work loop but can never push past the ${(eff * 100).toFixed(1)}% Carnot ceiling, and each kelvin removed from the cold side buys a bit more than each kelvin added to the hot side.`;

  const code = `# Carnot cycle efficiency and P-V corner volumes
Th, Tc, ratio = ${Th}, ${Tc}, ${ratio}
eff = 1 - Tc / Th          # depends only on reservoir temps
gamma = 1.4
V1, V2 = 1.0, ratio
V3 = V2 * (Th / Tc) ** (1 / (gamma - 1))
V4 = V1 * (Th / Tc) ** (1 / (gamma - 1))
print("efficiency", round(eff * 100, 1), "%")`;

  return (
    <StudioChrome title="Carnot Cycle" tagline="the ideal heat engine"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Hot reservoir Tₕ (K)" value={Th} min={350} max={1200} step={10} onChange={(v) => update({ Th: v })} />
        <Slider label="Cold reservoir Tc (K)" value={Tc} min={200} max={340} step={10} onChange={(v) => update({ Tc: v })} />
        <Slider label="Expansion ratio" value={ratio} min={1.5} max={6} step={0.1} onChange={(v) => update({ ratio: v })} />
        <p className="mt-3 text-xs text-slate-500">The Carnot cycle — two isothermal and two adiabatic steps — is the most efficient possible heat engine between two temperatures. Its efficiency depends only on the reservoir temperatures: η = 1 − Tc/Th. No real engine can beat it, which is why raising the hot temperature or lowering the cold one is the only path to higher efficiency.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Efficiency" value={`${(eff * 100).toFixed(1)}%`} /><Stat label="Tₕ / Tc" value={(Th / Tc).toFixed(2)} /><Stat label="Carnot limit" value={`${(eff * 100).toFixed(1)}%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
