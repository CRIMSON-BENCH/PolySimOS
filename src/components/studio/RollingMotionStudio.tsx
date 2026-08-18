"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const SHAPES = [{ n: "Hoop", c: 2 }, { n: "Disk", c: 0.5 }, { n: "Sphere", c: 0.4 }, { n: "Shell", c: 2 / 3 }];

export function RollingMotionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(20);
  const th = angle * Math.PI / 180;
  const acc = (c: number) => 9.81 * Math.sin(th) / (1 + c);
  const st = useRef({ t: 0 });

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 320; let raf = 0, last = 0; st.current.t = 0;
    const cols = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24"];
    const loop = (t: number) => {
      const dt = last ? Math.min(0.03, (t - last) / 1000) : 0; last = t; st.current.t += dt;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const L = 460, x0 = 30, y0 = 40, x1 = x0 + L * Math.cos(th), y1 = y0 + L * Math.sin(th);
      ctx.strokeStyle = "#334155"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      SHAPES.forEach((s, i) => { const dd = Math.min(0.5 * acc(s.c) * st.current.t * st.current.t * 40, L - 20); const px = x0 + dd * Math.cos(th), py = y0 + dd * Math.sin(th) - 14; ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText(s.n, px - 10, py - 14); });
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("which rolls fastest? less rotational inertia wins", 12, H - 14);
      if (st.current.t > 4) st.current.t = 0;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [angle, th]);

  return (
    <StudioChrome title="Rolling Without Slipping" tagline="a shape race down the ramp"
      controls={<div>
        <Slider label="Incline angle (°)" value={angle} min={5} max={45} step={1} onChange={setAngle} />
        <p className="mt-3 text-xs text-slate-500">All these shapes share the same mass and radius, yet a solid sphere beats a hoop every time. Acceleration = g·sinθ / (1 + I/mR²): mass concentrated near the axis (small I) accelerates faster — and the result is independent of mass and radius.</p>
      </div>}
      inspector={<div>{SHAPES.map((s) => <Stat key={s.n} label={`${s.n} accel`} value={`${acc(s.c).toFixed(2)} m/s²`} />)}</div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
