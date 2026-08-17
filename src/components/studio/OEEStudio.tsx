"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

export function OEEStudio() {
  const [availability, setAvailability] = useState(90);
  const [performance, setPerformance] = useState(95);
  const [quality, setQuality] = useState(99);

  const oee = availability / 100 * performance / 100 * quality / 100 * 100;
  const rating = oee >= 85 ? "world class" : oee >= 60 ? "typical" : oee >= 40 ? "low" : "poor";

  const Bar = ({ label, v, color }: { label: string; v: number; color: string }) => (
    <div className="mb-3"><div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">{label}</span><span className="font-bold text-slate-200">{v.toFixed(0)}%</span></div><div className="h-5 rounded bg-slate-800"><div className="h-5 rounded" style={{ width: `${v}%`, backgroundColor: color }} /></div></div>
  );

  return (
    <StudioChrome title="Overall Equipment Effectiveness" tagline="the manufacturing scorecard"
      controls={<div>
        <Slider label="Availability (%)" value={availability} min={40} max={100} step={1} onChange={setAvailability} />
        <Slider label="Performance (%)" value={performance} min={40} max={100} step={1} onChange={setPerformance} />
        <Slider label="Quality (%)" value={quality} min={80} max={100} step={0.5} onChange={setQuality} />
        <p className="mt-3 text-xs text-slate-500">OEE is the single number factories use to judge a machine, multiplying three losses: availability (uptime vs planned), performance (actual vs ideal speed), and quality (good parts vs total). Because they multiply, a chain of &quot;pretty good&quot; factors yields a mediocre result — 90% × 95% × 99% is only 85%. That 85% is the world-class benchmark.</p>
      </div>}
      inspector={<div><Stat label="OEE" value={`${oee.toFixed(1)}%`} /><Stat label="Rating" value={rating} /><Stat label="World-class" value="85%" /></div>}
    ><div className="p-6">
        <div className="mb-6 text-center"><div className="text-xs uppercase tracking-widest text-slate-500">Overall Equipment Effectiveness</div><div className="mt-2 text-6xl font-black" style={{ color: oee >= 85 ? "#a3e635" : oee >= 60 ? "#fbbf24" : "#ef4444" }}>{oee.toFixed(0)}%</div></div>
        <Bar label="Availability" v={availability} color="#22d3ee" />
        <Bar label="Performance" v={performance} color="#a3e635" />
        <Bar label="Quality" v={quality} color="#f472b6" />
        <div className="mt-3 text-center font-mono text-xs text-slate-500">{availability}% × {performance}% × {quality}% = {oee.toFixed(1)}%</div>
      </div></StudioChrome>
  );
}
