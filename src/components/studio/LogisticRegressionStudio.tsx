"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function LogisticRegressionStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(3), [b, setB] = useState(-1.5), [thresh, setThresh] = useState(0.5);
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-(w * x + b)));
  const boundary = (Math.log(thresh / (1 - thresh)) - b) / w;

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 40, pw = W - 60, ph = H - 70, xmin = -2, xmax = 4;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // data points (0 low x, 1 high x)
    [[-1.5, 0], [-0.9, 0], [-0.4, 0], [0.2, 0], [0.6, 1], [1.1, 0], [1.4, 1], [1.9, 1], [2.4, 1], [3.1, 1]].forEach(([x, y]) => { ctx.fillStyle = y ? "#22d3ee" : "#f472b6"; ctx.beginPath(); ctx.arc(ox + (x - xmin) / (xmax - xmin) * pw, oy - (y as number) * ph, 5, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const x = xmin + (xmax - xmin) * i / pw; const y = oy - sigmoid(x) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    const bx = ox + (boundary - xmin) / (xmax - xmin) * pw; ctx.strokeStyle = "#fbbf24"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(bx, oy); ctx.lineTo(bx, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("logistic curve maps input → probability", ox + 6, oy - ph + 12); ctx.fillText("decision boundary", bx + 4, 40);
  }, [w, b, thresh, boundary]);

  return (
    <StudioChrome title="Logistic Regression" tagline="probability from a straight line"
      controls={<div>
        <Slider label="Weight w (steepness)" value={w} min={0.5} max={8} step={0.5} onChange={setW} />
        <Slider label="Bias b (shift)" value={b} min={-5} max={2} step={0.25} onChange={setB} />
        <Slider label="Decision threshold" value={thresh} min={0.1} max={0.9} step={0.05} onChange={setThresh} />
        <p className="mt-3 text-xs text-slate-500">Logistic regression squashes a linear score through the sigmoid to output a probability between 0 and 1. Predictions above the threshold become one class, below it the other. Raising the weight sharpens the S-curve into a harder decision. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Decision boundary at x" value={boundary.toFixed(2)} />
        <Stat label="P(class 1 | x=1)" value={sigmoid(1).toFixed(2)} />
        <Stat label="Threshold" value={thresh.toFixed(2)} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
