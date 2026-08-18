"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 440;

export function MirrorStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [f, setF] = useState(120);
  const [objDist, setObjDist] = useState(220);
  const [concave, setConcave] = useState(true);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W - 120, cy = H / 2, F = concave ? f : -f;
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    // mirror arc
    ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx - (concave ? -400 : 400), cy, 400, concave ? Math.PI - 0.4 : -0.4, concave ? Math.PI + 0.4 : 0.4); ctx.stroke();
    ctx.fillStyle = "#64748b"; [cx - f].forEach((x) => { ctx.beginPath(); ctx.arc(x, cy, 3, 0, 7); ctx.fill(); });
    const ox = cx - objDist, objH = 70;
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ox, cy); ctx.lineTo(ox, cy - objH); ctx.stroke();
    // mirror eq 1/v + 1/u = 1/f, u = objDist
    const u = objDist; const v = 1 / (1 / F - 1 / u); const mag = -v / u; const imgH = objH * mag; const ix = cx - v;
    ctx.strokeStyle = "rgba(244,114,182,0.85)"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(ox, cy - objH); ctx.lineTo(cx, cy - objH); ctx.lineTo(ix, cy - imgH); ctx.stroke();
    ctx.strokeStyle = "rgba(251,191,36,0.85)"; ctx.beginPath(); ctx.moveTo(ox, cy - objH); ctx.lineTo(cx, cy); ctx.lineTo(ix, cy - imgH); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ix, cy); ctx.lineTo(ix, cy - imgH); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`${concave ? "concave" : "convex"} mirror · magnification ${mag.toFixed(2)}×`, 14, 24);
  }, [f, objDist, concave]);

  return (
    <StudioChrome title="Mirror Ray Tracing" tagline="concave & convex · mirror equation"
      controls={<div>
        <div className="mb-3 flex gap-2">{[true, false].map((c) => <button key={String(c)} onClick={() => setConcave(c)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${concave === c ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{c ? "Concave" : "Convex"}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Trace principal rays off a curved mirror to find the image. Concave mirrors focus and can flip the image; convex mirrors always give a small upright virtual image.</p>
        <Slider label="Focal length" value={f} min={60} max={220} step={10} onChange={setF} />
        <Slider label="Object distance" value={objDist} min={60} max={340} step={10} onChange={setObjDist} />
      </div>}
      inspector={<div><Stat label="Mirror" value={concave ? "concave" : "convex"} /><Stat label="Focal length" value={`${f}px`} /><Stat label="Equation" value="1/v + 1/u = 1/f" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
