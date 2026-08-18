"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const SHAPES = [{ n: "Hoop", c: 2 }, { n: "Disk", c: 0.5 }, { n: "Sphere", c: 0.4 }, { n: "Shell", c: 2 / 3 }];

const PRESETS: Record<string, { angle: number }> = {
  "Gentle (10°)": { angle: 10 },
  "Moderate (20°)": { angle: 20 },
  "Steep (35°)": { angle: 35 },
  "Max (45°)": { angle: 45 },
};

export function RollingMotionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ angle }, update] = useShareableNumbers({ angle: 20 });
  const th = angle * Math.PI / 180;
  const acc = (c: number) => 9.81 * Math.sin(th) / (1 + c);
  const st = useRef({ t: 0 });

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); let raf = 0, last = 0; st.current.t = 0;
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

  const explain = `At ${angle}° the solid sphere leads at ${acc(0.4).toFixed(2)} m/s² while the hoop trails at ${acc(2).toFixed(2)} m/s² — a ${(acc(0.4) / acc(2)).toFixed(2)}× gap fixed entirely by mass distribution, independent of the incline and of every shape mass and radius.`;

  const code = `import numpy as np
angle = ${angle}
th = np.radians(angle); g = 9.81
for name, c in [("hoop", 2), ("disk", 0.5), ("sphere", 0.4), ("shell", 2/3)]:
    a = g * np.sin(th) / (1 + c)
    print(name, round(a, 2), "m/s^2")`;

  return (
    <StudioChrome title="Rolling Without Slipping" tagline="a shape race down the ramp"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Incline angle (°)" value={angle} min={5} max={45} step={1} onChange={(v) => update({ angle: v })} />
        <p className="mt-3 text-xs text-slate-500">All these shapes share the same mass and radius, yet a solid sphere beats a hoop every time. Acceleration = g·sinθ / (1 + I/mR²): mass concentrated near the axis (small I) accelerates faster — and the result is independent of mass and radius.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>{SHAPES.map((s) => <Stat key={s.n} label={`${s.n} accel`} value={`${acc(s.c).toFixed(2)} m/s²`} />)}<Equation tex={`a = \\frac{g\\sin\\theta}{1 + I/mR^2} = \\frac{9.81\\sin ${angle}^\\circ}{1 + I/mR^2} = \\frac{${(9.81 * Math.sin(th)).toFixed(2)}}{1 + I/mR^2}\\ \\text{m/s}^2`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
