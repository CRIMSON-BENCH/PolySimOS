"use client";

import { useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { emission: number }> = {
  "Net zero": { emission: 0 },
  "Today (~10)": { emission: 10 },
  "High growth": { emission: 20 },
  "Worst case": { emission: 30 },
};

// Simple 4-box carbon cycle (GtC): atmosphere, surface ocean, deep ocean, biosphere.
export function CarbonCycleStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ emission }, update] = useShareableNumbers({ emission: 10 }); // GtC/yr
  const emissionRef = useRef(emission); emissionRef.current = emission;
  const [year, setYear] = useState(0);
  const [atm, setAtm] = useState(875);
  const box = useRef({ atm: 875, surf: 900, deep: 37000, bio: 2300 });
  const hist = useRef<number[]>([]);

  const reset = () => { box.current = { atm: 875, surf: 900, deep: 37000, bio: 2300 }; hist.current = []; setYear(0); };

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const b = box.current; const dt = 0.25;
    for (let stp = 0; stp < steps; stp++) {
      for (let i = 0; i < 4; i++) {
        const fAtmSurf = 0.09 * b.atm - 0.08 * b.surf; // air-sea exchange
        const fSurfDeep = 0.02 * b.surf - 0.0005 * b.deep;
        const fAtmBio = 0.03 * b.atm - 0.013 * b.bio; // photosynthesis - respiration
        b.atm += (emissionRef.current - fAtmSurf - fAtmBio) * dt;
        b.surf += (fAtmSurf - fSurfDeep) * dt;
        b.deep += fSurfDeep * dt; b.bio += fAtmBio * dt;
      }
      hist.current.push(b.atm); if (hist.current.length > 400) hist.current.shift();
    }
    setAtm(b.atm); setYear((y) => y + steps);
    const W = 520, H = 360; const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const boxes = [["Atmosphere", b.atm, "#f472b6", 20], ["Surface ocean", b.surf, "#22d3ee", 150], ["Biosphere", b.bio, "#a3e635", 280], ["Deep ocean", b.deep, "#60a5fa", 410]] as const;
    boxes.forEach(([label, val, col, x]) => { const bh = Math.min(120, Math.sqrt(val) * 1.6); ctx.fillStyle = col; ctx.fillRect(x, 130 - bh + 10, 90, bh); ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText(label, x, 160); ctx.fillText(`${val.toFixed(0)} GtC`, x, 174); });
    // atmosphere time series (ppm approx: GtC*0.469)
    const ox = 30, oy = 340, pw = W - 60, ph = 130;
    ctx.strokeStyle = "#334155"; ctx.strokeRect(ox, oy - ph, pw, ph);
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); const mn = 800, mx = 2200;
    hist.current.forEach((v, i) => { const x = ox + (i / 400) * pw; const y = oy - ((v - mn) / (mx - mn)) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#f9a8d4"; ctx.font = "11px sans-serif"; ctx.fillText(`Atmospheric CO₂: ${(b.atm * 0.469).toFixed(0)} ppm`, ox + 6, oy - ph + 14);
  };

  const t = useTransport(frame);

  const explain =
    emission <= 0
      ? "With emissions switched off, the atmosphere box drains as the ocean and biosphere keep drawing carbon down — but the deep ocean exchanges so slowly that full recovery takes centuries."
      : emission >= 20
      ? `At ${emission} GtC/yr the atmosphere fills far faster than the fast reservoirs can absorb, so CO₂ climbs steeply — the deep ocean is vast but takes it up only a trickle at a time.`
      : `At ${emission} GtC/yr the surface ocean and biosphere buffer part of the input, but they saturate, so atmospheric CO₂ keeps drifting upward rather than settling.`;

  const code = `atm, surf, deep, bio = 875, 900, 37000, 2300
emission, dt = ${emission}, 0.25
for _ in range(4000):
    f_atm_surf = 0.09*atm - 0.08*surf
    f_surf_deep = 0.02*surf - 0.0005*deep
    f_atm_bio = 0.03*atm - 0.013*bio
    atm += (emission - f_atm_surf - f_atm_bio)*dt
    surf += (f_atm_surf - f_surf_deep)*dt
    deep += f_surf_deep*dt; bio += f_atm_bio*dt
print("atmosphere GtC", round(atm), "ppm", round(atm*0.469))`;

  return (
    <StudioChrome title="Carbon Cycle Box Model" tagline="reservoirs & fluxes"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Emissions (GtC/yr)" value={emission} min={0} max={30} step={0.5} onChange={(v) => update({ emission: v })} />
        <p className="mt-3 text-xs text-slate-500">Carbon moves between four great reservoirs — atmosphere, surface ocean, deep ocean, and biosphere — through exchange fluxes. Add fossil emissions to the atmosphere box and watch how slowly the oceans and land can draw it back down. The deep ocean is huge but exchanges slowly.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Year" value={String(year)} /><Stat label="Atmosphere" value={`${atm.toFixed(0)} GtC`} /><Stat label="CO₂" value={`${(atm * 0.469).toFixed(0)} ppm`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
