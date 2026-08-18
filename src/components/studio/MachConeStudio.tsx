"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { mach: number }> = {
  "Airliner (0.85)": { mach: 0.85 },
  "Just supersonic (1.2)": { mach: 1.2 },
  "Concorde (2.0)": { mach: 2.0 },
  "Hypersonic (5.0)": { mach: 5.0 },
};

export function MachConeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ mach }, update] = useShareableNumbers({ mach: 2 });

  const coneAngle = mach > 1 ? Math.asin(1 / mach) * 180 / Math.PI : 90;

  useEffect(() => {
    const W = 540, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2; const acx = W - 120;
    // expanding sound circles emitted along the path
    const speed = 60; const c = speed / mach;
    for (let k = 1; k <= 6; k++) { const emitX = acx - k * speed * 0.9; const r = k * c * 0.9; ctx.strokeStyle = "rgba(34,211,238,0.4)"; ctx.beginPath(); ctx.arc(emitX, cy, r, 0, 7); ctx.stroke(); }
    // Mach cone lines (if supersonic)
    if (mach > 1) { const ang = Math.asin(1 / mach); ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(acx, cy); ctx.lineTo(acx - W, cy - W * Math.tan(ang)); ctx.moveTo(acx, cy); ctx.lineTo(acx - W, cy + W * Math.tan(ang)); ctx.stroke(); }
    // aircraft
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.moveTo(acx + 14, cy); ctx.lineTo(acx - 12, cy - 7); ctx.lineTo(acx - 12, cy + 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(mach > 1 ? `Mach cone half-angle ${coneAngle.toFixed(1)}°` : "subsonic — sound outruns the aircraft", 16, 24);
  }, [mach, coneAngle]);

  const explain =
    mach < 0.8
      ? `At Mach ${mach.toFixed(1)} the aircraft is subsonic — its pressure waves race ahead, so no shock cone forms and there is no boom.`
      : mach < 1.2
      ? `Near Mach ${mach.toFixed(1)} the flow is transonic: shocks are just forming and drag spikes sharply through the sound barrier.`
      : `At Mach ${mach.toFixed(1)} the half-angle is arcsin(1/M) = ${coneAngle.toFixed(1)}° — faster flight sweeps the Mach cone tighter around the flight path.`;

  const code = `import numpy as np
mach = ${mach}
half_angle = np.degrees(np.arcsin(1/mach)) if mach > 1 else 90.0
print("Mach cone half-angle (deg):", round(half_angle, 2))`;

  return (
    <StudioChrome title="Mach Cone & Sonic Boom" tagline="supersonic shock geometry"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Mach number" value={mach} min={0.3} max={5} step={0.1} onChange={(v) => update({ mach: v })} />
        <p className="mt-3 text-xs text-slate-500">Below the speed of sound, pressure waves race ahead of an aircraft. At and above Mach 1 the aircraft outruns its own sound, and the waves pile into a cone-shaped shock — the sonic boom. The faster it flies, the more sharply swept the Mach cone: its half-angle is arcsin(1/M). This geometry governs supersonic and hypersonic vehicle design.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Mach" value={mach.toFixed(1)} /><Stat label="Regime" value={mach < 0.8 ? "subsonic" : mach < 1.2 ? "transonic" : mach < 5 ? "supersonic" : "hypersonic"} /><Stat label="Cone half-angle" value={mach > 1 ? `${coneAngle.toFixed(1)}°` : "—"} /><Equation tex={`\\mu = \\arcsin\\frac{1}{M} = \\arcsin\\frac{a}{v} = \\arcsin\\frac{1}{${mach.toFixed(1)}} = ${mach > 1 ? coneAngle.toFixed(1) : "90.0"}^\\circ`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
