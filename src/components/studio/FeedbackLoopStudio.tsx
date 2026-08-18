"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function FeedbackLoopStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [gain, setGain] = useState(50), [plantDrift, setPlantDrift] = useState(30), [disturbance, setDisturbance] = useState(20);
  const G = gain; const closedGain = G / (1 + G);
  const openError = plantDrift; const closedError = plantDrift / (1 + G);
  const openDist = disturbance; const closedDist = disturbance / (1 + G);

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // block diagram
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(90, 110, 16, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = "#e2e8f0"; ctx.font = "14px sans-serif"; ctx.fillText("+", 84, 115); ctx.fillText("−", 84, 140);
    ctx.strokeStyle = "#22d3ee"; ctx.strokeRect(180, 88, 120, 44); ctx.fillStyle = "#94a3b8"; ctx.font = "12px sans-serif"; ctx.fillText(`plant × G=${G}`, 195, 114);
    ctx.strokeStyle = "#475569"; ctx.beginPath(); ctx.moveTo(20, 110); ctx.lineTo(74, 110); ctx.moveTo(106, 110); ctx.lineTo(180, 110); ctx.moveTo(300, 110); ctx.lineTo(420, 110); ctx.stroke();
    // feedback line
    ctx.strokeStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(360, 110); ctx.lineTo(360, 200); ctx.lineTo(90, 200); ctx.lineTo(90, 126); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("output", 380, 104); ctx.fillText("feedback compares output to setpoint", 90, 230);
    // error bars
    ctx.fillStyle = "#64748b"; ctx.fillRect(90, 270, openError * 3, 14); ctx.fillStyle = "#22d3ee"; ctx.fillRect(90, 290, closedError * 3, 14);
    ctx.fillStyle = "#e2e8f0"; ctx.fillText(`open-loop error ${openError.toFixed(0)}%`, 100 + openError * 3, 281); ctx.fillText(`closed-loop error ${closedError.toFixed(1)}%`, 100 + closedError * 3, 301);
  }, [gain, plantDrift, disturbance, G, openError, closedError]);

  return (
    <StudioChrome title="Feedback Loop" tagline="why feedback beats open-loop"
      controls={<div>
        <Slider label="Loop gain G" value={gain} min={1} max={200} step={1} onChange={setGain} />
        <Slider label="Plant drift (%)" value={plantDrift} min={0} max={60} step={1} onChange={setPlantDrift} />
        <Slider label="Disturbance (%)" value={disturbance} min={0} max={60} step={1} onChange={setDisturbance} />
        <p className="mt-3 text-xs text-slate-500">Feedback measures the output, compares it to the target, and corrects the difference. High loop gain shrinks both tracking error and the effect of disturbances by a factor of 1+G — which is why feedback control is everywhere, from thermostats to cruise control. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Closed-loop gain" value={closedGain.toFixed(3)} />
        <Stat label="Error reduction" value={`${(1 + G).toFixed(0)}×`} />
        <Stat label="Disturbance rejected" value={`${(100 - closedDist / openDist * 100).toFixed(0)}%`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
