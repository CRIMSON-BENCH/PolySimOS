"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { obsX: number; obsHeight: number }> = {
  "Ground scout": { obsX: 60, obsHeight: 2 },
  "Watchtower": { obsX: 270, obsHeight: 40 },
  "Ridge post": { obsX: 450, obsHeight: 20 },
  "Tall mast": { obsX: 150, obsHeight: 60 },
};

// Line-of-sight viewshed over a 1D terrain profile.
export function ViewshedStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ obsX, obsHeight }, update] = useShareableNumbers({ obsX: 60, obsHeight: 10 });
  const [seed, setSeed] = useState(1);
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const W = 540, H = 300; let s = seed * 40961 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const terrain: number[] = []; let h = 120; for (let x = 0; x < W; x++) { h += (rnd() - 0.5) * 8; h = Math.max(40, Math.min(240, h)); terrain.push(h); }
    // smooth
    for (let p = 0; p < 3; p++) for (let x = 1; x < W - 1; x++) terrain[x] = (terrain[x - 1] + terrain[x] + terrain[x + 1]) / 3;
    const ground = (x: number) => H - terrain[Math.max(0, Math.min(W - 1, Math.round(x)))];
    const ox = obsX, oy = ground(obsX) - obsHeight;
    const vis: boolean[] = new Array(W).fill(false); let count = 0;
    for (const dir of [1, -1]) { let maxSlope = -Infinity; for (let x = ox + dir; x >= 0 && x < W; x += dir) { const slope = (ground(x) - oy) / Math.abs(x - ox); if (slope >= maxSlope) { vis[x] = true; count++; maxSlope = slope; } } }
    setVisible(count);
    const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // terrain fill
    ctx.fillStyle = "#292524"; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x < W; x++) ctx.lineTo(x, ground(x)); ctx.lineTo(W, H); ctx.fill();
    // visible overlay
    for (let x = 0; x < W; x++) if (vis[x]) { ctx.strokeStyle = "rgba(163,230,53,0.7)"; ctx.beginPath(); ctx.moveTo(x, ground(x)); ctx.lineTo(x, ground(x) - 3); ctx.stroke(); }
    // observer
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, ground(ox)); ctx.lineTo(ox, oy); ctx.stroke(); ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(ox, oy, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("green = visible from observer", 10, 18);
  }, [obsX, obsHeight, seed]);

  const coverage = visible / 540 * 100;
  const explain =
    obsHeight >= 40
      ? `A ${obsHeight} m vantage clears most intervening ridges, so line of sight reaches far down the profile and coverage climbs toward ${coverage.toFixed(0)}%.`
      : obsHeight <= 5
      ? `Down near ground level the nearest ridges throw long shadows, hiding the far field and holding coverage around ${coverage.toFixed(0)}%.`
      : `At ${obsHeight} m the observer sees over closer bumps but taller ridges still cast blind spots — coverage lands near ${coverage.toFixed(0)}%.`;

  const code = `import numpy as np
obs_x, obs_h = ${obsX}, ${obsHeight}
ground = terrain_height  # H - profile at each x
oy = ground[obs_x] - obs_h
visible = 0
for direction in (1, -1):
    max_slope = -np.inf
    x = obs_x + direction
    while 0 <= x < len(ground):
        slope = (ground[x] - oy) / abs(x - obs_x)
        if slope >= max_slope:
            visible += 1; max_slope = slope
        x += direction
print("visible cells", visible)`;

  return (
    <StudioChrome title="Viewshed / Line of Sight" tagline="what can you see from here?"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Observer position" value={obsX} min={10} max={530} step={5} onChange={(v) => update({ obsX: v })} />
        <Slider label="Observer height (m)" value={obsHeight} min={0} max={60} step={2} onChange={(v) => update({ obsHeight: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New terrain</button>
        <p className="mt-3 text-xs text-slate-500">A viewshed marks every point visible from an observer, hidden behind intervening ridges. Scanning outward, a point is seen only if its angle above the horizontal exceeds every closer obstacle — so terrain shadows fall behind hills. Raising the observer reveals far more. It is essential for siting cell towers, wind turbines, scenic overlooks, and military positions.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Visible cells" value={String(visible)} /><Stat label="Coverage" value={`${coverage.toFixed(0)}%`} /><Stat label="Observer height" value={`${obsHeight} m`} /><Equation tex={`d_{\\text{horizon}} = \\sqrt{2 R h} = \\sqrt{2 \\cdot 6371\\,\\text{km} \\cdot ${obsHeight}\\,\\text{m}} \\approx ${(Math.sqrt(2 * 6371000 * obsHeight) / 1000).toFixed(1)}\\ \\text{km}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
