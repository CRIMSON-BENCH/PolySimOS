"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Accident reconstruction: v = sqrt(30 * D * f * n)  (mph, ft)
export function SkidToStopStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dist, setDist] = useState(90); // skid length ft
  const [drag, setDrag] = useState(0.7); // drag factor (surface)
  const [braking, setBraking] = useState(1.0); // braking efficiency
  const [grade, setGrade] = useState(0); // % grade

  const f = drag + grade / 100;
  const speed = Math.sqrt(30 * dist * f * braking); // mph
  const kmh = speed * 1.60934;

  useEffect(() => {
    const W = 520, Hh = 200; const ctx = hidpi(canvasRef.current!, W, Hh); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, Hh);
    // road
    ctx.fillStyle = "#1e293b"; ctx.fillRect(0, 120, W, 50);
    const maxD = 300; const px = Math.min(W - 90, (dist / maxD) * (W - 90));
    // skid marks
    ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(30, 138); ctx.lineTo(30 + px, 138); ctx.moveTo(30, 152); ctx.lineTo(30 + px, 152); ctx.stroke();
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(30, 138); ctx.lineTo(30 + px, 138); ctx.moveTo(30, 152); ctx.lineTo(30 + px, 152); ctx.stroke(); ctx.setLineDash([]);
    // car at end
    ctx.fillStyle = "#22d3ee"; ctx.fillRect(30 + px, 118, 46, 24); ctx.fillStyle = "#67e8f9"; ctx.fillRect(30 + px + 8, 112, 26, 10);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "12px sans-serif"; ctx.fillText(`${dist} ft skid`, 34, 100);
  }, [dist, drag, grade]);

  return (
    <StudioChrome title="Skid-to-Stop Speed" tagline="accident reconstruction"
      controls={<div>
        <Slider label="Skid length (ft)" value={dist} min={5} max={300} step={5} onChange={setDist} />
        <Slider label="Drag factor (surface)" value={drag} min={0.3} max={1.0} step={0.05} onChange={setDrag} />
        <Slider label="Braking efficiency" value={braking} min={0.25} max={1.0} step={0.05} onChange={setBraking} />
        <Slider label="Road grade (%)" value={grade} min={-15} max={15} step={1} onChange={setGrade} />
        <p className="mt-3 text-xs text-slate-500">The minimum speed at the start of a skid follows v = √(30·D·f·n), where D is skid distance, f the surface drag factor, and n braking efficiency. Uphill grade adds to f, downhill subtracts. Estimation aid — a formal reconstruction requires scene measurement and a drag-factor test.</p>
      </div>}
      inspector={<div><Stat label="Effective f" value={f.toFixed(2)} /><Stat label="Speed (km/h)" value={kmh.toFixed(0)} /><Stat label="Formula" value="√(30·D·f·n)" /></div>}
    ><div>
        <canvas ref={canvasRef} width={520} height={200} className="mx-auto h-auto max-w-full rounded-lg" />
        <div className="mt-6 flex flex-col items-center"><div className="text-xs uppercase tracking-widest text-slate-500">Minimum speed at start of skid</div>
          <div className="mt-2 text-6xl font-black text-cyan-500">{speed.toFixed(0)}<span className="ml-2 text-2xl text-slate-400">mph</span></div></div>
      </div></StudioChrome>
  );
}
