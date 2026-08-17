"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

type Beam = "ss-point" | "ss-udl" | "cant-point" | "cant-udl";

export function BeamDeflectionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [type, setType] = useState<Beam>("ss-point");
  const [L, setL] = useState(5); // m
  const [load, setLoad] = useState(10); // kN or kN/m
  const [EI, setEI] = useState(20000); // kN·m^2

  // max deflection (m) and max moment (kN·m)
  let defl = 0, mmax = 0;
  const P = load, w = load;
  if (type === "ss-point") { defl = P * L ** 3 / (48 * EI); mmax = P * L / 4; }
  else if (type === "ss-udl") { defl = 5 * w * L ** 4 / (384 * EI); mmax = w * L ** 2 / 8; }
  else if (type === "cant-point") { defl = P * L ** 3 / (3 * EI); mmax = P * L; }
  else { defl = w * L ** 4 / (8 * EI); mmax = w * L ** 2 / 2; }

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, y0 = 110, span = W - 100; const cant = type.startsWith("cant");
    // deflected shape (scaled)
    const scale = 60 / (defl || 1e-9);
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, y0); ctx.lineTo(ox + span, y0); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 100; i++) { const x = i / 100; let d = 0;
      if (type === "ss-point") d = x <= 0.5 ? (P / (48 * EI)) * (3 * L ** 2 * (x * L) - 4 * (x * L) ** 3) : 0;
      else if (type === "ss-udl") d = (w / (24 * EI)) * (x * L) * (L ** 3 - 2 * L * (x * L) ** 2 + (x * L) ** 3);
      else if (type === "cant-point") d = (P / (6 * EI)) * (x * L) ** 2 * (3 * L - x * L);
      else d = (w / (24 * EI)) * (x * L) ** 2 * (6 * L ** 2 - 4 * L * (x * L) + (x * L) ** 2);
      if (type === "ss-point" && x > 0.5) { const xr = 1 - x; d = (P / (48 * EI)) * (3 * L ** 2 * (xr * L) - 4 * (xr * L) ** 3); }
      const px = ox + x * span, py = y0 + d * scale; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    // supports
    ctx.fillStyle = "#e2e8f0"; if (cant) { ctx.fillRect(ox - 6, y0 - 30, 6, 60); } else { ctx.beginPath(); ctx.moveTo(ox, y0); ctx.lineTo(ox - 8, y0 + 14); ctx.lineTo(ox + 8, y0 + 14); ctx.fill(); ctx.beginPath(); ctx.moveTo(ox + span, y0); ctx.lineTo(ox + span - 8, y0 + 14); ctx.lineTo(ox + span + 8, y0 + 14); ctx.fill(); }
    // load arrows
    ctx.strokeStyle = "#f472b6"; ctx.fillStyle = "#f472b6"; ctx.lineWidth = 2;
    const arrow = (x: number) => { ctx.beginPath(); ctx.moveTo(x, y0 - 45); ctx.lineTo(x, y0 - 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y0 - 4); ctx.lineTo(x - 4, y0 - 12); ctx.lineTo(x + 4, y0 - 12); ctx.fill(); };
    if (type === "ss-point") arrow(ox + span / 2); else if (type === "cant-point") arrow(ox + span); else for (let i = 0; i <= 10; i++) arrow(ox + (i / 10) * span);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("deflected shape (exaggerated)", ox, H - 20);
  }, [type, L, load, EI]);

  return (
    <StudioChrome title="Beam Deflection & Bending" tagline="Euler-Bernoulli beam theory"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-2">{([["ss-point", "SS + point"], ["ss-udl", "SS + UDL"], ["cant-point", "Cantilever + point"], ["cant-udl", "Cantilever + UDL"]] as [Beam, string][]).map(([t, l]) => <button key={t} onClick={() => setType(t)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${type === t ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{l}</button>)}</div>
        <Slider label="Span L (m)" value={L} min={1} max={12} step={0.5} onChange={setL} />
        <Slider label={type.endsWith("udl") ? "Load w (kN/m)" : "Load P (kN)"} value={load} min={1} max={100} step={1} onChange={setLoad} />
        <Slider label="Flexural rigidity EI (kN·m²)" value={EI} min={2000} max={80000} step={1000} onChange={setEI} />
        <p className="mt-3 text-xs text-slate-500">Euler-Bernoulli theory relates a beam&apos;s deflection and internal moment to its load, span, and flexural rigidity EI. Deflection grows with the cube or fourth power of span, which is why doubling a span is far worse than doubling the load. Educational tool — not a substitute for a stamped structural design.</p>
      </div>}
      inspector={<div><Stat label="Max deflection" value={`${(defl * 1000).toFixed(2)} mm`} /><Stat label="Max moment" value={`${mmax.toFixed(1)} kN·m`} /><Stat label="Span/deflection" value={`L/${(L / defl).toFixed(0)}`} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
