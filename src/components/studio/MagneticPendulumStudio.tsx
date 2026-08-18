"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const W = 640, H = 480;

const PRESETS: Record<string, { friction: number; pull: number }> = {
  "Low friction (wild)": { friction: 0.999, pull: 0.6 },
  "High damping (settles)": { friction: 0.986, pull: 0.6 },
  "Strong magnets": { friction: 0.995, pull: 1.4 },
  "Weak pull": { friction: 0.995, pull: 0.3 },
};

export function MagneticPendulumStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const st = useRef({ x: 120, y: 80, vx: 0, vy: 0 });
  const trail = useRef<[number, number][]>([]);
  const [{ friction, pull }, update] = useShareableNumbers({ friction: 0.995, pull: 0.6 });

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

  const damping = (1 - friction) * 100;
  const explain =
    `Which magnet the bob settles on depends with extreme sensitivity on where it starts: neighboring drop points can end at different magnets, carving fractal basins of attraction. ` +
    (friction >= 0.997
      ? `At friction ${friction} the bob loses almost no energy per step, so it wanders far and long before committing — basins stay wildly tangled. `
      : friction <= 0.99
      ? `At friction ${friction} the bob bleeds energy fast and settles quickly into the nearest well — basins look smoother. `
      : `At friction ${friction} it settles at a moderate pace. `) +
    (pull >= 1.2
      ? `Strong magnets (pull ${pull}) deepen the wells and grab the bob hard.`
      : pull <= 0.35
      ? `Weak magnets (pull ${pull}) barely tug, so the central spring dominates.`
      : `Magnet strength ${pull} balances against the central spring.`);

  const code = `import numpy as np
friction, pull = ${friction}, ${pull}
W, H = ${W}, ${H}
magnets = np.array([[W/2, H/2-70],[W/2-70, H/2+50],[W/2+70, H/2+50]], float)
cx, cy = W/2, H/2

def final_magnet(x0, y0, steps=4000):
    x, y, vx, vy = x0, y0, 0.0, 0.0
    for _ in range(steps):
        for _ in range(3):
            ax, ay = (cx-x)*0.002, (cy-y)*0.002  # spring to center
            for mx, my in magnets:
                dx, dy = mx-x, my-y
                d = np.hypot(np.hypot(dx, dy), 12) + 6
                f = pull*40/(d*d*d)
                ax += f*dx; ay += f*dy
            vx = (vx+ax)*friction; vy = (vy+ay)*friction
            x += vx; y += vy
    d = np.hypot(magnets[:,0]-x, magnets[:,1]-y)
    return int(np.argmin(d))

print("settles on magnet", final_magnet(120, 80))`;

  return (
    <StudioChrome title="Magnetic Pendulum" tagline="chaotic attraction · fractal basins"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A pendulum bob is pulled toward three magnets. Which one it lands on depends so sensitively on the start that the basins of attraction form a fractal.</p>
        <button onClick={() => drop(120, 80)} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Friction" value={friction} min={0.985} max={0.999} step={0.001} onChange={(v) => update({ friction: v })} />
        <Slider label="Magnet strength" value={pull} min={0.2} max={1.5} step={0.1} onChange={(v) => update({ pull: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Magnets" value="3" />
        <Stat label="Damping" value={`${damping.toFixed(1)}% / step`} />
        <Stat label="Magnet strength" value={pull.toFixed(2)} />
        <Stat label="Basins" value="fractal" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
