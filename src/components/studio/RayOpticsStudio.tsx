"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 440;

export function RayOpticsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [f, setF] = useState(120);       // focal length (px), sign chooses lens type
  const [objDist, setObjDist] = useState(240);
  const [objH, setObjH] = useState(70);
  const [converging, setConverging] = useState(true);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, F = converging ? f : -f;
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    // lens
    ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy - 150); ctx.lineTo(cx, cy + 150); ctx.stroke();
    ctx.fillStyle = "#38bdf8"; const dir = converging ? 1 : -1; ctx.beginPath(); ctx.moveTo(cx, cy - 150); ctx.lineTo(cx + dir * 8, cy - 138); ctx.lineTo(cx - dir * 8, cy - 138); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx, cy + 150); ctx.lineTo(cx + dir * 8, cy + 138); ctx.lineTo(cx - dir * 8, cy + 138); ctx.fill();
    // focal points
    ctx.fillStyle = "#64748b"; [cx - f, cx + f].forEach((x) => { ctx.beginPath(); ctx.arc(x, cy, 3, 0, 7); ctx.fill(); });
    // object arrow
    const ox = cx - objDist, oyTop = cy - objH;
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ox, cy); ctx.lineTo(ox, oyTop); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oyTop); ctx.lineTo(ox - 5, oyTop + 10); ctx.lineTo(ox + 5, oyTop + 10); ctx.fillStyle = "#a3e635"; ctx.fill();
    // thin-lens image: 1/v - 1/u = 1/F, u = -objDist
    const u = -objDist; const v = 1 / (1 / F + 1 / u); const mag = v / u; const imgH = objH * mag; const ix = cx + v;
    // ray 1: parallel then through far focus
    ctx.strokeStyle = "rgba(244,114,182,0.85)"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(ox, oyTop); ctx.lineTo(cx, oyTop); ctx.lineTo(ix, cy - imgH); ctx.stroke();
    // ray 2: through center, straight
    ctx.strokeStyle = "rgba(251,191,36,0.85)"; ctx.beginPath(); ctx.moveTo(ox, oyTop); ctx.lineTo(ix, cy - imgH); ctx.stroke();
    // image arrow
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ix, cy); ctx.lineTo(ix, cy - imgH); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui";
    const real = v > 0; ctx.fillText(`${converging ? "converging" : "diverging"} lens · image is ${real ? "real & inverted" : "virtual & upright"}`, 14, 24);
    ctx.fillText(`magnification ${mag.toFixed(2)}×`, 14, H - 12);
  }, [f, objDist, objH, converging]);

  return (
    <StudioChrome title="Ray Optics / Lens Studio" tagline="thin-lens equation · ray tracing"
      controls={<div>
        <div className="mb-3 flex gap-2">{[true, false].map((c) => <button key={String(c)} onClick={() => setConverging(c)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${converging === c ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{c ? "Converging" : "Diverging"}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Trace principal rays through a thin lens to locate the image. Move the object inside the focal point to flip from a real to a virtual image.</p>
        <Slider label="Focal length" value={f} min={60} max={220} step={10} onChange={setF} />
        <Slider label="Object distance" value={objDist} min={60} max={340} step={10} onChange={setObjDist} />
        <Slider label="Object height" value={objH} min={30} max={120} step={5} onChange={setObjH} />
      </div>}
      inspector={<div><Stat label="Lens" value={converging ? "converging" : "diverging"} /><Stat label="Focal length" value={`${f}px`} /><Stat label="Equation" value="1/v − 1/u = 1/f" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
