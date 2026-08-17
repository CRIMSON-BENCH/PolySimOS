"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const TASKS = [5, 3, 8, 2, 6, 4, 7, 3]; // task times (s)

export function LineBalancingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [demand, setDemand] = useState(400); // units/shift
  const shiftSec = 8 * 3600;

  const takt = shiftSec / demand; const total = TASKS.reduce((a, b) => a + b, 0);
  const minStations = Math.ceil(total / takt);
  // greedy assign
  const stations: number[][] = []; let cur: number[] = [], curTime = 0;
  for (const t of TASKS) { if (curTime + t > takt && cur.length) { stations.push(cur); cur = []; curTime = 0; } cur.push(t); curTime += t; } if (cur.length) stations.push(cur);
  const efficiency = total / (stations.length * takt) * 100;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const bw = (W - 40) / stations.length; const scale = 200 / takt;
    stations.forEach((st, i) => { const x = 20 + i * bw; let y = H - 40; st.forEach((t, j) => { const h = t * scale; ctx.fillStyle = ["#22d3ee", "#a3e635", "#f472b6", "#fbbf24"][j % 4]; ctx.fillRect(x, y - h, bw - 8, h); ctx.strokeStyle = "#0b1220"; ctx.strokeRect(x, y - h, bw - 8, h); y -= h; });
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText(`S${i + 1}`, x + bw / 2 - 8, H - 24); const load = st.reduce((a, b) => a + b, 0); ctx.fillText(`${load}s`, x + bw / 2 - 8, H - 12); });
    // takt line
    ctx.strokeStyle = "#ef4444"; ctx.setLineDash([4, 4]); const ty = H - 40 - takt * scale; ctx.beginPath(); ctx.moveTo(10, ty); ctx.lineTo(W - 10, ty); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#fca5a5"; ctx.font = "11px sans-serif"; ctx.fillText(`takt = ${takt.toFixed(1)}s`, W - 90, ty - 4); ctx.fillStyle = "#94a3b8"; ctx.fillText("workload per station vs takt time", 12, 18);
  }, [demand]);

  return (
    <StudioChrome title="Assembly Line Balancing" tagline="takt time & stations"
      controls={<div>
        <Slider label="Demand (units/shift)" value={demand} min={100} max={2000} step={50} onChange={setDemand} />
        <p className="mt-3 text-xs text-slate-500">Takt time is the drumbeat of production — the shift length divided by demand, the pace each unit must be finished to meet the order. Tasks are grouped into stations so no station&apos;s work exceeds takt. The theoretical minimum stations is the total work over takt; balancing efficiency measures how little idle time is left. Higher demand shortens takt and needs more stations.</p>
      </div>}
      inspector={<div><Stat label="Takt time" value={`${takt.toFixed(1)} s`} /><Stat label="Min stations" value={String(minStations)} /><Stat label="Actual stations" value={String(stations.length)} /><Stat label="Line efficiency" value={`${efficiency.toFixed(0)}%`} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
