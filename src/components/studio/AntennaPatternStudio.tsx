"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { len: number }> = {
  "Short (0.1λ)": { len: 0.1 },
  "Half-wave (0.5λ)": { len: 0.5 },
  "Full-wave (1.0λ)": { len: 1.0 },
  "Long-wire (1.5λ)": { len: 1.5 },
};

export function AntennaPatternStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ len }, update] = useShareableNumbers({ len: 0.5 }); // length in wavelengths
  const pat = (th: number) => { const s = Math.sin(th); if (Math.abs(s) < 1e-3) return 0; const num = Math.cos(Math.PI * len * Math.cos(th)) - Math.cos(Math.PI * len); return Math.abs(num / s); };
  let peak = 0; for (let i = 0; i <= 360; i++) peak = Math.max(peak, pat(i / 180 * Math.PI));
  const directivity = peak > 0 ? 10 * Math.log10(2 * peak * peak / 1) : 0; // rough dBi indicator

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = 130;
    ctx.strokeStyle = "#1e293b"; for (let r = R / 3; r <= R; r += R / 3) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = "#475569"; ctx.beginPath(); ctx.moveTo(cx, cy - R - 10); ctx.lineTo(cx, cy + R + 10); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 360; i++) { const th = i / 180 * Math.PI; const g = pat(th) / (peak || 1); const rr = g * R; const x = cx + rr * Math.sin(th), y = cy - rr * Math.cos(th); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke();
    ctx.fillStyle = "rgba(34,211,238,0.12)"; ctx.fill();
    // antenna element
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 3; const el = Math.min(R, len * 120); ctx.beginPath(); ctx.moveTo(cx, cy - el); ctx.lineTo(cx, cy + el); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`dipole ${len.toFixed(2)}λ — radiation pattern (E-plane)`, 12, 22);
  }, [len, peak]);

  const explain =
    len < 0.4
      ? "A short dipole radiates one broad broadside lobe — nearly omnidirectional in this plane, with the lowest directivity of any length."
      : len <= 0.6
      ? "The half-wave dipole is the sweet spot: a single clean broadside lobe with the classic ~2.15 dBi gain and no side lobes to waste power."
      : len < 1.05
      ? "Approaching a full wavelength the main lobe narrows and gain climbs — you are trading a wide beam for more directivity, still before side lobes take over."
      : "Past one wavelength the current reverses along the element, so side lobes appear and the pattern splits — the beam is no longer a single clean broadside lobe.";

  const code = `import numpy as np
L = ${len}  # dipole length in wavelengths
def pat(th):
    s = np.sin(th)
    if abs(s) < 1e-3: return 0.0
    return abs((np.cos(np.pi*L*np.cos(th)) - np.cos(np.pi*L)) / s)
g = np.array([pat(t) for t in np.linspace(0, 2*np.pi, 361)])
peak = g.max()
print("directivity (dBi)", 10*np.log10(2*peak**2))`;

  return (
    <StudioChrome title="Antenna Radiation Pattern" tagline="dipole directivity"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Dipole length (wavelengths)" value={len} min={0.1} max={2} step={0.05} onChange={(v) => update({ len: v })} />
        <p className="mt-3 text-xs text-slate-500">A dipole radiates most strongly broadside and nulls off its ends. As it grows past one wavelength the main lobe narrows and side lobes appear — trading a wider beam for more directivity. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Length" value={`${len.toFixed(2)} λ`} />
        <Stat label="Relative directivity" value={`${directivity.toFixed(1)} dB`} />
        <Stat label="Pattern" value={len < 0.75 ? "single broadside lobe" : "multi-lobe"} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
