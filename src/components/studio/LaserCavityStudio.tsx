"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { pump: number; loss: number }> = {
  "Below threshold": { pump: 2, loss: 4 },
  "Right at threshold": { pump: 4, loss: 4 },
  "Efficient laser": { pump: 10, loss: 2 },
  "Lossy cavity": { pump: 8, loss: 7 },
};

export function LaserCavityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ pump, loss }, update] = useShareableNumbers({ pump: 4, loss: 2 });

  const threshold = loss; const output = pump > threshold ? (pump - threshold) * 0.8 : 0; const lasing = pump > threshold;

  useEffect(() => {
    const W = 500, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const pMax = 12;
    const X = (p: number) => ox + (p / pMax) * pw; const Y = (o: number) => oy - (o / 8) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // output vs pump (kinked at threshold)
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(threshold), Y(0)); ctx.lineTo(X(pMax), Y((pMax - threshold) * 0.8)); ctx.stroke();
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(threshold), oy); ctx.lineTo(X(threshold), oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(pump), Y(output), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("output power vs pump", ox + 6, oy - ph + 12); ctx.fillStyle = "#bef264"; ctx.fillText("threshold", X(threshold) + 3, oy - ph + 26); ctx.fillStyle = "#94a3b8"; ctx.fillText("pump →", ox + pw - 46, oy + 16);
  }, [pump, loss]);

  const explain =
    !lasing
      ? "Pump sits below the loss line, so gain cannot overcome cavity losses — the medium only fluoresces faintly, like a lamp, with no coherent beam."
      : pump - threshold < 1
      ? "You are just above threshold: stimulated emission has switched on but output is still weak — small pump changes here swing the beam dramatically."
      : "Well above threshold, output climbs almost linearly with pump; the slope (~0.8 here) is the slope efficiency, and lowering cavity loss shifts the whole knee left.";

  const code = `pump, loss = ${pump}, ${loss}
threshold = loss                              # lasing begins when gain beats loss
output = (pump - threshold) * 0.8 if pump > threshold else 0.0
state = "lasing" if pump > threshold else "below threshold"
print(state, "| output power", round(output, 2))`;

  return (
    <StudioChrome title="Laser Cavity" tagline="gain, loss & threshold"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Pump power" value={pump} min={0} max={12} step={0.2} onChange={(v) => update({ pump: v })} />
        <Slider label="Cavity loss" value={loss} min={0.5} max={8} step={0.2} onChange={(v) => update({ loss: v })} />
        <p className="mt-3 text-xs text-slate-500">A laser fires only when the optical gain from the pumped medium exceeds the losses of the mirror cavity. Below that threshold it merely glows like a lamp; above it, stimulated emission takes over and output rises steeply and linearly with pump power. This sharp threshold is the defining signature of laser action.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Threshold" value={threshold.toFixed(1)} /><Stat label="Output power" value={output.toFixed(2)} /><Stat label="State" value={lasing ? "lasing" : "below threshold"} /><Equation tex={`P_{\\mathrm{out}} = 0.8\\,\\max(P_{\\mathrm{pump}} - P_{\\mathrm{th}},\\,0) = 0.8\\,\\max(${pump} - ${threshold.toFixed(1)},\\,0) = ${output.toFixed(2)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
