"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const rnd = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;

export function DecisionTreeStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [splitX, setSplitX] = useState(0.5), [splitY, setSplitY] = useState(0.5), [depth, setDepth] = useState(2);
  const pts: { x: number; y: number; c: number }[] = [];
  for (let i = 0; i < 80; i++) { const x = rnd(i * 3 + 1), y = rnd(i * 7 + 2); const cls = (x < 0.5 ? (y < 0.5 ? 0 : 1) : (y < 0.5 ? 1 : 0)); pts.push({ x, y, c: cls }); }
  const classify = (x: number, y: number) => depth === 1 ? (x < splitX ? 0 : 1) : (x < splitX ? (y < splitY ? 0 : 1) : (y < splitY ? 1 : 0));
  const acc = pts.filter(p => classify(p.x, p.y) === p.c).length / pts.length;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const gx = 60, gy = 30, gw = W - 100, gh = H - 60, cols = ["#f472b6", "#22d3ee"];
    const res = 30; for (let i = 0; i < res; i++) for (let j = 0; j < res; j++) { const cls = classify(i / res, j / res); ctx.fillStyle = cols[cls] + "22"; ctx.fillRect(gx + i / res * gw, gy + j / res * gh, gw / res + 1, gh / res + 1); }
    // split lines
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx + splitX * gw, gy); ctx.lineTo(gx + splitX * gw, gy + gh); ctx.stroke();
    if (depth > 1) { ctx.beginPath(); ctx.moveTo(gx, gy + splitY * gh); ctx.lineTo(gx + gw, gy + splitY * gh); ctx.stroke(); }
    pts.forEach(p => { ctx.fillStyle = cols[p.c]; ctx.beginPath(); ctx.arc(gx + p.x * gw, gy + p.y * gh, 3.5, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`axis-aligned splits · accuracy ${(acc * 100).toFixed(0)}%`, 12, 20);
  }, [splitX, splitY, depth, acc]);

  return (
    <StudioChrome title="Decision Tree Splits" tagline="carving space into boxes"
      controls={<div>
        <Slider label="Depth" value={depth} min={1} max={2} step={1} onChange={setDepth} />
        <Slider label="Split on X" value={splitX} min={0.1} max={0.9} step={0.02} onChange={setSplitX} />
        <Slider label="Split on Y" value={splitY} min={0.1} max={0.9} step={0.02} onChange={setSplitY} />
        <p className="mt-3 text-xs text-slate-500">A decision tree repeatedly splits the feature space along one axis at a time, carving it into rectangular regions each assigned a class. Deeper trees fit more complex boundaries but risk overfitting. Tune the splits to separate the two colors. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Accuracy" value={`${(acc * 100).toFixed(0)}%`} />
        <Stat label="Regions" value={depth === 1 ? "2" : "4"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
