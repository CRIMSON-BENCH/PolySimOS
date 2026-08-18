"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const N = 120, CELL = 4;

const PRESETS: Record<string, { windSpeed: number; windDir: number; slope: number; fuel: number }> = {
  "Calm & flat": { windSpeed: 2, windDir: 90, slope: 0, fuel: 0.7 },
  "Wind-driven blowup": { windSpeed: 38, windDir: 90, slope: 5, fuel: 0.9 },
  "Steep canyon run": { windSpeed: 10, windDir: 90, slope: 45, fuel: 0.85 },
  "Sparse fuel": { windSpeed: 15, windDir: 90, slope: 10, fuel: 0.45 },
};

export function FireSpreadStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ windSpeed, windDir, slope, fuel }, update] = useShareableNumbers({ windSpeed: 15, windDir: 90, slope: 10, fuel: 0.75 });
  const [seed, setSeed] = useState(1);
  const [burned, setBurned] = useState(0);
  const grid = useRef<Uint8Array>(new Uint8Array(N * N)); // 0 fuel,1 burning,2 burned,3 no-fuel
  const windSpeedRef = useRef(windSpeed); windSpeedRef.current = windSpeed;
  const windDirRef = useRef(windDir); windDirRef.current = windDir;
  const slopeRef = useRef(slope); slopeRef.current = slope;
  const rngS = useRef(77);

  const reset = () => { let s = seed * 40961 >>> 0; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const g = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) g[i] = r() < fuel ? 0 : 3;
    const c = ((N / 2) | 0) * N + ((N / 2) | 0); g[c] = 1; g[c + 1] = 1; g[c + N] = 1; grid.current = g; setBurned(0); };
  useEffect(reset, [seed, fuel]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const windSpeed = windSpeedRef.current, slope = slopeRef.current;
    const rnd = () => { rngS.current = (rngS.current * 1664525 + 1013904223) >>> 0; return rngS.current / 4294967296; };
    const wr = (windDirRef.current * Math.PI) / 180; const wx = Math.cos(wr), wy = Math.sin(wr);
    for (let step = 0; step < steps; step++) {
      const g = grid.current; const next = g.slice();
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x;
        if (g[i] === 1) { next[i] = 2;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue; const ni = ny * N + nx; if (g[ni] !== 0) continue;
            const align = (dx * wx + dy * wy) / (Math.hypot(dx, dy) || 1); // -1..1
            const windBoost = 1 + (windSpeed / 25) * align; const slopeBoost = 1 + (slope / 45) * Math.max(0, -dy) * 0.6;
            const p = 0.28 * windBoost * slopeBoost; if (rnd() < p) next[ni] = 1; } }
      }
      grid.current = next;
    }
    const g = grid.current; let bc = 0; for (let i = 0; i < N * N; i++) if (g[i] === 2) bc++;
    setBurned(bc);
    const ctx = hidpi(canvas, N * CELL, N * CELL); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, N * CELL, N * CELL);
    for (let i = 0; i < N * N; i++) { const v = g[i]; let col = ""; if (v === 0) col = "#166534"; else if (v === 1) col = "#f97316"; else if (v === 2) col = "#3f3f46"; else col = "#1e293b"; ctx.fillStyle = col; ctx.fillRect((i % N) * CELL, ((i / N) | 0) * CELL, CELL, CELL); }
    // wind arrow
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30, 30); ctx.lineTo(30 + wx * 22, 30 + wy * 22); ctx.stroke();
  };

  const t = useTransport(frame);

  const explain =
    windSpeed >= 25
      ? `Strong ${windDir}° wind dominates: the fire front elongates sharply downwind and rate-of-spread climbs fast.`
      : slope >= 30
      ? "Steep slope: flames lean into and preheat the fuel above them, so the fire races uphill far faster than across flat ground."
      : fuel < 0.55
      ? "Sparse fuel: gaps between burnable cells starve the front, and the fire can self-extinguish before spreading far."
      : "Moderate wind and slope: the fire spreads roughly outward, with a gentle bias downwind and uphill.";

  const code = `import numpy as np
wind_speed, wind_dir, slope, fuel = ${windSpeed}, ${windDir}, ${slope}, ${fuel}
N = 120
rng = np.random.default_rng(1)
g = np.where(rng.random((N, N)) < fuel, 0, 3)  # 0=fuel, 3=no-fuel
g[N // 2, N // 2] = 1                           # ignition (1=burning, 2=burned)
wx, wy = np.cos(np.radians(wind_dir)), np.sin(np.radians(wind_dir))
for _ in range(200):
    for y, x in np.argwhere(g == 1):
        g[y, x] = 2
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = y + dy, x + dx
                if 0 <= ny < N and 0 <= nx < N and g[ny, nx] == 0:
                    align = (dx * wx + dy * wy) / (np.hypot(dx, dy) or 1)
                    p = 0.28 * (1 + wind_speed / 25 * align) * (1 + slope / 45 * max(0, -dy) * 0.6)
                    if rng.random() < p:
                        g[ny, nx] = 1
print("cells burned", int((g == 2).sum()))`;

  return (
    <StudioChrome title="Wildfire / Fire Spread" tagline="wind + slope driven spread"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { setSeed((n) => n + 1); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Wind speed" value={windSpeed} min={0} max={40} step={1} onChange={(v) => update({ windSpeed: v })} />
        <Slider label="Wind direction" value={windDir} min={0} max={360} step={15} onChange={(v) => update({ windDir: v })} />
        <Slider label="Slope" value={slope} min={0} max={45} step={1} onChange={(v) => update({ slope: v })} />
        <Slider label="Fuel density" value={fuel} min={0.4} max={1} step={0.05} onChange={(v) => update({ fuel: v })} />
        <p className="mt-3 text-xs text-slate-500">Fire spreads cell to cell, biased downwind and uphill — the two dominant drivers of real wildfire rate-of-spread. Rotate the wind and raise the slope to see how a fire front elongates and races upslope. For training and situational awareness only.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Cells burned" value={burned.toLocaleString()} /><Stat label="Wind" value={`${windSpeed} @ ${windDir}°`} /><Stat label="Slope" value={`${slope}°`} /><Equation tex={`R = R_0\\left(1 + \\phi_w + \\phi_s\\right),\\quad \\phi_w = ${(windSpeed / 25).toFixed(2)},\\ \\phi_s = ${(slope / 45).toFixed(2)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={N * CELL} height={N * CELL} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
