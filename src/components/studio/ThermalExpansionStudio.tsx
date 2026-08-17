"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const MAT: Record<string, number> = { Steel: 12, Aluminum: 23, Copper: 17, Glass: 9, Concrete: 12, Invar: 1.2 };

export function ThermalExpansionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mat, setMat] = useState("Aluminum");
  const [L0, setL0] = useState(10); // m
  const [dT, setDT] = useState(50); // deg C

  const alpha = MAT[mat] * 1e-6; const dL = alpha * L0 * dT; const dA = 2 * alpha * (L0 * L0) * dT; const dV = 3 * alpha * (L0 ** 3) * dT;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 220; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, baseW = 300, exag = 30000; // exaggerate for visibility
    ctx.fillStyle = "#334155"; ctx.fillRect(ox, 60, baseW, 30); ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("original", ox, 55);
    const grow = (dL / L0) * exag; ctx.fillStyle = "#22d3ee"; ctx.fillRect(ox, 130, baseW + grow, 30); ctx.fillStyle = "#67e8f9"; ctx.fillText(`heated +${dT}°C (expansion exaggerated)`, ox, 125);
    ctx.strokeStyle = "#f472b6"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox + baseW, 130); ctx.lineTo(ox + baseW, 160); ctx.stroke(); ctx.setLineDash([]);
  }, [mat, L0, dT]);

  return (
    <StudioChrome title="Thermal Expansion" tagline="materials grow with heat"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-2">{Object.keys(MAT).map((k) => <button key={k} onClick={() => setMat(k)} className={`rounded-lg px-1 py-1 text-xs font-semibold ${mat === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <Slider label="Original length (m)" value={L0} min={0.5} max={100} step={0.5} onChange={setL0} />
        <Slider label="Temperature change (°C)" value={dT} min={-100} max={200} step={5} onChange={setDT} />
        <p className="mt-3 text-xs text-slate-500">Heat a material and it expands: ΔL = α·L·ΔT, where α is the coefficient of linear expansion. Area grows at twice that rate and volume at three times. It is why bridges have expansion joints, why rails buckle in heat, and why Invar — with almost zero expansion — is prized for precision instruments.</p>
      </div>}
      inspector={<div><Stat label="α" value={`${MAT[mat]} µm/m·°C`} /><Stat label="Length change" value={`${(dL * 1000).toFixed(1)} mm`} /><Stat label="Area change" value={`${dA.toFixed(3)} m²`} /><Stat label="Volume change" value={`${dV.toFixed(3)} m³`} /></div>}
    ><canvas ref={canvasRef} width={520} height={220} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
