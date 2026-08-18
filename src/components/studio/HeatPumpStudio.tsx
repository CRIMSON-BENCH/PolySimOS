"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { indoor: number; outdoor: number; effFrac: number }> = {
  "Mild winter": { indoor: 21, outdoor: 7, effFrac: 0.5 },
  "Cool day": { indoor: 20, outdoor: 12, effFrac: 0.55 },
  "Hard freeze": { indoor: 21, outdoor: -10, effFrac: 0.45 },
  "Deep cold": { indoor: 22, outdoor: -18, effFrac: 0.4 },
};

export function HeatPumpStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ indoor, outdoor, effFrac }, update] = useShareableNumbers({ indoor: 21, outdoor: 2, effFrac: 0.5 });

  const Th = indoor + 273.15, Tc = outdoor + 273.15; const carnotCOP = Th / Math.max(1, Th - Tc); const cop = Math.max(1, carnotCOP * effFrac);

  useEffect(() => {
    const W = 500, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let t = -20; t <= 20; t += 0.5) { const c = Math.max(1, Th / Math.max(1, Th - (t + 273.15)) * effFrac); const x = ox + ((t + 20) / 40) * pw; const y = oy - (c / 8) * ph; t === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    const px = ox + ((outdoor + 20) / 40) * pw; const py = oy - (cop / 8) * ph; ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("COP vs outdoor temperature", ox + 6, oy - ph + 12); ctx.fillText("outdoor °C →", ox + pw - 80, oy + 16);
  }, [indoor, outdoor, effFrac]);

  const explain = cop >= 3
    ? `At ${outdoor}°C the pump delivers about ${cop.toFixed(1)} kW of heat per kW of electricity — roughly ${cop.toFixed(1)}× a resistance heater — because it moves heat rather than making it.`
    : `${outdoor}°C outside narrows the Carnot gap, so COP falls to ${cop.toFixed(1)} — still above 1, so the pump beats direct electric heat even here.`;

  const code = `Th, Tc = ${indoor} + 273.15, ${outdoor} + 273.15
carnot = Th / max(1, Th - Tc)
cop = max(1, carnot * ${effFrac})
print("COP", round(cop, 2), "Carnot_max", round(carnot, 1))`;

  return (
    <StudioChrome title="Heat Pump COP" tagline="more heat than the energy in"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Indoor temp (°C)" value={indoor} min={16} max={26} step={1} onChange={(v) => update({ indoor: v })} />
        <Slider label="Outdoor temp (°C)" value={outdoor} min={-20} max={20} step={1} onChange={(v) => update({ outdoor: v })} />
        <Slider label="Fraction of Carnot" value={effFrac} min={0.3} max={0.7} step={0.05} onChange={(v) => update({ effFrac: v })} />
        <p className="mt-3 text-xs text-slate-500">A heat pump does not make heat — it moves it, so it can deliver several kilowatts of warmth per kilowatt of electricity. The coefficient of performance is that ratio, capped by the Carnot limit T_hot/(T_hot − T_cold). The colder it gets outside, the harder the pump works and the lower the COP — but even at freezing it beats a resistance heater several times over.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="COP" value={cop.toFixed(2)} /><Stat label="Carnot max COP" value={carnotCOP.toFixed(1)} /><Stat label="Heat per kW power" value={`${cop.toFixed(1)} kW`} /><Stat label="vs resistance heater" value={`${cop.toFixed(1)}× better`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
