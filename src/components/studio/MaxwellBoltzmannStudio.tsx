"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 740, H = 440;

export function MaxwellBoltzmannStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [temp, setTemp] = useState(300);
  const [mass, setMass] = useState(32);

  const data = useMemo(() => {
    const a = mass / (2 * 8.314 * temp) * 1000; const xs: number[] = [], ys: number[] = []; let maxY = 0;
    for (let v = 0; v <= 1500; v += 10) { const f = 4 * Math.PI * v * v * Math.pow(a / Math.PI, 1.5) * Math.exp(-a * v * v); xs.push(v); ys.push(f); if (f > maxY) maxY = f; }
    const vmp = Math.sqrt(1 / a); const vavg = 2 / Math.sqrt(Math.PI * a); const vrms = Math.sqrt(1.5 / a);
    return { xs, ys, maxY, vmp, vavg, vrms };
  }, [temp, mass]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const pad = 40;
    const sx = (v: number) => pad + (v / 1500) * (W - 2 * pad); const sy = (y: number) => H - pad - (y / data.maxY) * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); data.xs.forEach((v, i) => i ? ctx.lineTo(sx(v), sy(data.ys[i])) : ctx.moveTo(sx(v), sy(data.ys[i]))); ctx.stroke();
    ctx.lineTo(sx(1500), H - pad); ctx.lineTo(pad, H - pad); ctx.closePath(); ctx.fillStyle = "rgba(34,211,238,0.12)"; ctx.fill();
    ctx.strokeStyle = "rgba(163,230,53,0.6)"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(sx(data.vmp), pad); ctx.lineTo(sx(data.vmp), H - pad); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("molecular speed distribution", pad, 22); ctx.fillText("speed (m/s) →", W - 120, H - 14); ctx.fillText(`v_mp ${data.vmp.toFixed(0)}`, sx(data.vmp) + 6, pad + 16);
  }, [data]);

  return (
    <StudioChrome title="Maxwell–Boltzmann Distribution" tagline="molecular speeds in a gas"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Gas molecules do not all move at one speed — they spread into this distribution. Heat the gas or lighten the molecule and the curve broadens and shifts faster.</p>
        <Slider label="Temperature (K)" value={temp} min={100} max={1000} step={25} onChange={setTemp} />
        <Slider label="Molar mass (g/mol)" value={mass} min={2} max={132} step={2} onChange={setMass} />
      </div>}
      inspector={<div><Stat label="Most probable" value={`${data.vmp.toFixed(0)} m/s`} /><Stat label="Average" value={`${data.vavg.toFixed(0)} m/s`} /><Stat label="RMS" value={`${data.vrms.toFixed(0)} m/s`} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
