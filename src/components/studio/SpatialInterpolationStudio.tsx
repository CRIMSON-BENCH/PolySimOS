"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Inverse-distance-weighted spatial interpolation.
export function SpatialInterpolationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [power, setPower] = useState(2);
  const [seed, setSeed] = useState(1);

  useEffect(() => {
    const W = 440, H = 340; let s = seed * 6151 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const pts = Array.from({ length: 8 }, () => ({ x: rnd() * W, y: rnd() * H, v: rnd() }));
    const ctx = canvasRef.current!.getContext("2d")!; const img = ctx.createImageData(W, H);
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { let num = 0, den = 0; for (const p of pts) { const d = Math.hypot(x - p.x, y - p.y); if (d < 1) { num = p.v; den = 1; break; } const w = 1 / Math.pow(d, power); num += w * p.v; den += w; } const v = num / den;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const idx = ((y + dy) * W + (x + dx)) * 4; img.data[idx] = 20 + v * 60; img.data[idx + 1] = 40 + v * 190; img.data[idx + 2] = 60 + (1 - v) * 180; img.data[idx + 3] = 255; } }
    ctx.putImageData(img, 0, 0);
    pts.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 7); ctx.fillStyle = "#fff"; ctx.fill(); ctx.fillStyle = "#0b1220"; ctx.font = "9px sans-serif"; ctx.fillText(p.v.toFixed(1), p.x - 6, p.y + 3); });
    ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText("IDW interpolated field from samples", 8, H - 10);
  }, [power, seed]);

  return (
    <StudioChrome title="Spatial Interpolation (IDW)" tagline="filling the gaps between measurements"
      controls={<div>
        <Slider label="Power parameter" value={power} min={0.5} max={5} step={0.5} onChange={setPower} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New samples</button>
        <p className="mt-3 text-xs text-slate-500">Given scattered measurements — rainfall gauges, soil samples, air-quality sensors — inverse-distance weighting estimates values everywhere in between. Each sample&apos;s influence falls off with distance raised to a power: a low power gives smooth, blended surfaces; a high power makes each sample dominate its neighborhood in sharp bull&apos;s-eyes. The workhorse of GIS mapping.</p>
      </div>}
      inspector={<div><Stat label="Samples" value="8" /><Stat label="Power p" value={power.toFixed(1)} /><Stat label="Character" value={power < 1.5 ? "smooth" : power > 3 ? "bull's-eyes" : "balanced"} /></div>}
    ><canvas ref={canvasRef} width={440} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
