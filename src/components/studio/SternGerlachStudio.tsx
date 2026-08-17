"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Sequential Stern-Gerlach: prepared spin-up, measured along angle theta.
export function SternGerlachStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(60);
  const [running, setRunning] = useState(true);
  const counts = useRef({ up: 0, down: 0 });
  const [, force] = useState(0);
  const seedRef = useRef(11);

  const pUp = Math.cos(angle * Math.PI / 360) ** 2; // cos^2(theta/2)

  const reset = () => { counts.current = { up: 0, down: 0 }; seedRef.current = 11; };
  useEffect(reset, [angle]);

  useEffect(() => {
    if (!running) return; let raf = 0;
    const loop = () => {
      let s = seedRef.current; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; seedRef.current = s; return s / 4294967296; };
      for (let k = 0; k < 5; k++) { if (rnd() < pUp) counts.current.up++; else counts.current.down++; }
      force((n) => n + 1);
      const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      // source beam
      ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, H / 2); ctx.lineTo(200, H / 2); ctx.stroke();
      ctx.fillStyle = "#bef264"; ctx.font = "11px sans-serif"; ctx.fillText("spin-up source", 24, H / 2 - 10);
      // magnet
      ctx.fillStyle = "#334155"; ctx.fillRect(200, H / 2 - 40, 40, 80); ctx.fillStyle = "#94a3b8"; ctx.fillText(`analyzer ${angle}°`, 195, H / 2 + 58);
      // two output beams sized by probability
      const tot = counts.current.up + counts.current.down || 1; const fUp = counts.current.up / tot;
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2 + fUp * 14; ctx.beginPath(); ctx.moveTo(240, H / 2); ctx.lineTo(480, H / 2 - 60); ctx.stroke();
      ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2 + (1 - fUp) * 14; ctx.beginPath(); ctx.moveTo(240, H / 2); ctx.lineTo(480, H / 2 + 60); ctx.stroke();
      ctx.fillStyle = "#67e8f9"; ctx.fillText(`+ : ${(fUp * 100).toFixed(0)}%`, 485, H / 2 - 58); ctx.fillStyle = "#f9a8d4"; ctx.fillText(`− : ${((1 - fUp) * 100).toFixed(0)}%`, 485, H / 2 + 62);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, angle, pUp]);

  const tot = counts.current.up + counts.current.down || 1;
  return (
    <StudioChrome title="Stern-Gerlach Experiment" tagline="spin measurement & projection"
      controls={<div>
        <Slider label="Analyzer angle θ (°)" value={angle} min={0} max={180} step={5} onChange={setAngle} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">Atoms prepared spin-up are measured along an axis tilted by θ. Quantum mechanics says each atom randomly comes out up or down, with probability cos²(θ/2) for up — never a fraction. At 90° it is a perfect coin flip; at 180° it always flips. The running tally converges to the Born-rule probability.</p>
      </div>}
      inspector={<div><Stat label="P(up) theory" value={pUp.toFixed(3)} /><Stat label="Measured up" value={`${(counts.current.up / tot * 100).toFixed(1)}%`} /><Stat label="Atoms" value={tot.toLocaleString()} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
