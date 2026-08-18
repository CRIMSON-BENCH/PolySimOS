"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

// Composite-wall heat conduction: series thermal resistances, R-value.
const LAYERS = [
  { name: "Drywall", k: 0.17, color: "#cbd5e1" },
  { name: "Insulation", k: 0.04, color: "#fbbf24" },
  { name: "Brick", k: 0.72, color: "#b45309" },
];

const PRESETS: Record<string, { Tin: number; Tout: number }> = {
  "Winter": { Tin: 21, Tout: -5 },
  "Deep freeze": { Tin: 22, Tout: -30 },
  "Mild day": { Tin: 20, Tout: 12 },
  "Cool spring": { Tin: 19, Tout: 5 },
};

export function ThermalResistanceStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thick, setThick] = useState([12, 100, 100]); // mm
  const [{ Tin, Tout }, update] = useShareableNumbers({ Tin: 21, Tout: -5 });

  const R = thick.map((t, i) => (t / 1000) / LAYERS[i].k); // per m^2
  const Rtot = R.reduce((a, b) => a + b, 0); const U = 1 / Rtot; const Q = (Tin - Tout) * U;
  // interface temps
  const temps = [Tin]; let acc = Tin; for (let i = 0; i < R.length; i++) { acc -= Q * R[i]; temps.push(acc); }

  useEffect(() => {
    const W = 540, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, top = 40, wh = 160; const totalT = thick.reduce((a, b) => a + b, 0); let x = ox; const scale = (W - 120) / totalT;
    LAYERS.forEach((l, i) => { const w = thick[i] * scale; ctx.fillStyle = l.color; ctx.globalAlpha = 0.5; ctx.fillRect(x, top, w, wh); ctx.globalAlpha = 1; ctx.strokeStyle = "#0b1220"; ctx.strokeRect(x, top, w, wh); ctx.fillStyle = "#e2e8f0"; ctx.font = "10px sans-serif"; ctx.save(); ctx.translate(x + w / 2, top + wh / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(l.name, -20, 0); ctx.restore(); x += w; });
    // temperature gradient line
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); x = ox; const Y = (t: number) => top + wh - ((t - Tout) / (Tin - Tout)) * wh;
    ctx.moveTo(x, Y(temps[0])); for (let i = 0; i < thick.length; i++) { x += thick[i] * scale; ctx.lineTo(x, Y(temps[i + 1])); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${Tin}°C inside`, ox, top - 8); ctx.fillText(`${Tout}°C outside`, W - 110, top - 8);
  }, [thick, Tin, Tout]);

  const set = (i: number, v: number) => setThick((t) => t.map((x, j) => j === i ? v : x));

  const dom = R.indexOf(Math.max(...R));
  const explain = `The ${LAYERS[dom].name.toLowerCase()} layer carries the most thermal resistance, so the temperature falls most steeply across it. A total R-value of ${Rtot.toFixed(2)} m²K/W lets ${Q.toFixed(1)} W/m² flow for this ${(Tin - Tout).toFixed(0)}°C difference.`;

  const code = `# Composite wall: thermal resistances in series
k = [${LAYERS.map((l) => l.k).join(", ")}]  # W/m.K per layer
t_mm = [${thick.join(", ")}]
R = [(t / 1000) / ki for t, ki in zip(t_mm, k)]
Rtot = sum(R)
U = 1 / Rtot
Q = (${Tin} - (${Tout})) * U
print("Rtot", Rtot, "U", U, "Q(W/m^2)", Q)`;

  return (
    <StudioChrome title="Composite Wall Heat Transfer" tagline="R-value & U-value"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        {LAYERS.map((l, i) => <Slider key={l.name} label={`${l.name} (mm)`} value={thick[i]} min={5} max={250} step={5} onChange={(v) => set(i, v)} />)}
        <Slider label="Inside temp (°C)" value={Tin} min={10} max={30} step={1} onChange={(v) => update({ Tin: v })} />
        <Slider label="Outside temp (°C)" value={Tout} min={-30} max={20} step={1} onChange={(v) => update({ Tout: v })} />
        <p className="mt-3 text-xs text-slate-500">Heat flows through a wall like current through resistors in series. Each layer&apos;s thermal resistance is its thickness over its conductivity; adding them gives the total R-value, and the heat flux is the temperature difference divided by it. Insulation, with very low conductivity, dominates the R-value — the steep temperature drop shows where it does its work.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Total R-value" value={`${Rtot.toFixed(2)} m²K/W`} /><Stat label="U-value" value={`${U.toFixed(2)} W/m²K`} /><Stat label="Heat flux" value={`${Q.toFixed(1)} W/m²`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
