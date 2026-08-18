"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi } from "@/lib/studioKit";

// Expected goals (xG) from shot location.
export function XGStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shot, setShot] = useState<[number, number]>([260, 200]);

  const goalX = 500, goalY1 = 150, goalY2 = 250, goalYc = 200;
  const dist = Math.hypot(goalX - shot[0], goalYc - shot[1]) / 8; // scaled to meters
  const a1 = Math.atan2(goalY1 - shot[1], goalX - shot[0]); const a2 = Math.atan2(goalY2 - shot[1], goalX - shot[0]);
  const angle = Math.abs(a1 - a2) * 180 / Math.PI;
  const z = 0.6 - 0.11 * dist + 0.06 * angle; const xg = 1 / (1 + Math.exp(-z));

  useEffect(() => {
    const W = 540, H = 400; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#0b2818"; ctx.fillRect(0, 0, W, H);
    // pitch markings (attacking half toward right)
    ctx.strokeStyle = "#2a6a3e"; ctx.lineWidth = 2; ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.strokeRect(goalX - 130, 90, 130, 220); ctx.strokeRect(goalX - 55, 150, 55, 100); // penalty & 6-yard box
    // goal
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(goalX, goalY1); ctx.lineTo(goalX, goalY2); ctx.stroke();
    // angle lines
    ctx.strokeStyle = "rgba(163,230,53,0.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(shot[0], shot[1]); ctx.lineTo(goalX, goalY1); ctx.moveTo(shot[0], shot[1]); ctx.lineTo(goalX, goalY2); ctx.stroke();
    // shot
    const col = `hsl(${xg * 120}, 80%, 55%)`; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(shot[0], shot[1], 10, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 11px sans-serif"; ctx.fillText(xg.toFixed(2), shot[0] - 10, shot[1] + 4);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText("click to place a shot — color = xG", 14, 28);
  }, [shot, xg]);

  const explain =
    xg > 0.4
      ? "A high-value chance: close range and a wide view of the goal mean even an average player buries this more often than not."
      : angle < 12
      ? "The shooting angle is tight — the goal is nearly edge-on from here, so most of the frame is blocked and the chance is speculative."
      : dist > 22
      ? "Long range dominates here: distance shrinks xG faster than anything else, so this is a low-probability effort."
      : "A middling chance — decent position but neither close enough nor open enough to be a clear-cut opportunity.";

  const code = `import numpy as np
sx, sy = ${shot[0].toFixed(0)}, ${shot[1].toFixed(0)}
gx, gy1, gy2, gyc = 500, 150, 250, 200
dist = np.hypot(gx - sx, gyc - sy) / 8
a1 = np.arctan2(gy1 - sy, gx - sx)
a2 = np.arctan2(gy2 - sy, gx - sx)
angle = abs(a1 - a2) * 180 / np.pi
z = 0.6 - 0.11 * dist + 0.06 * angle
xg = 1 / (1 + np.exp(-z))
print(round(xg, 2))`;

  return (
    <StudioChrome title="Expected Goals (xG)" tagline="the quality of a chance"
      controls={<div>
        <p className="mt-1 text-xs text-slate-500">Expected goals rates every shot by the probability an average player would score from that spot, learned from thousands of historical shots. The two biggest drivers are distance and angle to goal — a tap-in near the six-yard box is worth 0.8 xG, a long-range effort barely 0.03. Summing xG over a match reveals who truly deserved to win, beyond the scoreline. Click to place a shot.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Expected goals" value={xg.toFixed(2)} /><Stat label="Distance" value={`${dist.toFixed(0)} m`} /><Stat label="Angle to goal" value={`${angle.toFixed(0)}°`} /><Stat label="Rating" value={xg > 0.4 ? "big chance" : xg > 0.1 ? "decent" : "speculative"} /><Equation tex={`\\mathrm{xG} = \\dfrac{1}{1 + e^{-(0.6 - 0.11\\cdot${dist.toFixed(1)} + 0.06\\cdot${angle.toFixed(1)})}} = ${xg.toFixed(2)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={400} onClick={(e) => { const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); setShot([(e.clientX - r.left) * 540 / r.width, (e.clientY - r.top) * 400 / r.height]); }} className="mx-auto h-auto max-w-full cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
