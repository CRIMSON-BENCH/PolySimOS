"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { distance: number; releaseH: number; angle: number }> = {
  "Free throw": { distance: 4.5, releaseH: 2.1, angle: 52 },
  "Mid-range": { distance: 6, releaseH: 2.2, angle: 50 },
  "Three-pointer": { distance: 7, releaseH: 2.3, angle: 48 },
  "Deep three": { distance: 8.5, releaseH: 2.3, angle: 45 },
};

// Basketball shot arc: optimal release angle.
export function ShotArcStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ distance, releaseH, angle }, update] = useShareableNumbers({ distance: 6, releaseH: 2.1, angle: 50 });

  const rimH = 3.05, g = 9.81; const dh = rimH - releaseH; const th = angle * Math.PI / 180;
  // required speed to pass through rim at (distance, dh)
  const denom = 2 * Math.cos(th) ** 2 * (distance * Math.tan(th) - dh);
  const v2 = g * distance * distance / denom; const v = v2 > 0 ? Math.sqrt(v2) : NaN;
  // entry angle
  const vx = v * Math.cos(th), vy0 = v * Math.sin(th); const tHit = distance / vx; const vyHit = vy0 - g * tHit; const entryAngle = Math.atan2(-vyHit, vx) * 180 / Math.PI;

  useEffect(() => {
    const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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

  const explain =
    isNaN(v)
      ? `At ${angle}° the arc is too flat to clear the rim from ${distance} m — raise the launch angle or step closer.`
      : good
      ? `Clean shot: a ${entryAngle.toFixed(0)}° entry sits in the ideal 40–55° window, so the ball sees the widest effective hoop at ${v.toFixed(1)} m/s.`
      : entryAngle > 55
      ? `Steep ${entryAngle.toFixed(0)}° entry needs ${v.toFixed(1)} m/s and drops almost straight down — forgiving on aim but demanding on touch.`
      : `Flat ${entryAngle.toFixed(0)}° entry from ${distance} m risks the front rim; a little more arc would open up the target.`;

  const code = `import numpy as np
distance, releaseH, angle = ${distance}, ${releaseH}, ${angle}
rimH, g = 3.05, 9.81
th = np.radians(angle); dh = rimH - releaseH
denom = 2 * np.cos(th)**2 * (distance * np.tan(th) - dh)
v = np.sqrt(g * distance**2 / denom)
tHit = distance / (v * np.cos(th)); vyHit = v * np.sin(th) - g * tHit
entry = np.degrees(np.arctan2(-vyHit, v * np.cos(th)))
print("required speed", round(v, 2), "entry angle", round(entry, 1))`;
  return (
    <StudioChrome title="Basketball Shot Arc" tagline="the physics of a jump shot"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Distance to hoop (m)" value={distance} min={1} max={9} step={0.5} onChange={(n) => update({ distance: n })} />
        <Slider label="Release height (m)" value={releaseH} min={1.5} max={2.8} step={0.05} onChange={(n) => update({ releaseH: n })} />
        <Slider label="Launch angle (°)" value={angle} min={35} max={70} step={1} onChange={(n) => update({ angle: n })} />
        <p className="mt-3 text-xs text-slate-500">A basketball shot must arrive at the rim from above to have a chance of dropping in. Too flat and the ball meets the front rim; too steep and it needs excess speed. Coaches prize an entry angle around 43–47°, which maximizes the effective size of the hoop the ball sees. Higher release points let shorter players shoot flatter and still score.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Required speed" value={isNaN(v) ? "—" : `${v.toFixed(1)} m/s`} /><Stat label="Entry angle" value={isNaN(entryAngle) ? "—" : `${entryAngle.toFixed(0)}°`} /><Stat label="Arc quality" value={good ? "ideal" : entryAngle > 55 ? "too steep" : "too flat"} /><Equation tex={`v=\\sqrt{\\dfrac{g\\,d^{2}}{2\\cos^{2}\\theta\\,(d\\tan\\theta-\\Delta h)}},\\quad \\theta=${angle}^\\circ,\\ \\theta_{\\text{entry}}\\approx ${isNaN(entryAngle) ? "-" : entryAngle.toFixed(0)}^\\circ`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
