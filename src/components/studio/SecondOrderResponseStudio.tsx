"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function SecondOrderResponseStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [wn, setWn] = useState(3);
  const y = (zeta: number, t: number) => { if (zeta < 1) { const wd = wn * Math.sqrt(1 - zeta * zeta); return 1 - Math.exp(-zeta * wn * t) * (Math.cos(wd * t) + zeta / Math.sqrt(1 - zeta * zeta) * Math.sin(wd * t)); } if (Math.abs(zeta - 1) < 1e-6) return 1 - Math.exp(-wn * t) * (1 + wn * t); const s1 = -wn * (zeta - Math.sqrt(zeta * zeta - 1)), s2 = -wn * (zeta + Math.sqrt(zeta * zeta - 1)); return 1 - (s1 * Math.exp(s2 * t) - s2 * Math.exp(s1 * t)) / (s1 - s2); };
  const cases = [{ z: 0.2, n: "ζ=0.2 underdamped", c: "#f472b6" }, { z: 0.707, n: "ζ=0.707", c: "#22d3ee" }, { z: 1, n: "ζ=1 critical", c: "#a3e635" }, { z: 2, n: "ζ=2 overdamped", c: "#fbbf24" }];

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 55, ph = H - 55, tmax = 10;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); const sy = oy - (1 / 1.6) * ph; ctx.beginPath(); ctx.moveTo(ox, sy); ctx.lineTo(ox + pw, sy); ctx.stroke(); ctx.setLineDash([]);
    cases.forEach((cs, k) => { ctx.strokeStyle = cs.c; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = tmax * i / pw; const yy = oy - (y(cs.z, t) / 1.6) * ph; i ? ctx.lineTo(ox + i, yy) : ctx.moveTo(ox + i, yy); } ctx.stroke(); ctx.fillStyle = cs.c; ctx.font = "10px sans-serif"; ctx.fillText(cs.n, ox + pw - 120, 24 + k * 14); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("time →", ox + pw - 44, oy + 18);
  }, [wn]);

  return (
    <StudioChrome title="Damping Regimes Compared" tagline="under, critical & overdamped"
      controls={<div>
        <Slider label="Natural frequency ωₙ" value={wn} min={0.5} max={8} step={0.5} onChange={setWn} />
        <p className="mt-3 text-xs text-slate-500">Four responses, same natural frequency, different damping. Underdamped overshoots and rings; critically damped (ζ=1) is the fastest with no overshoot; overdamped crawls to target. Most designs aim near ζ=0.7 for a good speed–overshoot balance. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="ζ = 0.2 overshoot" value={`${(Math.exp(-Math.PI * 0.2 / Math.sqrt(1 - 0.04)) * 100).toFixed(0)}%`} />
        <Stat label="ζ = 0.707 overshoot" value="4%" />
        <Stat label="Critical damping" value="ζ = 1 (fastest, no overshoot)" />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
