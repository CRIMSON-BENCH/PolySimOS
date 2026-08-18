"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { pressure: number }> = {
  "Tropical storm": { pressure: 1000 },
  "Cat 1": { pressure: 980 },
  "Cat 3": { pressure: 950 },
  "Cat 5 monster": { pressure: 900 },
};

export function HurricaneStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ pressure }, update] = useShareableNumbers({ pressure: 950 }); // central mbar
  const [running, setRunning] = useState(true);
  const rot = useRef(0);

  const deficit = 1013 - pressure; const maxWind = 6.3 * Math.sqrt(deficit); // m/s approx
  const kmh = maxWind * 3.6; const mph = maxWind * 2.237;
  const cat = mph >= 157 ? 5 : mph >= 130 ? 4 : mph >= 111 ? 3 : mph >= 96 ? 2 : mph >= 74 ? 1 : 0;

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      rot.current += 0.02 + deficit / 5000; const W = 400, H = 380; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2; const size = 60 + deficit * 1.2;
      // spiral bands
      for (let arm = 0; arm < 5; arm++) { ctx.strokeStyle = `rgba(34,211,238,${0.5 - arm * 0.06})`; ctx.lineWidth = 6; ctx.beginPath(); for (let t = 0; t < 6; t += 0.1) { const r = 12 + t * size / 6; const a = t * 1.6 + rot.current + arm * 1.256; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
      // eye
      ctx.fillStyle = "#0b1220"; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill(); ctx.strokeStyle = "#f472b6"; ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`Category ${cat} — eye at center`, 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [pressure, running]);

  const explain =
    cat >= 5
      ? "The pressure has plunged into catastrophic territory — winds scale as the square root of the deficit, so each extra millibar of drop now buys a large jump in destructive power."
      : cat >= 3
      ? "This is a major hurricane: the deep central low is driving eyewall winds strong enough to cause devastating damage well inland."
      : cat >= 1
      ? "A moderate pressure deficit gives a genuine hurricane, but doubling the wind would require roughly four times this deficit — intensity climbs slowly with pressure."
      : "The low is still shallow, so winds stay at tropical-storm strength; the storm needs to deepen its central pressure substantially to reach hurricane force.";

  const code = `import numpy as np
pressure = ${pressure}  # central mbar
deficit = 1013 - pressure
max_wind = 6.3 * np.sqrt(deficit)  # m/s
mph = max_wind * 2.237
print("deficit", deficit, "mbar | max wind", round(mph), "mph")`;

  return (
    <StudioChrome title="Hurricane Wind Model" tagline="pressure drives the wind"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Central pressure (mbar)" value={pressure} min={880} max={1005} step={1} onChange={(v) => update({ pressure: v })} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">A hurricane is a giant heat engine whose winds are driven by the pressure drop at its center — the deeper the low, the fiercer the winds, roughly as the square root of the pressure deficit. The calm eye sits in the middle, ringed by the eyewall of strongest wind. Central pressure is the single best predictor of a storm&apos;s intensity.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Pressure deficit" value={`${deficit} mbar`} /><Stat label="Max wind" value={`${kmh.toFixed(0)} km/h`} /><Stat label="Max wind (mph)" value={`${mph.toFixed(0)} mph`} /><Stat label="Saffir-Simpson" value={cat === 0 ? "tropical storm" : `Category ${cat}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={400} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
