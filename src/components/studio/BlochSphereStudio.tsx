"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { theta: number; phi: number }> = {
  "|0⟩ north pole": { theta: 0, phi: 0 },
  "|1⟩ south pole": { theta: 180, phi: 0 },
  "|+⟩ equator": { theta: 90, phi: 0 },
  "|i⟩ +y axis": { theta: 90, phi: 90 },
};

// Qubit on the Bloch sphere.
export function BlochSphereStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ theta, phi }, update] = useShareableNumbers({ theta: 60, phi: 45 });

  const th = theta * Math.PI / 180, ph = phi * Math.PI / 180;
  const a = Math.cos(th / 2); const bRe = Math.sin(th / 2) * Math.cos(ph), bIm = Math.sin(th / 2) * Math.sin(ph);
  const p0 = a * a, p1 = 1 - p0;

  useEffect(() => {
    const W = 400, H = 400; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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

  const explain =
    theta < 10
      ? "Almost exactly |0⟩ at the north pole — a classical bit with ~100% chance of measuring 0; the phase φ has no effect here."
      : theta > 170
      ? "Almost exactly |1⟩ at the south pole — a classical bit with ~100% chance of measuring 1; the phase φ is irrelevant at the poles."
      : Math.abs(theta - 90) < 8
      ? "On the equator: a balanced 50/50 superposition where only the phase φ distinguishes states like |+⟩, |−⟩, and |i⟩ — invisible until you rotate the measurement basis."
      : `Polar angle θ sets the measurement odds: P(|0⟩)=cos²(θ/2)=${p0.toFixed(2)}, so tilting toward a pole biases the qubit while φ only twists its phase.`;

  const code = `import numpy as np
theta, phi = np.radians(${theta}), np.radians(${phi})
alpha = np.cos(theta / 2)
beta = np.sin(theta / 2) * np.exp(1j * phi)
print("P(0)", abs(alpha) ** 2, "P(1)", abs(beta) ** 2)`;

  return (
    <StudioChrome title="Bloch Sphere" tagline="the state of a qubit"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Polar angle θ (°)" value={theta} min={0} max={180} step={1} onChange={(v) => update({ theta: v })} />
        <Slider label="Azimuth φ (°)" value={phi} min={0} max={360} step={1} onChange={(v) => update({ phi: v })} />
        <p className="mt-3 text-xs text-slate-500">Every pure state of a single qubit is a point on the Bloch sphere. The north pole is |0⟩, the south |1⟩, and the equator holds equal superpositions differing only in phase φ. Quantum gates rotate this arrow — the geometric picture behind all single-qubit quantum computing.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="P(|0⟩)" value={p0.toFixed(3)} />
        <Stat label="P(|1⟩)" value={p1.toFixed(3)} />
        <Stat label="Amplitude α" value={a.toFixed(3)} />
        <Stat label="Amplitude β" value={`${Math.hypot(bRe, bIm).toFixed(2)}∠${phi}°`} />
        <Equation tex={`|\\psi\\rangle = \\cos\\tfrac{\\theta}{2}\\,|0\\rangle + e^{i\\phi}\\sin\\tfrac{\\theta}{2}\\,|1\\rangle = ${a.toFixed(2)}\\,|0\\rangle + e^{i(${phi}^{\\circ})}${Math.hypot(bRe, bIm).toFixed(2)}\\,|1\\rangle`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={400} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
