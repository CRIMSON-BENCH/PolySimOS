"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { PALETTE, hidpi, useShareableNumbers, useCanvasDrag } from "@/lib/studioKit";

const W = 760, H = 480;
const ORIGIN_X = 52, ORIGIN_Y = H - 52, VSCALE = 3; // px per m/s for the launch-velocity vector

const PRESETS: Record<string, { angle: number; speed: number; drag: number }> = {
  "Vacuum 45°": { angle: 45, speed: 60, drag: 0 },
  "Max range (drag)": { angle: 38, speed: 90, drag: 0.02 },
  "Mortar (75°)": { angle: 75, speed: 70, drag: 0.015 },
  "Line drive (20°)": { angle: 20, speed: 100, drag: 0.02 },
};

export function ProjectileStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ angle, speed, drag }, update] = useShareableNumbers({ angle: 45, speed: 60, drag: 0.02 });

  const traj = useMemo(() => {
    const rad = (angle * Math.PI) / 180;
    let x = 0, y = 0, vx = speed * Math.cos(rad), vy = speed * Math.sin(rad);
    const g = 30, dt = 0.02;
    const pts: [number, number][] = [[0, 0]];
    for (let i = 0; i < 4000 && y >= 0; i++) {
      const v = Math.hypot(vx, vy);
      vx += -drag * v * vx * dt;
      vy += (-g - drag * v * vy) * dt;
      x += vx * dt; y += vy * dt;
      if (y < 0) break;
      pts.push([x, y]);
    }
    return pts;
  }, [angle, speed, drag]);

  const range = Math.max(...traj.map((p) => p[0]), 0);
  const apex = Math.max(...traj.map((p) => p[1]), 0);

  // Drag anywhere on the plot to aim the launch: the vector from the origin sets angle & speed.
  useCanvasDrag(canvasRef, W, H, {
    pick: (x, y) => x >= 40 && x <= W - 40 && y >= 40 && y <= H - 40,
    move: (x, y) => {
      const dx = x - ORIGIN_X, dy = ORIGIN_Y - y;
      const sp = Math.max(10, Math.min(120, Math.hypot(dx, dy) / VSCALE));
      const ang = Math.max(5, Math.min(85, (Math.atan2(Math.max(0, dy), Math.max(0, dx)) * 180) / Math.PI));
      update({ angle: Math.round(ang), speed: Math.round(sp / 5) * 5 });
    },
  });

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);

    const pad = 52;
    const maxX = Math.max(range, 10), maxY = Math.max(apex, 10);
    const sx = (x: number) => pad + (x / maxX) * (W - 2 * pad);
    const sy = (y: number) => H - pad - (y / maxY) * (H - 2 * pad);

    // gridlines + tick labels
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const gx = pad + (i / 5) * (W - 2 * pad);
      ctx.strokeStyle = PALETTE.grid;
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, H - pad); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillText(((i / 5) * maxX).toFixed(0), gx, H - pad + 16);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const gy = H - pad - (i / 4) * (H - 2 * pad);
      ctx.strokeStyle = PALETTE.grid;
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillText(((i / 4) * maxY).toFixed(0), pad - 8, gy + 4);
    }

    // axis titles
    ctx.fillStyle = PALETTE.axis;
    ctx.textAlign = "center";
    ctx.fillText("distance (m)", W / 2, H - 12);
    ctx.save();
    ctx.translate(16, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("height (m)", 0, 0);
    ctx.restore();

    // trajectory
    ctx.strokeStyle = PALETTE.series[0];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    traj.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1]))));
    ctx.stroke();

    // landing marker
    const last = traj[traj.length - 1];
    ctx.fillStyle = PALETTE.series[1];
    ctx.beginPath(); ctx.arc(sx(last[0]), sy(last[1]), 6, 0, 7); ctx.fill();

    // apex marker
    const apexPt = traj.reduce((a, b) => (b[1] > a[1] ? b : a), traj[0]);
    ctx.strokeStyle = PALETTE.series[2];
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(sx(apexPt[0]), sy(apexPt[1])); ctx.lineTo(sx(apexPt[0]), H - pad); ctx.stroke();
    ctx.setLineDash([]);

    // draggable launch-velocity vector (drag it to aim)
    const rad0 = (angle * Math.PI) / 180;
    const tipX = ORIGIN_X + Math.cos(rad0) * speed * VSCALE;
    const tipY = ORIGIN_Y - Math.sin(rad0) * speed * VSCALE;
    ctx.strokeStyle = PALETTE.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(ORIGIN_X, ORIGIN_Y); ctx.lineTo(tipX, tipY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.accent;
    ctx.beginPath(); ctx.arc(tipX, tipY, 6, 0, 7); ctx.fill();
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("drag to aim", tipX + 9, tipY + 3);
  }, [traj, range, apex, angle, speed]);

  const explain =
    drag < 0.005
      ? "Near-vacuum: 45° maximizes range and the arc is symmetric — the classic textbook result."
      : angle > 60
      ? "Steep launch: tall apex, short range. Most of the launch energy goes up, not out."
      : angle < 30
      ? "Shallow launch: fast and flat with a low apex — flight time is short, so range is capped."
      : "With this much air drag the range-optimal angle falls below 45° (toward ~35°), and the descent is steeper than the climb.";

  const code = `import numpy as np
angle, speed, drag = ${angle}, ${speed}, ${drag}
rad = np.radians(angle); g, dt = 30.0, 0.02
x = y = 0.0; vx = speed*np.cos(rad); vy = speed*np.sin(rad)
xs, ys = [0.0], [0.0]
while y >= 0:
    v = np.hypot(vx, vy)
    vx += -drag*v*vx*dt
    vy += (-g - drag*v*vy)*dt
    x += vx*dt; y += vy*dt
    xs.append(x); ys.append(y)
print("range", max(xs), "apex", max(ys))`;

  return (
    <StudioChrome
      title="Projectile Motion Studio"
      tagline="ballistics with air drag"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Launch a projectile and see how angle, speed, and air resistance shape the arc.</p>
          <Presets
            presets={Object.keys(PRESETS).map((label) => ({ label }))}
            onApply={(label) => update(PRESETS[label])}
          />
          <Slider label="Launch angle (°)" value={angle} min={5} max={85} step={1} onChange={(v) => update({ angle: v })} />
          <Slider label="Launch speed" value={speed} min={10} max={120} step={5} onChange={(v) => update({ speed: v })} />
          <Slider label="Air drag" value={drag} min={0} max={0.1} step={0.005} onChange={(v) => update({ drag: v })} />
          <ShareBar code={code} />
        </div>
      }
      inspector={
        <div>
          <Stat label="Range" value={`${range.toFixed(1)} m`} />
          <Stat label="Max height" value={`${apex.toFixed(1)} m`} />
          <Stat label="Drag model" value={drag === 0 ? "none (ideal)" : "quadratic"} />
          <Equation tex={`\\dot v_x = -${drag}\\,v\\,v_x,\\quad \\dot v_y = -30 - ${drag}\\,v\\,v_y`} />
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
