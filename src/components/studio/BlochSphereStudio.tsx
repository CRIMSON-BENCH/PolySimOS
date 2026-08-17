"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Qubit on the Bloch sphere.
export function BlochSphereStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theta, setTheta] = useState(60); // polar
  const [phi, setPhi] = useState(45); // azimuth

  const th = theta * Math.PI / 180, ph = phi * Math.PI / 180;
  const a = Math.cos(th / 2); const bRe = Math.sin(th / 2) * Math.cos(ph), bIm = Math.sin(th / 2) * Math.sin(ph);
  const p0 = a * a, p1 = 1 - p0;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 400, H = 400; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = 130; const yaw = -0.5;
    const proj = (x: number, y: number, z: number) => { const xr = x * Math.cos(yaw) - z * Math.sin(yaw); const zr = x * Math.sin(yaw) + z * Math.cos(yaw); return [cx + xr * R, cy - y * R + zr * 20]; };
    // sphere outline + equator
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    ctx.beginPath(); for (let i = 0; i <= 60; i++) { const t = i / 60 * 2 * Math.PI; const [px, py] = proj(Math.cos(t), 0, Math.sin(t)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    // axes
    ctx.strokeStyle = "#334155"; const drawAx = (x: number, y: number, z: number, lbl: string) => { const [px, py] = proj(x, y, z); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke(); ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif"; ctx.fillText(lbl, px + 4, py); };
    drawAx(0, 1, 0, "|0⟩"); drawAx(0, -1, 0, "|1⟩"); drawAx(1, 0, 0, "x"); drawAx(0, 0, 1, "y");
    // state vector
    const sx = Math.sin(th) * Math.cos(ph), sy = Math.cos(th), sz = Math.sin(th) * Math.sin(ph);
    const [px, py] = proj(sx, sy, sz); ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.fill();
  }, [theta, phi]);

  return (
    <StudioChrome title="Bloch Sphere" tagline="the state of a qubit"
      controls={<div>
        <Slider label="Polar angle θ (°)" value={theta} min={0} max={180} step={1} onChange={setTheta} />
        <Slider label="Azimuth φ (°)" value={phi} min={0} max={360} step={1} onChange={setPhi} />
        <div className="mt-3 flex flex-wrap gap-1">{[["|0⟩", 0, 0], ["|1⟩", 180, 0], ["|+⟩", 90, 0], ["|i⟩", 90, 90]].map(([n, t, p]) => <button key={n as string} onClick={() => { setTheta(t as number); setPhi(p as number); }} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">{n}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">Every pure state of a single qubit is a point on the Bloch sphere. The north pole is |0⟩, the south |1⟩, and the equator holds equal superpositions differing only in phase φ. Quantum gates rotate this arrow — the geometric picture behind all single-qubit quantum computing.</p>
      </div>}
      inspector={<div><Stat label="P(|0⟩)" value={p0.toFixed(3)} /><Stat label="P(|1⟩)" value={p1.toFixed(3)} /><Stat label="Amplitude α" value={a.toFixed(3)} /><Stat label="Amplitude β" value={`${Math.hypot(bRe, bIm).toFixed(2)}∠${phi}°`} /></div>}
    ><canvas ref={canvasRef} width={400} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
