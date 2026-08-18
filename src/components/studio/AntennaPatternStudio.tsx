"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function AntennaPatternStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [len, setLen] = useState(0.5); // length in wavelengths
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

  return (
    <StudioChrome title="Antenna Radiation Pattern" tagline="dipole directivity"
      controls={<div>
        <Slider label="Dipole length (wavelengths)" value={len} min={0.1} max={2} step={0.05} onChange={setLen} />
        <p className="mt-3 text-xs text-slate-500">A dipole radiates most strongly broadside and nulls off its ends. As it grows past one wavelength the main lobe narrows and side lobes appear — trading a wider beam for more directivity. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Length" value={`${len.toFixed(2)} λ`} />
        <Stat label="Relative directivity" value={`${directivity.toFixed(1)} dB`} />
        <Stat label="Pattern" value={len < 0.75 ? "single broadside lobe" : "multi-lobe"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
