"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { alt: number }> = {
  "Sea level": { alt: 0 },
  "Everest": { alt: 8849 },
  "Airliner": { alt: 11000 },
  "U2 spyplane": { alt: 21000 },
};

// International Standard Atmosphere.
export function StandardAtmosphereStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ alt }, update] = useShareableNumbers({ alt: 10000 });

  const isa = (h: number) => { const T0 = 288.15, P0 = 101325, L = 0.0065, g = 9.80665, R = 287.05;
    let T: number, P: number; if (h <= 11000) { T = T0 - L * h; P = P0 * Math.pow(T / T0, g / (R * L)); }
    else { T = 216.65; const P11 = P0 * Math.pow(216.65 / T0, g / (R * L)); P = P11 * Math.exp(-g * (h - 11000) / (R * 216.65)); }
    const rho = P / (R * T); return { T, P, rho }; };
  const cur = isa(alt);

  useEffect(() => {
    const W = 500, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 30, ph = H - 50, hMax = 30000;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(W - 20, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const Y = (h: number) => oy - (h / hMax) * ph;
    const plot = (fn: (h: number) => number, max: number, col: string, xoff: number, xw: number) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); for (let h = 0; h <= hMax; h += 300) { const x = ox + xoff + (fn(h) / max) * xw; const y = Y(h); h === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); };
    plot((h) => isa(h).T, 300, "#f472b6", 10, 120); plot((h) => isa(h).P, 101325, "#22d3ee", 150, 120); plot((h) => isa(h).rho, 1.3, "#a3e635", 300, 120);
    // tropopause
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, Y(11000)); ctx.lineTo(W - 20, Y(11000)); ctx.stroke(); ctx.setLineDash([]);
    // current altitude
    ctx.strokeStyle = "#fbbf24"; ctx.beginPath(); ctx.moveTo(ox, Y(alt)); ctx.lineTo(W - 20, Y(alt)); ctx.stroke();
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#f9a8d4"; ctx.fillText("T", ox + 60, 20); ctx.fillStyle = "#67e8f9"; ctx.fillText("P", ox + 200, 20); ctx.fillStyle = "#bef264"; ctx.fillText("ρ", ox + 350, 20); ctx.fillStyle = "#94a3b8"; ctx.fillText("tropopause 11 km", W - 130, Y(11000) - 4);
  }, [alt]);

  const explain =
    alt <= 11000
      ? `Below the 11 km tropopause, temperature falls at 6.5 °C/km — here it is ${(cur.T - 273.15).toFixed(0)} °C and the air holds ${(cur.rho / 1.225 * 100).toFixed(0)}% of sea-level density.`
      : `Above the tropopause the temperature holds near −56.5 °C while pressure keeps decaying — density is down to just ${(cur.rho / 1.225 * 100).toFixed(0)}% of the sea-level value.`;

  const code = `import numpy as np
alt = ${alt}   # geopotential altitude in metres
T0, P0, L, g, R = 288.15, 101325.0, 0.0065, 9.80665, 287.05
if alt <= 11000:
    T = T0 - L*alt
    P = P0*(T/T0)**(g/(R*L))
else:
    T = 216.65
    P11 = P0*(216.65/T0)**(g/(R*L))
    P = P11*np.exp(-g*(alt-11000)/(R*216.65))
rho = P/(R*T)
print("T", round(T-273.15,1), "P_kPa", round(P/1000,1), "rho", round(rho,3))`;

  return (
    <StudioChrome title="Standard Atmosphere (ISA)" tagline="temperature, pressure, density"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Altitude (m)" value={alt} min={0} max={30000} step={250} onChange={(v) => update({ alt: v })} />
        <p className="mt-3 text-xs text-slate-500">The International Standard Atmosphere is the reference model all aircraft and instruments are calibrated against. Temperature falls steadily through the troposphere at 6.5 °C/km, then holds constant in the stratosphere above the tropopause. Pressure and density decay roughly exponentially — at airliner altitude the air is only a quarter as dense as at sea level.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Temperature" value={`${(cur.T - 273.15).toFixed(1)} °C`} /><Stat label="Pressure" value={`${(cur.P / 1000).toFixed(1)} kPa`} /><Stat label="Density" value={`${cur.rho.toFixed(3)} kg/m³`} /><Stat label="% sea-level ρ" value={`${(cur.rho / 1.225 * 100).toFixed(0)}%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
