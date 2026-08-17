"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 420;

export function DopplerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1.5);
  const src = useRef({ x: 120, dir: 1 });
  const waves = useRef<{ x: number; y: number; r: number }[]>([]);
  const t = useRef(0);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const cy = H / 2;
    const loop = () => {
      if (running) {
        src.current.x += speed * src.current.dir; if (src.current.x > W - 60) src.current.dir = -1; if (src.current.x < 60) src.current.dir = 1;
        if (t.current % 8 === 0) waves.current.push({ x: src.current.x, y: cy, r: 0 });
        t.current++;
        for (const w of waves.current) w.r += 2.2;
        waves.current = waves.current.filter((w) => w.r < W);
      }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(34,211,238,0.55)"; ctx.lineWidth = 1.2;
      for (const w of waves.current) { ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, 7); ctx.stroke(); }
      ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(src.current.x, cy, 8, 0, 7); ctx.fill();
      const mach = speed / 2.2;
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui";
      ctx.fillText(src.current.dir > 0 ? "→ moving right: waves bunch ahead (higher pitch)" : "← moving left", 14, 24);
      ctx.fillText(mach >= 1 ? "supersonic — shock cone forms" : `Mach ${mach.toFixed(2)}`, 14, H - 14);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, speed]);

  const mach = speed / 2.2;
  return (
    <StudioChrome title="Doppler Effect" tagline="moving source · wavefront compression"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button></div>
        <p className="mb-3 text-xs text-slate-500">A moving source squeezes its wavefronts ahead and stretches them behind — higher pitch approaching, lower pitch receding. Push past the wave speed for a sonic boom.</p>
        <Slider label="Source speed" value={speed} min={0.3} max={3.5} step={0.1} onChange={setSpeed} />
      </div>}
      inspector={<div><Stat label="Mach number" value={mach.toFixed(2)} /><Stat label="Regime" value={mach >= 1 ? "supersonic" : "subsonic"} /><Stat label="Effect" value="Doppler shift" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
