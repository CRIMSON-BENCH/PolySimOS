"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { t1: number; t2: number; t3: number }> = {
  "Reach up": { t1: 90, t2: 0, t3: 0 },
  "Fully folded": { t1: 45, t2: -150, t3: -150 },
  "Straight out": { t1: 0, t2: 0, t3: 0 },
  "S-curve": { t1: 60, t2: -120, t3: 120 },
};

export function ForwardKinematicsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ t1, t2, t3 }, update] = useShareableNumbers({ t1: 45, t2: -30, t3: 20 });
  const L = [90, 70, 50];

  const a1 = t1 * Math.PI / 180, a2 = a1 + t2 * Math.PI / 180, a3 = a2 + t3 * Math.PI / 180;
  const j1 = [L[0] * Math.cos(a1), L[0] * Math.sin(a1)];
  const j2 = [j1[0] + L[1] * Math.cos(a2), j1[1] + L[1] * Math.sin(a2)];
  const tip = [j2[0] + L[2] * Math.cos(a3), j2[1] + L[2] * Math.sin(a3)];

  useEffect(() => {
    const W = 480, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = W / 2, oy = H - 80;
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
    const pts = [[0, 0], j1, j2, tip].map(([x, y]) => [ox + x, oy - y]);
    const cols = ["#22d3ee", "#a3e635", "#f472b6"];
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = cols[i]; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke(); }
    pts.forEach((p, i) => { ctx.beginPath(); ctx.arc(p[0], p[1], i === 3 ? 7 : 5, 0, 7); ctx.fillStyle = i === 3 ? "#fbbf24" : "#e2e8f0"; ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`end effector (${tip[0].toFixed(0)}, ${tip[1].toFixed(0)})`, pts[3][0] + 10, pts[3][1]);
  }, [t1, t2, t3]);

  const reach = Math.hypot(tip[0], tip[1]);
  const maxReach = L[0] + L[1] + L[2];
  const explain =
    reach > 0.9 * maxReach
      ? `Reach ${reach.toFixed(0)} sits near the ${maxReach} maximum: the three links are nearly collinear, so the arm is almost fully extended.`
      : reach < 0.3 * maxReach
      ? `Reach is only ${reach.toFixed(0)} because the joints fold the links back over each other, canceling much of their combined length.`
      : `The joint angles chain onto one another, placing the tip at (${tip[0].toFixed(0)}, ${tip[1].toFixed(0)}); one set of angles always maps to exactly one position.`;

  const code = `import numpy as np
t1, t2, t3 = ${t1}, ${t2}, ${t3}
L = [90, 70, 50]
a = np.radians(np.cumsum([t1, t2, t3]))  # each link is relative to the last
x = float(np.sum(np.multiply(L, np.cos(a))))
y = float(np.sum(np.multiply(L, np.sin(a))))
print("end effector", round(x, 1), round(y, 1))`;

  return (
    <StudioChrome title="Forward Kinematics" tagline="joint angles → end effector"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Joint 1 angle (°)" value={t1} min={-180} max={180} step={1} onChange={(v) => update({ t1: v })} />
        <Slider label="Joint 2 angle (°)" value={t2} min={-160} max={160} step={1} onChange={(v) => update({ t2: v })} />
        <Slider label="Joint 3 angle (°)" value={t3} min={-160} max={160} step={1} onChange={(v) => update({ t3: v })} />
        <p className="mt-3 text-xs text-slate-500">Forward kinematics computes where a robot arm&apos;s tip ends up from its joint angles. Each link rotates relative to the previous one, so the transforms chain together. It is fast and unique — every set of angles gives exactly one end-effector position — which is why controllers use it constantly.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="End X" value={tip[0].toFixed(1)} /><Stat label="End Y" value={tip[1].toFixed(1)} /><Stat label="Reach" value={reach.toFixed(1)} /><Stat label="Links" value="3" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={480} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
