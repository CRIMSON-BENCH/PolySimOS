"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 600, H = 480;

export function LissajousStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [a, setA] = useState(3);
  const [b, setB] = useState(2);
  const [delta, setDelta] = useState(0.5);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H); let t = 0;
    const R = 200, cx = W / 2, cy = H / 2;
    const loop = () => {
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(34,211,238,0.7)"; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let p = 0; p <= 1000; p++) { const tt = (p / 1000) * Math.PI * 2; const x = cx + R * Math.sin(a * tt + delta * Math.PI), y = cy + R * Math.sin(b * tt); p ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      if (running) t += 0.02;
      const dx = cx + R * Math.sin(a * t + delta * Math.PI), dy = cy + R * Math.sin(b * t);
      ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(dx, dy, 6, 0, 7); ctx.fill();
      ctx.fillStyle = "#94a3b8"; ctx.font = "13px system-ui"; ctx.fillText(`x = sin(${a}t + ${delta.toFixed(1)}π),  y = sin(${b}t)`, 16, 26);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [a, b, delta, running]);

  return (
    <StudioChrome title="Lissajous Curves" tagline="harmonic motion in two axes"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button></div>
        <p className="mb-3 text-xs text-slate-500">Combine two perpendicular sine waves. The frequency ratio a:b sets the number of lobes; the phase δ morphs the shape — the patterns you see on an oscilloscope.</p>
        <Slider label="Frequency a (x)" value={a} min={1} max={9} step={1} onChange={setA} />
        <Slider label="Frequency b (y)" value={b} min={1} max={9} step={1} onChange={setB} />
        <Slider label="Phase δ (×π)" value={delta} min={0} max={2} step={0.05} onChange={setDelta} />
      </div>}
      inspector={<div><Stat label="Ratio" value={`${a}:${b}`} /><Stat label="Phase" value={`${delta.toFixed(2)}π`} /><Stat label="Closed" value={Number.isInteger(a / b) || Number.isInteger(b / a) ? "yes" : "rational"} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
