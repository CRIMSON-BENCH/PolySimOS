"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// SPC X-bar control chart with a process shift.
export function ControlChartStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shift, setShift] = useState(0);
  const [running, setRunning] = useState(true);
  const data = useRef<number[]>([]);
  const [violations, setViolations] = useState(0);

  const target = 50, sigma = 2; const UCL = target + 3 * sigma, LCL = target - 3 * sigma;
  const reset = () => { data.current = []; setViolations(0); };

  useEffect(() => {
    if (!running) return; let raf = 0; let s = 88; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    let frame = 0;
    const loop = () => {
      frame++; if (frame % 25 === 0) { const val = target + shift + gauss() * sigma; data.current.push(val); if (data.current.length > 40) data.current.shift(); }
      let viol = 0; data.current.forEach((d) => { if (d > UCL || d < LCL) viol++; }); setViolations(viol);
      const W = 540, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const ox = 40, pw = W - 60, ph = H - 60, oy = H - 30; const Y = (v: number) => oy - ((v - 40) / 20) * ph;
      ctx.strokeStyle = "#a3e635"; ctx.beginPath(); ctx.moveTo(ox, Y(target)); ctx.lineTo(ox + pw, Y(target)); ctx.stroke();
      ctx.strokeStyle = "#ef4444"; ctx.setLineDash([4, 4]); [UCL, LCL].forEach((l) => { ctx.beginPath(); ctx.moveTo(ox, Y(l)); ctx.lineTo(ox + pw, Y(l)); ctx.stroke(); }); ctx.setLineDash([]);
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5; ctx.beginPath(); data.current.forEach((d, i) => { const x = ox + (i / 40) * pw; i ? ctx.lineTo(x, Y(d)) : ctx.moveTo(x, Y(d)); }); ctx.stroke();
      data.current.forEach((d, i) => { const x = ox + (i / 40) * pw; const out = d > UCL || d < LCL; ctx.fillStyle = out ? "#f472b6" : "#22d3ee"; ctx.beginPath(); ctx.arc(x, Y(d), out ? 5 : 3, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("X-bar control chart", ox + 6, 18); ctx.fillStyle = "#fca5a5"; ctx.fillText("UCL", ox + pw - 26, Y(UCL) - 4); ctx.fillText("LCL", ox + pw - 26, Y(LCL) + 12);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, shift]);

  return (
    <StudioChrome title="SPC Control Chart" tagline="in control or not?"
      controls={<div>
        <Slider label="Process shift" value={shift} min={-8} max={8} step={0.5} onChange={setShift} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">Statistical process control watches a process over time against control limits set at three standard deviations from the target. Points inside are normal random variation — leave them alone. A point beyond the limits, or a run trending one way, signals a real change worth investigating. Nudge the process shift and watch points breach the limits.</p>
      </div>}
      inspector={<div><Stat label="Center line" value={String(target)} /><Stat label="Control limits" value={`±3σ (${LCL}–${UCL})`} /><Stat label="Out of control" value={String(violations)} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
