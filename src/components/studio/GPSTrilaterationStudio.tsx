"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { noise: number }> = {
  "Perfect ranges": { noise: 0 },
  "Consumer GPS": { noise: 6 },
  "Urban canyon": { noise: 20 },
  "Degraded signal": { noise: 40 },
};

export function GPSTrilaterationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ noise }, update] = useShareableNumbers({ noise: 0 });
  const [seed, setSeed] = useState(1);
  const [err, setErr] = useState(0);

  const sats = [[100, 90], [420, 120], [250, 320]]; const trueP = [270, 200];

  useEffect(() => {
    let s = seed * 7331 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 - 0.5; };
    const dists = sats.map(([x, y]) => Math.hypot(x - trueP[0], y - trueP[1]) + rnd() * noise);
    // least-squares trilateration (linearized)
    const [x1, y1] = sats[0]; const A: number[][] = [], b: number[] = [];
    for (let i = 1; i < 3; i++) { const [xi, yi] = sats[i]; A.push([2 * (xi - x1), 2 * (yi - y1)]); b.push(dists[0] ** 2 - dists[i] ** 2 - x1 * x1 - y1 * y1 + xi * xi + yi * yi); }
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0]; const px = (b[0] * A[1][1] - b[1] * A[0][1]) / det; const py = (A[0][0] * b[1] - A[1][0] * b[0]) / det;
    setErr(Math.hypot(px - trueP[0], py - trueP[1]));
    const ctx = hidpi(canvasRef.current!, 540, 380); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 380);
    sats.forEach(([x, y], i) => { ctx.strokeStyle = "rgba(34,211,238,0.4)"; ctx.beginPath(); ctx.arc(x, y, dists[i], 0, 7); ctx.stroke(); ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText(`sat ${i + 1}`, x + 8, y); });
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(trueP[0], trueP[1], 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#bef264"; ctx.fillText("true position", trueP[0] + 8, trueP[1]); ctx.fillStyle = "#f9a8d4"; ctx.fillText("computed fix", px + 8, py + 4);
  }, [noise, seed]);

  const explain = noise === 0
    ? "With zero ranging noise the three distance circles meet at exactly one point, so the computed fix lands on the true position."
    : `Each meter of timing noise smears where the circles cross, giving a ~${err.toFixed(0)} m fix error — this is why real receivers fuse many satellites with least-squares to average the error down.`;

  const code = `import numpy as np
sats = np.array([[100, 90], [420, 120], [250, 320]])
d = np.array([...])  # measured ranges (m), ranging noise = ${noise}
A = 2 * (sats[1:] - sats[0])
b = d[0]**2 - d[1:]**2 - (sats[0]**2).sum() + (sats[1:]**2).sum(1)
px, py = np.linalg.lstsq(A, b, rcond=None)[0]
print("fix", px, py)`;

  return (
    <StudioChrome title="GPS Trilateration" tagline="position from distances"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Ranging noise (m)" value={noise} min={0} max={40} step={2} onChange={(v) => update({ noise: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">Resample noise</button>
        <p className="mt-3 text-xs text-slate-500">A GPS receiver knows its distance to several satellites from signal travel time. Each distance places it on a circle (a sphere in 3D); where three circles intersect is the fix. With perfect ranges they meet at one point, but timing noise blurs the intersection into a small region — which is why GPS uses many satellites and least-squares to pin down position.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Satellites" value="3" /><Stat label="Ranging noise" value={`${noise} m`} /><Stat label="Position error" value={`${err.toFixed(1)} m`} /><Equation tex={`(x-x_i)^2 + (y-y_i)^2 = r_i^2,\\quad \\sigma_r = ${noise}\\ \\text{m}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
