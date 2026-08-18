"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { availability: number; performance: number; quality: number }> = {
  "World class": { availability: 90, performance: 95, quality: 99 },
  "Typical plant": { availability: 85, performance: 88, quality: 96 },
  "Downtime hit": { availability: 60, performance: 95, quality: 99 },
  "Quality crisis": { availability: 90, performance: 95, quality: 85 },
};

export function OEEStudio() {
  const [{ availability, performance, quality }, update] = useShareableNumbers({
    availability: 90,
    performance: 95,
    quality: 99,
  });

  const oee = availability / 100 * performance / 100 * quality / 100 * 100;
  const rating = oee >= 85 ? "world class" : oee >= 60 ? "typical" : oee >= 40 ? "low" : "poor";

  const worst = Math.min(availability, performance, quality);
  const worstName = worst === availability ? "availability" : worst === performance ? "performance" : "quality";
  const explain =
    oee >= 85
      ? "All three factors are strong, so their product clears the 85% world-class bar — there is no single loss dragging the machine down."
      : `${worstName} is the weakest link at ${worst}%; because the three factors multiply, lifting the lowest one moves OEE far more than polishing a factor that is already high.`;

  const code = `availability, performance, quality = ${availability}, ${performance}, ${quality}   # percent
oee = (availability/100) * (performance/100) * (quality/100) * 100
print(f"OEE = {oee:.1f}%  (world-class benchmark = 85%)")`;

  const Bar = ({ label, v, color }: { label: string; v: number; color: string }) => (
    <div className="mb-3"><div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">{label}</span><span className="font-bold text-slate-200">{v.toFixed(0)}%</span></div><div className="h-5 rounded bg-slate-800"><div className="h-5 rounded" style={{ width: `${v}%`, backgroundColor: color }} /></div></div>
  );

  return (
    <StudioChrome title="Overall Equipment Effectiveness" tagline="the manufacturing scorecard"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Availability (%)" value={availability} min={40} max={100} step={1} onChange={(v) => update({ availability: v })} />
        <Slider label="Performance (%)" value={performance} min={40} max={100} step={1} onChange={(v) => update({ performance: v })} />
        <Slider label="Quality (%)" value={quality} min={80} max={100} step={0.5} onChange={(v) => update({ quality: v })} />
        <p className="mt-3 text-xs text-slate-500">OEE is the single number factories use to judge a machine, multiplying three losses: availability (uptime vs planned), performance (actual vs ideal speed), and quality (good parts vs total). Because they multiply, a chain of &quot;pretty good&quot; factors yields a mediocre result — 90% × 95% × 99% is only 85%. That 85% is the world-class benchmark.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="OEE" value={`${oee.toFixed(1)}%`} /><Stat label="Rating" value={rating} /><Stat label="World-class" value="85%" /><ExplainResult text={explain} /></div>}
    ><div className="p-6">
        <div className="mb-6 text-center"><div className="text-xs uppercase tracking-widest text-slate-500">Overall Equipment Effectiveness</div><div className="mt-2 text-6xl font-black" style={{ color: oee >= 85 ? "#a3e635" : oee >= 60 ? "#fbbf24" : "#ef4444" }}>{oee.toFixed(0)}%</div></div>
        <Bar label="Availability" v={availability} color="#22d3ee" />
        <Bar label="Performance" v={performance} color="#a3e635" />
        <Bar label="Quality" v={quality} color="#f472b6" />
        <div className="mt-3 text-center font-mono text-xs text-slate-500">{availability}% × {performance}% × {quality}% = {oee.toFixed(1)}%</div>
      </div></StudioChrome>
  );
}
