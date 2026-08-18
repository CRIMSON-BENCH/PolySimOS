"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;

export function KeplerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [ecc, setEcc] = useState(0.6);
  const [a, setA] = useState(140);
  const st = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const trail = useRef<[number, number][]>([]);

  const reset = () => {
    const GM = 4000; const rp = a * (1 - ecc);
    st.current = { x: rp, y: 0, vx: 0, vy: Math.sqrt((GM / a) * (1 + ecc) / (1 - ecc)) };
    trail.current = [];
  };
  useEffect(() => { reset(); /* eslint-disable-next-line */ }, [ecc, a]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H); const GM = 4000, cx = W / 2, cy = H / 2;
    const loop = () => {
      const s = st.current;
      if (running) for (let i = 0; i < 4; i++) { const r = Math.hypot(s.x, s.y) || 1; const f = -GM / (r * r * r); s.vx += f * s.x * 0.02; s.vy += f * s.y * 0.02; s.x += s.vx * 0.02; s.y += s.vy * 0.02; }
      trail.current.push([cx + s.x, cy + s.y]); if (trail.current.length > 1200) trail.current.shift();
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(34,211,238,0.5)"; ctx.lineWidth = 1; ctx.beginPath(); trail.current.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke();
      ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill(); // star at focus
      ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(cx + s.x, cy + s.y, 6, 0, 7); ctx.fill();
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(ecc < 0.01 ? "circle" : ecc < 1 ? "ellipse" : "hyperbola", 16, 22);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, ecc]);

  return (
    <StudioChrome title="Kepler Orbit Studio" tagline="two-body gravity · conic-section orbits"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mb-3 text-xs text-slate-500">Set the eccentricity to trace Kepler&apos;s orbits — a circle, ellipse, or (past e=1) an escape hyperbola. The star sits at the focus.</p>
        <Slider label="Eccentricity e" value={ecc} min={0} max={1.2} step={0.02} onChange={setEcc} />
        <Slider label="Semi-major axis" value={a} min={80} max={200} step={5} onChange={setA} />
      </div>}
      inspector={<div><Stat label="Eccentricity" value={ecc.toFixed(2)} /><Stat label="Orbit" value={ecc < 0.01 ? "circular" : ecc < 1 ? "elliptical" : "hyperbolic"} /><Stat label="Law" value="Kepler / 1-r²" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
