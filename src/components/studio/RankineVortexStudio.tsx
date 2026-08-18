"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { coreR: number; maxWind: number }> = {
  "EF1 spin-up": { coreR: 40, maxWind: 40 },
  "EF2 wedge": { coreR: 120, maxWind: 55 },
  "EF4 core": { coreR: 50, maxWind: 85 },
  "EF5 violent": { coreR: 60, maxWind: 110 },
};

// Rankine vortex: tornado wind profile (solid-body core + 1/r outside).
export function RankineVortexStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ coreR, maxWind }, update] = useShareableNumbers({ coreR: 50, maxWind: 70 });
  const [running, setRunning] = useState(true);
  const rot = useRef(0);

  const windAt = (r: number) => r <= coreR ? maxWind * (r / coreR) : maxWind * (coreR / r);
  const ef = maxWind * 2.237; // mph
  const efScale = ef < 86 ? "EF0" : ef < 111 ? "EF1" : ef < 136 ? "EF2" : ef < 166 ? "EF3" : ef < 201 ? "EF4" : "EF5";

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      rot.current += 0.05; const W = 520, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      // wind profile plot (left)
      const ox = 40, oy = H - 30, pw = 200, ph = H - 60; const rMax = coreR * 4;
      ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let r = 0; r <= rMax; r += rMax / 100) { const x = ox + (r / rMax) * pw; const y = oy - (windAt(r) / (maxWind * 1.1)) * ph; r === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox + (coreR / rMax) * pw, oy); ctx.lineTo(ox + (coreR / rMax) * pw, oy - ph); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText("wind vs radius", ox + 4, oy - ph + 12); ctx.fillText("core", ox + (coreR / rMax) * pw - 10, oy + 14);
      // vortex (right)
      const cx = 380, cy = H / 2; for (let ring = 1; ring <= 6; ring++) { const r = ring * 18; const w = windAt(r * 2); ctx.strokeStyle = `rgba(148,163,184,${0.6 * w / maxWind})`; ctx.lineWidth = 2; ctx.beginPath(); for (let a = 0; a < 6.3; a += 0.2) { const speed = windAt(r * 2) / maxWind; const aa = a + rot.current * speed * 2; const x = cx + Math.cos(aa) * r, y = cy + Math.sin(aa) * r * 0.9; a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [coreR, maxWind, running]);

  const explain =
    coreR <= 40
      ? `A tight ${coreR} m core packs the peak ${maxWind} m/s winds (${efScale}) into a narrow, intense ring — damage is concentrated but severe.`
      : coreR >= 110
      ? `A wide ${coreR} m core spreads ${efScale} winds across a broad wedge, so the damage path is very wide.`
      : `The peak ${maxWind} m/s wind (${efScale}) rides the edge of the ${coreR} m core; the calm eye at the center is deceptive.`;

  const code = `import numpy as np
core_r, max_wind = ${coreR}, ${maxWind}  # m, m/s
def wind(r):
    return max_wind*(r/core_r) if r <= core_r else max_wind*(core_r/r)
r = np.linspace(0, core_r*4, 200)
v = np.array([wind(ri) for ri in r])
print("peak", v.max(), "m/s at r =", core_r, "m")`;

  return (
    <StudioChrome title="Tornado Vortex (Rankine)" tagline="wind speed vs radius"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Core radius (m)" value={coreR} min={10} max={150} step={5} onChange={(v) => update({ coreR: v })} />
        <Slider label="Max wind (m/s)" value={maxWind} min={20} max={140} step={5} onChange={(v) => update({ maxWind: v })} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">A tornado&apos;s winds follow the Rankine vortex model: inside the core the air spins like a solid disk, with speed rising straight out to a peak at the core edge; outside, the wind falls off as 1/r. The fastest, most destructive winds ring the core, not the very center — which is why the eye of a vortex is deceptively calm.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Peak wind" value={`${maxWind} m/s`} /><Stat label="Peak (mph)" value={`${ef.toFixed(0)} mph`} /><Stat label="EF rating" value={efScale} /><Stat label="Peak at" value={`r = ${coreR} m`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
