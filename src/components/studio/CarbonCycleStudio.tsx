"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
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
  const [running, setRunning] = useState(true);
  const [year, setYear] = useState(0);
  const [atm, setAtm] = useState(875);
  const box = useRef({ atm: 875, surf: 900, deep: 37000, bio: 2300 });
  const hist = useRef<number[]>([]);

  const reset = () => { box.current = { atm: 875, surf: 900, deep: 37000, bio: 2300 }; hist.current = []; setYear(0); };

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      const b = box.current; const dt = 0.25;
      for (let i = 0; i < 4; i++) {
        const fAtmSurf = 0.09 * b.atm - 0.08 * b.surf; // air-sea exchange
        const fSurfDeep = 0.02 * b.surf - 0.0005 * b.deep;
        const fAtmBio = 0.03 * b.atm - 0.013 * b.bio; // photosynthesis - respiration
        b.atm += (emission - fAtmSurf - fAtmBio) * dt;
        b.surf += (fAtmSurf - fSurfDeep) * dt;
        b.deep += fSurfDeep * dt; b.bio += fAtmBio * dt;
      }
      setAtm(b.atm); setYear((y) => y + 1); hist.current.push(b.atm); if (hist.current.length > 400) hist.current.shift();
      const W = 520, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const boxes = [["Atmosphere", b.atm, "#f472b6", 20], ["Surface ocean", b.surf, "#22d3ee", 150], ["Biosphere", b.bio, "#a3e635", 280], ["Deep ocean", b.deep, "#60a5fa", 410]] as const;
      boxes.forEach(([label, val, col, x]) => { const bh = Math.min(120, Math.sqrt(val) * 1.6); ctx.fillStyle = col; ctx.fillRect(x, 130 - bh + 10, 90, bh); ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText(label, x, 160); ctx.fillText(`${val.toFixed(0)} GtC`, x, 174); });
      // atmosphere time series (ppm approx: GtC*0.469)
      const ox = 30, oy = 340, pw = W - 60, ph = 130;
      ctx.strokeStyle = "#334155"; ctx.strokeRect(ox, oy - ph, pw, ph);
      ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); const mn = 800, mx = 2200;
      hist.current.forEach((v, i) => { const x = ox + (i / 400) * pw; const y = oy - ((v - mn) / (mx - mn)) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.fillStyle = "#f9a8d4"; ctx.font = "11px sans-serif"; ctx.fillText(`Atmospheric CO₂: ${(b.atm * 0.469).toFixed(0)} ppm`, ox + 6, oy - ph + 14);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, emission]);

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
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Emissions (GtC/yr)" value={emission} min={0} max={30} step={0.5} onChange={(v) => update({ emission: v })} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">Carbon moves between four great reservoirs — atmosphere, surface ocean, deep ocean, and biosphere — through exchange fluxes. Add fossil emissions to the atmosphere box and watch how slowly the oceans and land can draw it back down. The deep ocean is huge but exchanges slowly.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Year" value={String(year)} /><Stat label="Atmosphere" value={`${atm.toFixed(0)} GtC`} /><Stat label="CO₂" value={`${(atm * 0.469).toFixed(0)} ppm`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
