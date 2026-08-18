"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { heading: number; speed: number; currentDir: number; currentSpeed: number; hours: number }> = {
  "Slack water": { heading: 45, speed: 10, currentDir: 180, currentSpeed: 0, hours: 4 },
  "Strong beam set": { heading: 0, speed: 8, currentDir: 90, currentSpeed: 4, hours: 6 },
  "Following current": { heading: 0, speed: 10, currentDir: 0, currentSpeed: 3, hours: 5 },
  "Bucking a head current": { heading: 0, speed: 6, currentDir: 180, currentSpeed: 4, hours: 4 },
};

// Dead reckoning with current/wind drift.
export function DeadReckoningStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ heading, speed, currentDir, currentSpeed, hours }, update] = useShareableNumbers({ heading: 45, speed: 10, currentDir: 180, currentSpeed: 3, hours: 4 });

  const hr = heading * Math.PI / 180, cr = currentDir * Math.PI / 180;
  const vx = Math.sin(hr) * speed + Math.sin(cr) * currentSpeed; const vy = -(Math.cos(hr) * speed + Math.cos(cr) * currentSpeed);
  const intendedX = Math.sin(hr) * speed * hours, intendedY = -Math.cos(hr) * speed * hours;
  const actualX = vx * hours, actualY = vy * hours; const drift = Math.hypot(actualX - intendedX, actualY - intendedY);

  useEffect(() => {
    const W = 460, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#0b1a2e"; ctx.fillRect(0, 0, W, H);
    const cx = 120, cy = 260; const sc = 3;
    ctx.strokeStyle = "#1e3a5f"; for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
    // intended track (dashed)
    ctx.strokeStyle = "#64748b"; ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + intendedX * sc, cy + intendedY * sc); ctx.stroke(); ctx.setLineDash([]);
    // actual track
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + actualX * sc, cy + actualY * sc); ctx.stroke();
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fill(); ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(cx + actualX * sc, cy + actualY * sc, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("intended (dashed) vs actual track (drift from current)", 8, 18); ctx.fillStyle = "#bef264"; ctx.fillText("start", cx + 8, cy + 4);
  }, [heading, speed, currentDir, currentSpeed, hours]);

  const runDist = speed * hours;
  const driftPct = runDist > 0 ? (drift / runDist) * 100 : 0;
  const explain =
    currentSpeed === 0
      ? "With no current your actual track lands exactly on the intended track — dead reckoning is only exact when nothing sets you off course."
      : driftPct > 40
      ? `The current pushes you ${drift.toFixed(1)} nm off track, about ${driftPct.toFixed(0)}% of the distance run — when current speed is a big fraction of boat speed, ignoring set puts you badly off station.`
      : `Over ${hours} h the current carries you ${drift.toFixed(1)} nm off the intended track; steering a correction angle up-current would cancel most of this set.`;

  const code = `import math
hd, v, cd, cv, hrs = ${heading}, ${speed}, ${currentDir}, ${currentSpeed}, ${hours}
hr, cr = math.radians(hd), math.radians(cd)
vx = math.sin(hr)*v + math.sin(cr)*cv
vy = -(math.cos(hr)*v + math.cos(cr)*cv)
ix, iy = math.sin(hr)*v*hrs, -math.cos(hr)*v*hrs
ax, ay = vx*hrs, vy*hrs
drift = math.hypot(ax - ix, ay - iy)
print("made good", round(math.hypot(ax, ay), 1), "drift", round(drift, 1))`;

  return (
    <StudioChrome title="Dead Reckoning" tagline="navigating with drift"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Heading (°)" value={heading} min={0} max={360} step={5} onChange={(v) => update({ heading: v })} />
        <Slider label="Boat speed (kn)" value={speed} min={2} max={20} step={1} onChange={(v) => update({ speed: v })} />
        <Slider label="Current direction (°)" value={currentDir} min={0} max={360} step={5} onChange={(v) => update({ currentDir: v })} />
        <Slider label="Current speed (kn)" value={currentSpeed} min={0} max={8} step={0.5} onChange={(v) => update({ currentSpeed: v })} />
        <Slider label="Time (hours)" value={hours} min={1} max={12} step={0.5} onChange={(v) => update({ hours: v })} />
        <p className="mt-3 text-xs text-slate-500">Before GPS, navigators tracked position by dead reckoning: from a known start, add up each leg&apos;s heading and speed over time. But wind and current push you off your intended track, so the actual path drifts. The gap between where you meant to go and where you ended up is why sailors and pilots learn to correct for set and drift.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Distance made good" value={`${Math.hypot(actualX, actualY).toFixed(1)} nm`} /><Stat label="Drift" value={`${drift.toFixed(1)} nm`} /><Stat label="Effective speed" value={`${(Math.hypot(actualX, actualY) / hours).toFixed(1)} kn`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={460} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
