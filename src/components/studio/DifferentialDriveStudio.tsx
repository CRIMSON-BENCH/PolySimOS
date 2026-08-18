"use client";

import { useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { vL: number; vR: number }> = {
  "Straight ahead": { vL: 3, vR: 3 },
  "Gentle arc": { vL: 2.2, vR: 2.8 },
  "Spin in place": { vL: -2, vR: 2 },
  "Sharp turn": { vL: 1, vR: 3.5 },
};

// Differential-drive (unicycle) robot kinematics.
export function DifferentialDriveStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ vL, vR }, update] = useShareableNumbers({ vL: 2.2, vR: 2.8 });
  const vLRef = useRef(vL); vLRef.current = vL;
  const vRRef = useRef(vR); vRRef.current = vR;
  const state = useRef({ x: 270, y: 200, th: 0 });
  const trail = useRef<[number, number][]>([]);

  const reset = () => { state.current = { x: 270, y: 200, th: 0 }; trail.current = []; };

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const b = 20; // wheelbase
    const ctx = hidpi(canvas, 540, 400);
    const s = state.current;
    for (let i = 0; i < steps; i++) {
      const v = (vRRef.current + vLRef.current) / 2 * 1.5; const w = (vRRef.current - vLRef.current) / b * 1.5;
      s.th += w; s.x += v * Math.cos(s.th); s.y += v * Math.sin(s.th);
      if (s.x < 10) s.x = 10; if (s.x > 530) s.x = 530; if (s.y < 10) s.y = 10; if (s.y > 390) s.y = 390;
      trail.current.push([s.x, s.y]); if (trail.current.length > 900) trail.current.shift();
    }
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 400);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5; ctx.beginPath(); trail.current.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    // robot body
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.th); ctx.fillStyle = "#f472b6"; ctx.fillRect(-14, -11, 28, 22); ctx.fillStyle = "#334155"; ctx.fillRect(-14, -14, 28, 4); ctx.fillRect(-14, 10, 28, 4);
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(6, -6); ctx.lineTo(6, 6); ctx.fill(); ctx.restore();
  };

  const t = useTransport(frame);

  const R = vL !== vR ? ((vR + vL) / 2) / ((vR - vL) / 20) : Infinity;

  const explain =
    vL === vR
      ? "Both wheels match, so the robot rolls dead straight — turn rate is zero and the turn radius is infinite."
      : vL === -vR
      ? "The wheels spin equal and opposite, so the robot pivots in place about its center — zero forward travel, pure rotation."
      : `The faster ${vR > vL ? "right" : "left"} wheel pushes the robot into an arc that curves toward the slower ${vR > vL ? "left" : "right"} side, with radius set by how close the two speeds are.`;

  const code = `vL, vR, b = ${vL}, ${vR}, 20.0
v = (vR + vL) / 2          # forward speed
w = (vR - vL) / b          # turn rate per step
R = float('inf') if vL == vR else v / w
print("forward", v, "omega", w, "radius", R)`;

  return (
    <StudioChrome title="Differential Drive Robot" tagline="wheel speeds → path"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Left wheel speed" value={vL} min={-4} max={4} step={0.1} onChange={(v) => update({ vL: v })} />
        <Slider label="Right wheel speed" value={vR} min={-4} max={4} step={0.1} onChange={(v) => update({ vR: v })} />
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mt-3 text-xs text-slate-500">A differential-drive robot steers by spinning its two wheels at different speeds — like a tank. Equal speeds go straight, a difference curves the path, and opposite speeds spin in place. Its forward speed is the average of the wheels and its turn rate is their difference over the wheelbase.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Forward v" value={((vR + vL) / 2).toFixed(2)} /><Stat label="Turn rate ω" value={((vR - vL) / 20).toFixed(3)} /><Stat label="Turn radius" value={isFinite(R) ? R.toFixed(0) : "straight"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
