"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Basketball shot arc: optimal release angle.
export function ShotArcStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [distance, setDistance] = useState(6); // m
  const [releaseH, setReleaseH] = useState(2.1); // m
  const [angle, setAngle] = useState(50); // deg

  const rimH = 3.05, g = 9.81; const dh = rimH - releaseH; const th = angle * Math.PI / 180;
  // required speed to pass through rim at (distance, dh)
  const denom = 2 * Math.cos(th) ** 2 * (distance * Math.tan(th) - dh);
  const v2 = g * distance * distance / denom; const v = v2 > 0 ? Math.sqrt(v2) : NaN;
  // entry angle
  const vx = v * Math.cos(th), vy0 = v * Math.sin(th); const tHit = distance / vx; const vyHit = vy0 - g * tHit; const entryAngle = Math.atan2(-vyHit, vx) * 180 / Math.PI;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, sc = (W - 80) / (distance + 1);
    ctx.fillStyle = "#78716c"; ctx.fillRect(0, oy, W, 4);
    // hoop
    const hx = ox + distance * sc, hy = oy - rimH * 40; ctx.strokeStyle = "#f97316"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx - 12, hy); ctx.lineTo(hx + 12, hy); ctx.stroke(); ctx.strokeStyle = "#64748b"; ctx.beginPath(); ctx.moveTo(hx + 12, hy); ctx.lineTo(hx + 12, hy - 40); ctx.stroke();
    // trajectory
    if (!isNaN(v)) { ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy - releaseH * 40); for (let t = 0; t < 3; t += 0.02) { const x = v * Math.cos(th) * t, y = releaseH + v * Math.sin(th) * t - 0.5 * g * t * t; if (x > distance + 0.5) break; ctx.lineTo(ox + x * sc, oy - y * 40); } ctx.stroke(); }
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(ox, oy - releaseH * 40, 8, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(isNaN(v) ? "angle too low to reach rim" : `release ${angle}° → entry ${entryAngle.toFixed(0)}°`, 12, 20);
  }, [distance, releaseH, angle]);

  const good = entryAngle > 40 && entryAngle < 55;
  return (
    <StudioChrome title="Basketball Shot Arc" tagline="the physics of a jump shot"
      controls={<div>
        <Slider label="Distance to hoop (m)" value={distance} min={1} max={9} step={0.5} onChange={setDistance} />
        <Slider label="Release height (m)" value={releaseH} min={1.5} max={2.8} step={0.05} onChange={setReleaseH} />
        <Slider label="Launch angle (°)" value={angle} min={35} max={70} step={1} onChange={setAngle} />
        <p className="mt-3 text-xs text-slate-500">A basketball shot must arrive at the rim from above to have a chance of dropping in. Too flat and the ball meets the front rim; too steep and it needs excess speed. Coaches prize an entry angle around 43–47°, which maximizes the effective size of the hoop the ball sees. Higher release points let shorter players shoot flatter and still score.</p>
      </div>}
      inspector={<div><Stat label="Required speed" value={isNaN(v) ? "—" : `${v.toFixed(1)} m/s`} /><Stat label="Entry angle" value={isNaN(entryAngle) ? "—" : `${entryAngle.toFixed(0)}°`} /><Stat label="Arc quality" value={good ? "ideal" : entryAngle > 55 ? "too steep" : "too flat"} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
