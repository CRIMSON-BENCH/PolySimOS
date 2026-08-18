"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function LaserCavityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pump, setPump] = useState(4);
  const [loss, setLoss] = useState(2);

  const threshold = loss; const output = pump > threshold ? (pump - threshold) * 0.8 : 0; const lasing = pump > threshold;

  useEffect(() => {
    const W = 500, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const pMax = 12;
    const X = (p: number) => ox + (p / pMax) * pw; const Y = (o: number) => oy - (o / 8) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // output vs pump (kinked at threshold)
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(threshold), Y(0)); ctx.lineTo(X(pMax), Y((pMax - threshold) * 0.8)); ctx.stroke();
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(threshold), oy); ctx.lineTo(X(threshold), oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(pump), Y(output), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("output power vs pump", ox + 6, oy - ph + 12); ctx.fillStyle = "#bef264"; ctx.fillText("threshold", X(threshold) + 3, oy - ph + 26); ctx.fillStyle = "#94a3b8"; ctx.fillText("pump →", ox + pw - 46, oy + 16);
  }, [pump, loss]);

  return (
    <StudioChrome title="Laser Cavity" tagline="gain, loss & threshold"
      controls={<div>
        <Slider label="Pump power" value={pump} min={0} max={12} step={0.2} onChange={setPump} />
        <Slider label="Cavity loss" value={loss} min={0.5} max={8} step={0.2} onChange={setLoss} />
        <p className="mt-3 text-xs text-slate-500">A laser fires only when the optical gain from the pumped medium exceeds the losses of the mirror cavity. Below that threshold it merely glows like a lamp; above it, stimulated emission takes over and output rises steeply and linearly with pump power. This sharp threshold is the defining signature of laser action.</p>
      </div>}
      inspector={<div><Stat label="Threshold" value={threshold.toFixed(1)} /><Stat label="Output power" value={output.toFixed(2)} /><Stat label="State" value={lasing ? "lasing" : "below threshold"} /></div>}
    ><canvas ref={canvasRef} width={500} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
