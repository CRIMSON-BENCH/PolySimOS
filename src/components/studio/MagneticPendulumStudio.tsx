"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 640, H = 480;

export function MagneticPendulumStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const st = useRef({ x: 120, y: 80, vx: 0, vy: 0 });
  const trail = useRef<[number, number][]>([]);
  const [friction, setFriction] = useState(0.995);
  const [pull, setPull] = useState(0.6);

  const magnets = [[W / 2, H / 2 - 70], [W / 2 - 70, H / 2 + 50], [W / 2 + 70, H / 2 + 50]];
  const colors = ["#f472b6", "#22d3ee", "#a3e635"];
  const drop = (x: number, y: number) => { st.current = { x, y, vx: 0, vy: 0 }; trail.current = []; };

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    const onClick = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); drop((e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)); };
    canvas.addEventListener("click", onClick);
    const loop = () => {
      const s = st.current, cx = W / 2, cy = H / 2;
      for (let k = 0; k < 3; k++) {
        let ax = (cx - s.x) * 0.002, ay = (cy - s.y) * 0.002; // spring to center
        for (let m = 0; m < 3; m++) { const dx = magnets[m][0] - s.x, dy = magnets[m][1] - s.y; const d = Math.hypot(dx, dy, 12) + 6; const f = pull * 40 / (d * d * d); ax += f * dx; ay += f * dy; }
        s.vx = (s.vx + ax) * friction; s.vy = (s.vy + ay) * friction; s.x += s.vx; s.y += s.vy;
      }
      trail.current.push([s.x, s.y]); if (trail.current.length > 600) trail.current.shift();
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(148,163,184,0.5)"; ctx.lineWidth = 1; ctx.beginPath(); trail.current.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke();
      magnets.forEach((m, i) => { ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.arc(m[0], m[1], 10, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#e2e8f0"; ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, 7); ctx.fill();
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("click anywhere to drop the bob", 12, 22);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("click", onClick); };
  }, [friction, pull]);

  return (
    <StudioChrome title="Magnetic Pendulum" tagline="chaotic attraction · fractal basins"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A pendulum bob is pulled toward three magnets. Which one it lands on depends so sensitively on the start that the basins of attraction form a fractal.</p>
        <button onClick={() => drop(120, 80)} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button>
        <Slider label="Friction" value={friction} min={0.985} max={0.999} step={0.001} onChange={setFriction} />
        <Slider label="Magnet strength" value={pull} min={0.2} max={1.5} step={0.1} onChange={setPull} />
      </div>}
      inspector={<div><Stat label="Magnets" value="3" /><Stat label="Basins" value="fractal" /><Stat label="System" value="chaotic" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
