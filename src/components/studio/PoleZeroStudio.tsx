"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function PoleZeroStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [poleR, setPoleR] = useState(0.85), [poleAng, setPoleAng] = useState(45), [zeroAng, setZeroAng] = useState(120);
  const pa = poleAng * Math.PI / 180, za = zeroAng * Math.PI / 180;
  // H(z) with conjugate pole pair at poleR e^±ja and zeros on unit circle at ±za
  const resp = (w: number) => { const ejw = [Math.cos(w), Math.sin(w)]; const distTo = (r: number, a: number) => Math.hypot(ejw[0] - r * Math.cos(a), ejw[1] - r * Math.sin(a)) * Math.hypot(ejw[0] - r * Math.cos(-a), ejw[1] - r * Math.sin(-a)); return distTo(1, za) / (distTo(poleR, pa) + 1e-6); };

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // z-plane (left)
    const cx = 130, cy = H / 2, R = 90; ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(cx - R - 20, cy); ctx.lineTo(cx + R + 20, cy); ctx.moveTo(cx, cy - R - 20); ctx.lineTo(cx, cy + R + 20); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; [pa, -pa].forEach(a => { const x = cx + poleR * R * Math.cos(a), y = cy - poleR * R * Math.sin(a); ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke(); });
    ctx.strokeStyle = "#a3e635"; [za, -za].forEach(a => { const x = cx + R * Math.cos(a), y = cy - R * Math.sin(a); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText("z-plane · × pole ○ zero", 60, 30);
    // frequency response (right)
    const ox = 280, oy = H - 40, pw = 210, ph = H - 80; ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    let mx = 0; for (let i = 0; i <= pw; i++) mx = Math.max(mx, resp(Math.PI * i / pw));
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const m = resp(Math.PI * i / pw) / mx; const y = oy - m * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.fillText("|H(e^jω)| — poles peak, zeros notch", ox, 30);
  }, [poleR, poleAng, zeroAng]);

  return (
    <StudioChrome title="Pole–Zero & Frequency Response" tagline="poles peak, zeros notch"
      controls={<div>
        <Slider label="Pole radius" value={poleR} min={0.2} max={0.98} step={0.02} onChange={setPoleR} />
        <Slider label="Pole angle (°)" value={poleAng} min={5} max={175} step={5} onChange={setPoleAng} />
        <Slider label="Zero angle (°)" value={zeroAng} min={5} max={175} step={5} onChange={setZeroAng} />
        <p className="mt-3 text-xs text-slate-500">A digital filter is defined by its poles and zeros in the z-plane. A pole near the unit circle creates a resonant peak at its angle; a zero on the circle carves a notch. Move them and watch the frequency response reshape. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Pole radius" value={poleR.toFixed(2)} />
        <Stat label="Resonance at" value={`${poleAng}° (ω)`} />
        <Stat label="Stability" value={poleR < 1 ? "stable ✓" : "unstable ⚠"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
