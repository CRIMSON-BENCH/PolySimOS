"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const TASKS = [5, 3, 8, 2, 6, 4, 7, 3]; // task times (s)

const PRESETS: Record<string, { demand: number }> = {
  "Low volume": { demand: 150 },
  "Steady 400": { demand: 400 },
  "High demand": { demand: 1000 },
  "Rush 1800": { demand: 1800 },
};

export function LineBalancingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ demand }, update] = useShareableNumbers({ demand: 400 }); // units/shift
  const shiftSec = 8 * 3600;

  const takt = shiftSec / demand; const total = TASKS.reduce((a, b) => a + b, 0);
  const minStations = Math.ceil(total / takt);
  // greedy assign
  const stations: number[][] = []; let cur: number[] = [], curTime = 0;
  for (const t of TASKS) { if (curTime + t > takt && cur.length) { stations.push(cur); cur = []; curTime = 0; } cur.push(t); curTime += t; } if (cur.length) stations.push(cur);
  const efficiency = total / (stations.length * takt) * 100;

  useEffect(() => {
    const W = 520, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const bw = (W - 40) / stations.length; const scale = 200 / takt;
    stations.forEach((st, i) => { const x = 20 + i * bw; let y = H - 40; st.forEach((t, j) => { const h = t * scale; ctx.fillStyle = ["#22d3ee", "#a3e635", "#f472b6", "#fbbf24"][j % 4]; ctx.fillRect(x, y - h, bw - 8, h); ctx.strokeStyle = "#0b1220"; ctx.strokeRect(x, y - h, bw - 8, h); y -= h; });
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText(`S${i + 1}`, x + bw / 2 - 8, H - 24); const load = st.reduce((a, b) => a + b, 0); ctx.fillText(`${load}s`, x + bw / 2 - 8, H - 12); });
    // takt line
    ctx.strokeStyle = "#ef4444"; ctx.setLineDash([4, 4]); const ty = H - 40 - takt * scale; ctx.beginPath(); ctx.moveTo(10, ty); ctx.lineTo(W - 10, ty); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#fca5a5"; ctx.font = "11px sans-serif"; ctx.fillText(`takt = ${takt.toFixed(1)}s`, W - 90, ty - 4); ctx.fillStyle = "#94a3b8"; ctx.fillText("workload per station vs takt time", 12, 18);
  }, [demand]);

  const explain =
    efficiency >= 90
      ? `At ${demand} units/shift the line is ${efficiency.toFixed(0)}% balanced — stations are nearly full, so almost no labor is idle, but any extra demand tips a station past takt and forces another one.`
      : stations.length > minStations
      ? `The greedy grouping uses ${stations.length} stations where the theoretical minimum is ${minStations}; that gap is exactly why efficiency sits at ${efficiency.toFixed(0)}% — resequencing tasks could reclaim the idle time.`
      : `Takt time is ${takt.toFixed(1)}s, so every unit must clear a station within that window; ${minStations} stations suffice here, leaving about ${(100 - efficiency).toFixed(0)}% idle slack.`;

  const code = `TASKS = [5, 3, 8, 2, 6, 4, 7, 3]   # task times (s)
demand = ${demand}                     # units/shift
shift_sec = 8 * 3600
takt = shift_sec / demand
total = sum(TASKS)
min_stations = -(-total // takt)       # ceil(total / takt)
stations, cur, t = [], [], 0
for task in TASKS:
    if t + task > takt and cur:
        stations.append(cur); cur, t = [], 0
    cur.append(task); t += task
if cur: stations.append(cur)
eff = total / (len(stations) * takt) * 100
print("takt", takt, "stations", len(stations), "eff%", eff)`;

  return (
    <StudioChrome title="Assembly Line Balancing" tagline="takt time & stations"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Demand (units/shift)" value={demand} min={100} max={2000} step={50} onChange={(v) => update({ demand: v })} />
        <p className="mt-3 text-xs text-slate-500">Takt time is the drumbeat of production — the shift length divided by demand, the pace each unit must be finished to meet the order. Tasks are grouped into stations so no station&apos;s work exceeds takt. The theoretical minimum stations is the total work over takt; balancing efficiency measures how little idle time is left. Higher demand shortens takt and needs more stations.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Takt time" value={`${takt.toFixed(1)} s`} /><Stat label="Min stations" value={String(minStations)} /><Stat label="Actual stations" value={String(stations.length)} /><Stat label="Line efficiency" value={`${efficiency.toFixed(0)}%`} /><Equation tex={`T_t = \\dfrac{${shiftSec}}{${demand}} = ${takt.toFixed(1)}\\,\\text{s},\\quad \\eta = \\dfrac{${total}}{${stations.length}\\times ${takt.toFixed(1)}} = ${efficiency.toFixed(0)}\\%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
