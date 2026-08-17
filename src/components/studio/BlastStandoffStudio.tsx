"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Explosive overpressure via cube-root (Hopkinson-Cranz) scaling. Z = R / W^(1/3).
// Simplified Kingery-Bulmash style fit for incident overpressure (kPa) vs scaled distance (m/kg^1/3).
function overpressureKPa(Z: number): number {
  if (Z < 0.05) Z = 0.05;
  // empirical fit (approx), valid ~0.1..40 m/kg^1/3
  const p = 1772 / Math.pow(Z, 3) - 114 / Math.pow(Z, 2) + 108 / Z;
  return Math.max(0, p);
}

// Thresholds (kPa)
const ZONES = [
  { p: 83, label: "Severe structural / lethal", color: "#ef4444" },
  { p: 35, label: "Serious injury, wall collapse", color: "#f97316" },
  { p: 14, label: "Eardrum rupture risk", color: "#eab308" },
  { p: 3.5, label: "Window breakage", color: "#22d3ee" },
];

export function BlastStandoffStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [charge, setCharge] = useState(10); // kg TNT
  const [distance, setDistance] = useState(30); // m

  const W13 = Math.cbrt(charge);
  const Z = distance / W13;
  const P = overpressureKPa(Z);
  const psi = P * 0.145038;
  // safe standoff for window-breakage threshold (3.5 kPa)
  const zSafe = (() => { let lo = 0.1, hi = 60; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (overpressureKPa(mid) > 3.5) lo = mid; else hi = mid; } return hi; })();
  const safeDist = zSafe * W13;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const S = 340; ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, S, S);
    const cx = S / 2, cy = S / 2; const maxR = Math.min(cx, cy) - 10;
    // scale: map safeDist*1.2 to maxR
    const scale = maxR / (safeDist * 1.25 || 1);
    [...ZONES].reverse().forEach((z) => { // find radius where overpressure == z.p
      let lo = 0.05, hi = 80; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (overpressureKPa(mid) > z.p) lo = mid; else hi = mid; }
      const r = hi * W13 * scale; if (r < 4 || r > maxR * 1.6) return;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = z.color + "22"; ctx.fill(); ctx.strokeStyle = z.color; ctx.lineWidth = 1.5; ctx.stroke();
    });
    // charge
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fillStyle = "#fff"; ctx.fill();
    // current distance marker
    const dr = distance * scale; if (dr < maxR * 1.6) { ctx.strokeStyle = "#a3e635"; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(cx, cy, dr, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
  }, [charge, distance]);

  const zone = ZONES.find((z) => P >= z.p);

  return (
    <StudioChrome title="Blast Standoff / Overpressure" tagline="cube-root scaling"
      controls={<div>
        <Slider label="Charge (kg TNT eq.)" value={charge} min={0.5} max={500} step={0.5} onChange={setCharge} />
        <Slider label="Distance (m)" value={distance} min={1} max={300} step={1} onChange={setDistance} />
        <div className="mt-3 space-y-1">{ZONES.map((z) => <div key={z.p} className="flex items-center gap-2 text-xs"><span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: z.color }} /><span className="text-slate-500">{z.p} kPa — {z.label}</span></div>)}</div>
        <p className="mt-3 text-xs text-slate-500">Peak incident overpressure follows Hopkinson-Cranz cube-root scaling: the scaled distance Z = R/W^(1/3) sets the blast pressure. Rings show injury and damage thresholds. Screening estimate for standoff planning only — consult EOD and published safe-distance tables on scene.</p>
      </div>}
      inspector={<div><Stat label="Overpressure" value={`${P.toFixed(1)} kPa`} /><Stat label="In psi" value={psi.toFixed(2)} /><Stat label="Window-safe standoff" value={`${safeDist.toFixed(0)} m`} /></div>}
    ><div>
        <canvas ref={canvasRef} width={340} height={340} className="mx-auto h-auto max-w-full rounded-lg" />
        <div className="mt-4 flex flex-col items-center"><div className="text-xs uppercase tracking-widest text-slate-500">At {distance} m from {charge} kg</div>
          <div className="mt-1 text-4xl font-black" style={{ color: zone?.color ?? "#22c55e" }}>{P.toFixed(1)} kPa</div>
          <div className="mt-1 text-sm text-slate-500">{zone ? zone.label : "Below window-breakage threshold"}</div></div>
      </div></StudioChrome>
  );
}
