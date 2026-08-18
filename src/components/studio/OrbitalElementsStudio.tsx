"use client";

import { useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { sma: number; ecc: number; argp: number }> = {
  "LEO (circular)": { sma: 7000, ecc: 0, argp: 0 },
  "GEO": { sma: 42000, ecc: 0, argp: 0 },
  "Molniya (elliptic)": { sma: 26000, ecc: 0.74, argp: 270 },
  "GTO transfer": { sma: 24000, ecc: 0.72, argp: 180 },
};

// Visualize an orbit from semi-major axis and eccentricity.
export function OrbitalElementsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ sma, ecc, argp }, update] = useShareableNumbers({ sma: 10000, ecc: 0.4, argp: 30 });
  const smaRef = useRef(sma); smaRef.current = sma;
  const eccRef = useRef(ecc); eccRef.current = ecc;
  const argpRef = useRef(argp); argpRef.current = argp;
  const theta = useRef(0);

  const Re = 6371; const mu = 398600;
  const period = 2 * Math.PI * Math.sqrt(sma ** 3 / mu); // s
  const apo = sma * (1 + ecc) - Re; const peri = sma * (1 - ecc) - Re;

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sma = smaRef.current, ecc = eccRef.current, argp = argpRef.current;
    theta.current += 0.02 * steps; const W = 420, H = 380; const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2; const scale = 150 / (sma * (1 + ecc));
    // Earth
    ctx.fillStyle = "#1e40af"; ctx.beginPath(); ctx.arc(cx, cy, Re * scale, 0, 7); ctx.fill();
    // orbit ellipse: focus at Earth
    const a = sma * scale, b = a * Math.sqrt(1 - ecc * ecc), cshift = a * ecc; const w = argp * Math.PI / 180;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let e = 0; e <= 6.29; e += 0.05) { const x = a * Math.cos(e) - cshift, y = b * Math.sin(e); const rx = x * Math.cos(w) - y * Math.sin(w), ry = x * Math.sin(w) + y * Math.cos(w); e === 0 ? ctx.moveTo(cx + rx, cy + ry) : ctx.lineTo(cx + rx, cy + ry); } ctx.closePath(); ctx.stroke();
    // satellite position — advance MEAN anomaly uniformly in time (Kepler's 2nd law),
    // then solve Kepler's equation M = E − e·sinE for the eccentric anomaly E via Newton.
    const M = theta.current;
    let e = M + ecc * Math.sin(M); // good initial guess
    for (let k = 0; k < 8; k++) e = e - (e - ecc * Math.sin(e) - M) / (1 - ecc * Math.cos(e));
    const x = a * Math.cos(e) - cshift, y = b * Math.sin(e); const rx = x * Math.cos(w) - y * Math.sin(w), ry = x * Math.sin(w) + y * Math.cos(w);
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(cx + rx, cy + ry, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("orbit (focus = Earth center)", 12, 20);
  };

  const t = useTransport(frame);

  const explain =
    ecc < 0.05
      ? `Near-circular orbit: apogee and perigee are almost equal, so the satellite holds a steady altitude and speed all the way around.`
      : ecc > 0.6
      ? `Highly elliptical: the satellite crawls near its ${apo.toFixed(0)} km apogee and whips through its ${peri.toFixed(0)} km perigee — long dwell time high up, which is why Molniya orbits look like this.`
      : `Moderate eccentricity stretches the ellipse; the ${(period / 60).toFixed(0)} min period is fixed by the semi-major axis alone, independent of how elongated the shape is.`;

  const code = `import numpy as np
mu, Re = 398600.0, 6371.0   # km^3/s^2, km
sma, ecc, argp = ${sma}, ${ecc}, ${argp}
period = 2 * np.pi * np.sqrt(sma**3 / mu)          # s
apogee = sma * (1 + ecc) - Re                       # km altitude
perigee = sma * (1 - ecc) - Re
print("period (min)", period / 60, "apogee", apogee, "perigee", perigee)`;

  return (
    <StudioChrome title="Orbital Elements" tagline="the shape of an orbit"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Semi-major axis (km)" value={sma} min={7000} max={42000} step={500} onChange={(v) => update({ sma: v })} />
        <Slider label="Eccentricity" value={ecc} min={0} max={0.85} step={0.02} onChange={(v) => update({ ecc: v })} />
        <Slider label="Arg. of periapsis (°)" value={argp} min={0} max={360} step={10} onChange={(v) => update({ argp: v })} />
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mt-3 text-xs text-slate-500">An orbit&apos;s size and shape come from two numbers: the semi-major axis sets the period (and average altitude), and the eccentricity sets how elongated the ellipse is. Earth sits at one focus, so the satellite races through its low perigee and crawls at its high apogee — Kepler&apos;s second law in motion. The argument of periapsis rotates the ellipse.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Period" value={`${(period / 60).toFixed(0)} min`} /><Stat label="Apogee alt." value={`${apo.toFixed(0)} km`} /><Stat label="Perigee alt." value={`${peri.toFixed(0)} km`} /><Stat label="Eccentricity" value={ecc.toFixed(2)} /><Equation tex={`r = \\frac{a(1-e^2)}{1+e\\cos\\nu} = \\frac{${sma.toFixed(0)}\\,(1-${ecc.toFixed(2)}^2)}{1+${ecc.toFixed(2)}\\cos\\nu}\\ \\text{km}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={420} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
