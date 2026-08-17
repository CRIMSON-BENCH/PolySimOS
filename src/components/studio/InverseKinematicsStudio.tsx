"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";

export function InverseKinematicsStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [target, setTarget] = useState<[number, number]>([120, 40]);
  const [elbowUp, setElbowUp] = useState(true);
  const L1 = 100, L2 = 80;

  // 2-link analytic IK
  const [x, y] = target; const d = Math.hypot(x, y); const reachable = d <= L1 + L2 && d >= Math.abs(L1 - L2);
  const cos2 = Math.max(-1, Math.min(1, (x * x + y * y - L1 * L1 - L2 * L2) / (2 * L1 * L2)));
  const t2 = (elbowUp ? 1 : -1) * Math.acos(cos2);
  const t1 = Math.atan2(y, x) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2));

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 480, H = 380; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = W / 2, oy = H / 2 + 60;
    // reachable annulus
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.arc(ox, oy, L1 + L2, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(ox, oy, Math.abs(L1 - L2), 0, 7); ctx.stroke();
    const j1 = [ox + L1 * Math.cos(t1), oy - L1 * Math.sin(t1)]; const tip = [ox + x, oy - y];
    ctx.strokeStyle = reachable ? "#22d3ee" : "#ef4444"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(j1[0], j1[1]); ctx.stroke();
    ctx.strokeStyle = reachable ? "#a3e635" : "#ef4444"; ctx.beginPath(); ctx.moveTo(j1[0], j1[1]); ctx.lineTo(reachable ? tip[0] : j1[0], reachable ? tip[1] : j1[1]); ctx.stroke();
    [[ox, oy], j1].forEach((p) => { ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 7); ctx.fillStyle = "#e2e8f0"; ctx.fill(); });
    // target
    ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tip[0], tip[1], 8, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(tip[0] - 12, tip[1]); ctx.lineTo(tip[0] + 12, tip[1]); ctx.moveTo(tip[0], tip[1] - 12); ctx.lineTo(tip[0], tip[1] + 12); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("click to move the target", 12, 20);
  }, [target, elbowUp, t1, t2, reachable, x, y]);

  return (
    <StudioChrome title="Inverse Kinematics" tagline="target → joint angles"
      controls={<div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={elbowUp} onChange={(e) => setElbowUp(e.target.checked)} /> Elbow-up solution</label>
        <p className="mt-3 text-xs text-slate-500">Inverse kinematics is the hard direction: given where you want the tip, find the joint angles. For a 2-link arm the law of cosines gives a clean closed form — but with two solutions (elbow-up or elbow-down) and none at all when the target is out of reach. Click anywhere to set the target.</p>
      </div>}
      inspector={<div><Stat label="Joint 1" value={`${(t1 * 180 / Math.PI).toFixed(1)}°`} /><Stat label="Joint 2" value={`${(t2 * 180 / Math.PI).toFixed(1)}°`} /><Stat label="Target dist" value={d.toFixed(0)} /><Stat label="Reachable" value={reachable ? "yes" : "out of reach"} /></div>}
    ><canvas ref={canvasRef} width={480} height={380} onClick={(e) => { const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); const sx = 480 / r.width, sy = 380 / r.height; setTarget([(e.clientX - r.left) * sx - 240, -((e.clientY - r.top) * sy - 250)]); }} className="mx-auto h-auto max-w-full cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
