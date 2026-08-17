"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Rectangular barrier transmission coefficient.
export function QuantumTunnelingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [E, setE] = useState(3); // eV particle energy
  const [V, setV] = useState(5); // eV barrier height
  const [width, setWidth] = useState(0.5); // nm barrier width

  // T for E < V: T = 1/(1 + V^2 sinh^2(k2 a)/(4E(V-E)))
  const k2 = Math.sqrt(2 * 0.512 * Math.max(0.001, V - E)) * width * 10; // dimensionless-ish
  let T: number;
  if (E < V) { const sh = Math.sinh(k2); T = 1 / (1 + (V * V * sh * sh) / (4 * E * (V - E))); }
  else { const k = Math.sqrt(2 * 0.512 * (E - V)) * width * 10; const sn = Math.sin(k); T = 1 / (1 + (V * V * sn * sn) / (4 * E * (E - V) + 1e-9)); }

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 20, oy = H - 40, ow = W - 40; const bx = ox + ow * 0.42, bw = Math.max(10, width * 90);
    // barrier
    const vh = (V / 8) * (H - 80); ctx.fillStyle = "rgba(100,116,139,0.35)"; ctx.fillRect(bx, oy - vh, bw, vh); ctx.strokeStyle = "#64748b"; ctx.strokeRect(bx, oy - vh, bw, vh);
    // energy line
    const eh = (E / 8) * (H - 80); ctx.strokeStyle = "#a3e635"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, oy - eh); ctx.lineTo(ox + ow, oy - eh); ctx.stroke(); ctx.setLineDash([]);
    // incident wave
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= ow; i++) { const x = ox + i; let amp = 20; if (x > bx && x < bx + bw) amp = 20 * Math.exp(-(x - bx) / bw * (k2 || 1)); else if (x >= bx + bw) amp = 20 * Math.sqrt(T); const y = oy - eh - amp * Math.sin(i * 0.18); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("incident →", ox + 6, oy - eh - 34); ctx.fillText("transmitted", bx + bw + 10, oy - eh - 34); ctx.fillStyle = "#cbd5e1"; ctx.fillText("barrier", bx + 2, oy - vh - 6);
  }, [E, V, width, T, k2]);

  return (
    <StudioChrome title="Quantum Tunneling" tagline="through a barrier it cannot climb"
      controls={<div>
        <Slider label="Particle energy E (eV)" value={E} min={0.5} max={8} step={0.1} onChange={setE} />
        <Slider label="Barrier height V (eV)" value={V} min={1} max={8} step={0.1} onChange={setV} />
        <Slider label="Barrier width (nm)" value={width} min={0.1} max={1.5} step={0.05} onChange={setWidth} />
        <p className="mt-3 text-xs text-slate-500">Classically a particle with less energy than a barrier is trapped. Quantum mechanically its wavefunction decays inside the barrier but does not vanish, so there is a finite chance it appears on the other side — tunneling. The probability falls off exponentially with barrier width and height, the principle behind scanning tunneling microscopes and nuclear fusion.</p>
      </div>}
      inspector={<div><Stat label="Transmission T" value={T.toExponential(2)} /><Stat label="Reflection R" value={(1 - T).toFixed(3)} /><Stat label="Regime" value={E < V ? "tunneling" : "over-barrier"} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
