"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { rhoRatio: number; distance: number }> = {
  "Saturn-like rings": { rhoRatio: 3, distance: 1.5 },
  "Stable moon": { rhoRatio: 1, distance: 3 },
  "Comet shredded": { rhoRatio: 5, distance: 1.5 },
  "Grazing orbit": { rhoRatio: 2, distance: 2.5 },
};

export function RocheLimitStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ rhoRatio, distance }, update] = useShareableNumbers({ rhoRatio: 1.0, distance: 2.5 });
  const Rprimary = 1;
  // Roche limit (rigid) d = R * (2 * rhoP/rhoS)^(1/3)
  const roche = Rprimary * Math.pow(2 * rhoRatio, 1 / 3);
  const inside = distance < roche;

  useEffect(() => {
    const W = 520, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = 120, cy = H / 2; const scale = 60;
    // primary
    const g = ctx.createRadialGradient(cx, cy, 5, cx, cy, scale); g.addColorStop(0, "#fbbf24"); g.addColorStop(1, "#b45309"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, scale, 0, 7); ctx.fill();
    // roche ring
    ctx.strokeStyle = "#ef4444"; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(cx, cy, roche * scale, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#fca5a5"; ctx.font = "11px sans-serif"; ctx.fillText("Roche limit", cx + roche * scale - 30, cy - roche * scale - 6);
    // satellite (or debris ring if inside)
    const sx = cx + distance * scale;
    if (inside) { ctx.fillStyle = "#93c5fd"; for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; const rr = distance * scale + Math.sin(i * 3) * 8; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.35, 2, 0, 7); ctx.fill(); } ctx.fillStyle = "#f87171"; ctx.font = "13px sans-serif"; ctx.fillText("torn into a ring", sx - 30, cy - 30); }
    else { ctx.fillStyle = "#60a5fa"; ctx.beginPath(); ctx.arc(sx, cy, 16, 0, 7); ctx.fill(); ctx.fillStyle = "#bfdbfe"; ctx.fillText("intact moon", sx - 28, cy - 24); }
  }, [rhoRatio, distance, roche, inside]);

  const margin = ((distance - roche) / roche) * 100;
  const explain = inside
    ? `Inside the Roche limit: at ${distance.toFixed(1)} R the moon sits ${Math.abs(margin).toFixed(0)}% below the ${roche.toFixed(2)} R threshold, so tides overwhelm its self-gravity and tear it into a ring.`
    : `Outside the Roche limit: at ${distance.toFixed(1)} R the moon has a ${margin.toFixed(0)}% margin above the ${roche.toFixed(2)} R threshold, so its own gravity holds it together.`;

  const code = `rho_ratio, distance = ${rhoRatio}, ${distance}  # distance in primary radii R
roche = (2 * rho_ratio) ** (1 / 3)
print("Roche limit", round(roche, 3), "R ->", "disrupted" if distance < roche else "stable")`;

  return (
    <StudioChrome title="Roche Limit" tagline="when tides tear a moon apart"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Density ratio ρ_primary/ρ_sat" value={rhoRatio} min={0.2} max={5} step={0.1} onChange={(v) => update({ rhoRatio: v })} />
        <Slider label="Orbit distance (primary radii)" value={distance} min={1} max={5} step={0.1} onChange={(v) => update({ distance: v })} />
        <p className="mt-3 text-xs text-slate-500">Inside the Roche limit, tidal forces from the primary exceed the satellite&apos;s own gravity and pull it apart — the origin of planetary rings. The rigid-body limit is d = R·(2·ρ_primary/ρ_sat)^(1/3). Drag the moon inside the red ring to shred it.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Roche limit" value={`${roche.toFixed(2)} R`} /><Stat label="Orbit" value={`${distance.toFixed(1)} R`} /><Stat label="Status" value={inside ? "DISRUPTED" : "stable"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
