"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { wn: number }> = {
  "Slow (ωₙ=1)": { wn: 1 },
  "Moderate (ωₙ=3)": { wn: 3 },
  "Fast (ωₙ=6)": { wn: 6 },
  "Snappy (ωₙ=8)": { wn: 8 },
};

export function SecondOrderResponseStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ wn }, update] = useShareableNumbers({ wn: 3 });
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

  const settle = 4 / (0.707 * wn); // ~2% settling time at ζ=0.707
  const explain = wn <= 1.5
    ? `Low ωₙ = ${wn}: the system is sluggish — every curve is stretched in time and the ζ=0.707 case takes about ${settle.toFixed(1)} s to settle. Shape and overshoot are unchanged; only the timescale grew.`
    : wn >= 6
    ? `High ωₙ = ${wn}: a fast system — the ζ=0.707 curve settles in roughly ${settle.toFixed(1)} s. Raising ωₙ compresses every response in time without altering overshoot, which is fixed by ζ alone.`
    : `ωₙ = ${wn}: response timescale is about 1/ωₙ ≈ ${(1 / wn).toFixed(2)} s, with the ζ=0.707 curve settling near ${settle.toFixed(1)} s. Overshoot depends only on ζ, not on ωₙ.`;

  const code = `import numpy as np
import matplotlib.pyplot as plt
wn = ${wn}
t = np.linspace(0, 10, 1000)
for zeta in [0.2, 0.707, 1.0, 2.0]:
    if zeta < 1:
        wd = wn*np.sqrt(1-zeta**2)
        y = 1 - np.exp(-zeta*wn*t)*(np.cos(wd*t) + zeta/np.sqrt(1-zeta**2)*np.sin(wd*t))
    elif abs(zeta-1) < 1e-6:
        y = 1 - np.exp(-wn*t)*(1 + wn*t)
    else:
        s1 = -wn*(zeta - np.sqrt(zeta**2-1)); s2 = -wn*(zeta + np.sqrt(zeta**2-1))
        y = 1 - (s1*np.exp(s2*t) - s2*np.exp(s1*t))/(s1-s2)
    plt.plot(t, y, label=f"zeta={zeta}")
plt.legend(); plt.xlabel("time"); plt.ylabel("response"); plt.show()`;

  return (
    <StudioChrome title="Damping Regimes Compared" tagline="under, critical & overdamped"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Natural frequency ωₙ" value={wn} min={0.5} max={8} step={0.5} onChange={(v) => update({ wn: v })} />
        <p className="mt-3 text-xs text-slate-500">Four responses, same natural frequency, different damping. Underdamped overshoots and rings; critically damped (ζ=1) is the fastest with no overshoot; overdamped crawls to target. Most designs aim near ζ=0.7 for a good speed–overshoot balance. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="ζ = 0.2 overshoot" value={`${(Math.exp(-Math.PI * 0.2 / Math.sqrt(1 - 0.04)) * 100).toFixed(0)}%`} />
        <Stat label="ζ = 0.707 overshoot" value="4%" />
        <Stat label="Critical damping" value="ζ = 1 (fastest, no overshoot)" />
        <Equation tex={`\\ddot x + 2\\zeta\\omega_n\\dot x + \\omega_n^2 x = \\omega_n^2 u,\\quad \\omega_n = ${wn.toFixed(1)},\\ M_p = e^{-\\zeta\\pi/\\sqrt{1-\\zeta^2}}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
