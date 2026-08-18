"use client";

import { useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { ratio: number; impact: number }> = {
  "Hot Jupiter": { ratio: 0.15, impact: 0.1 },
  "Earth analog": { ratio: 0.02, impact: 0.2 },
  "Grazing transit": { ratio: 0.1, impact: 0.95 },
  "Super-Earth": { ratio: 0.04, impact: 0.3 },
};

export function ExoplanetTransitStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ ratio, impact }, update] = useShareableNumbers({ ratio: 0.1, impact: 0.2 });
  const ratioRef = useRef(ratio); ratioRef.current = ratio;
  const impactRef = useRef(impact); impactRef.current = impact;
  const phase = useRef(0);
  const curve = useRef<number[]>([]);

  const depth = ratio * ratio;

  const W = 520, H = 360;
  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const starX = W / 2, starY = 120, Rs = 70;
    const ratioV = ratioRef.current, impactV = impactRef.current, depthV = ratioV * ratioV;
    const Rp = ratioV * Rs;
    let px = 0, py = 0;
    for (let s = 0; s < steps; s++) {
      phase.current += 0.008; if (phase.current > 1) { phase.current = 0; curve.current = []; }
      const t = phase.current; px = (t * 2 - 1) * (W * 0.55) + starX; py = starY + impactV * Rs;
      // brightness: overlap of planet disk over star disk
      const d = Math.hypot(px - starX, py - starY);
      let flux = 1;
      if (d < Rs + Rp) { if (d <= Rs - Rp) flux = 1 - depthV; else { // partial overlap area
        const r1 = Rs, r2 = Rp; const a = (d * d + r1 * r1 - r2 * r2) / (2 * d); const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
        const A1 = r1 * r1 * Math.acos(Math.min(1, Math.max(-1, a / r1))); const A2 = r2 * r2 * Math.acos(Math.min(1, Math.max(-1, (d - a) / r2)));
        const area = A1 + A2 - d * h; flux = 1 - (area / (Math.PI * Rs * Rs)); } }
      curve.current.push(flux); if (curve.current.length > 260) curve.current.shift();
    }
    const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // star
    const g = ctx.createRadialGradient(starX, starY, 10, starX, starY, Rs); g.addColorStop(0, "#fff7ed"); g.addColorStop(0.7, "#fbbf24"); g.addColorStop(1, "#f59e0b");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(starX, starY, Rs, 0, 7); ctx.fill();
    // planet
    ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.arc(px, py, Rp, 0, 7); ctx.fill(); ctx.strokeStyle = "#334155"; ctx.stroke();
    // light curve
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(30, 250); ctx.lineTo(W - 10, 250); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    curve.current.forEach((f, i) => { const x = 30 + (i / 260) * (W - 40); const y = 250 + (1 - f) * 900; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("relative brightness vs time", 30, 275);
  };

  const tr = useTransport(frame);

  const code = `import numpy as np
ratio, impact = ${ratio}, ${impact}   # Rp/Rs, impact parameter b
depth = ratio**2                       # fractional dip when fully overlapped
t = np.linspace(-1.6, 1.6, 400)        # sky-projected separation (stellar radii)
d = np.hypot(t, impact)                # planet-star center distance
flux = np.where(d < 1 - ratio, 1 - depth, 1.0)  # simple box transit
print("transit depth:", depth)`;

  const explain =
    "The dip depth is almost exactly (Rp/Rs)², so measuring how much light is blocked directly gives the planet's size relative to its star. The width of the dip is the transit duration, which — combined with how often it repeats — follows from the planet's orbital period and speed across the disk.";

  return (
    <StudioChrome title="Exoplanet Transit" tagline="the transit method · light curves"
      controls={<div>
        <TransportBar playing={tr.playing} onToggle={tr.toggle} onStep={tr.step} speed={tr.speed} onSpeed={tr.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Planet/star radius (Rp/Rs)" value={ratio} min={0.02} max={0.3} step={0.01} onChange={(v) => update({ ratio: v })} />
        <Slider label="Impact parameter b" value={impact} min={0} max={1} step={0.05} onChange={(v) => update({ impact: v })} />
        <p className="mt-3 text-xs text-slate-500">As a planet crosses its star, it blocks a tiny fraction of the light — a dip of depth (Rp/Rs)². This is how Kepler and TESS have found thousands of exoplanets. Impact parameter sets how centrally the planet crosses, changing the transit shape and duration.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Transit depth" value={`${(depth * 100).toFixed(2)}%`} /><Stat label="Rp/Rs" value={ratio.toFixed(2)} /><Stat label="Impact b" value={impact.toFixed(2)} /><Equation tex={`\\dfrac{\\Delta F}{F} = \\left(\\dfrac{R_p}{R_\\star}\\right)^2 = (${ratio.toFixed(2)})^2 = ${(depth * 100).toFixed(2)}\\%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
