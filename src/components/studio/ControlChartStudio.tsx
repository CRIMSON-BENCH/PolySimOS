"use client";

import { useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { shift: number }> = {
  "In control": { shift: 0 },
  "Slow drift (+3)": { shift: 3 },
  "Big shift (+6)": { shift: 6 },
  "Downward shift (−4)": { shift: -4 },
};

// SPC X-bar control chart with a process shift.
export function ControlChartStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ shift }, update] = useShareableNumbers({ shift: 0 });
  const data = useRef<number[]>([]);
  const [violations, setViolations] = useState(0);
  const shiftRef = useRef(shift); shiftRef.current = shift;
  const rngRef = useRef(88);
  const frameRef = useRef(0);

  const target = 50, sigma = 2; const UCL = target + 3 * sigma, LCL = target - 3 * sigma;
  const reset = () => { data.current = []; setViolations(0); };

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rnd = () => { rngRef.current = (rngRef.current * 1664525 + 1013904223) >>> 0; return rngRef.current / 4294967296; };
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    for (let si = 0; si < steps; si++) {
      frameRef.current++; if (frameRef.current % 25 === 0) { const val = target + shiftRef.current + gauss() * sigma; data.current.push(val); if (data.current.length > 40) data.current.shift(); }
    }
    let viol = 0; data.current.forEach((d) => { if (d > UCL || d < LCL) viol++; }); setViolations(viol);
    const W = 540, H = 300; const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, pw = W - 60, ph = H - 60, oy = H - 30; const Y = (v: number) => oy - ((v - 40) / 20) * ph;
    ctx.strokeStyle = "#a3e635"; ctx.beginPath(); ctx.moveTo(ox, Y(target)); ctx.lineTo(ox + pw, Y(target)); ctx.stroke();
    ctx.strokeStyle = "#ef4444"; ctx.setLineDash([4, 4]); [UCL, LCL].forEach((l) => { ctx.beginPath(); ctx.moveTo(ox, Y(l)); ctx.lineTo(ox + pw, Y(l)); ctx.stroke(); }); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5; ctx.beginPath(); data.current.forEach((d, i) => { const x = ox + (i / 40) * pw; i ? ctx.lineTo(x, Y(d)) : ctx.moveTo(x, Y(d)); }); ctx.stroke();
    data.current.forEach((d, i) => { const x = ox + (i / 40) * pw; const out = d > UCL || d < LCL; ctx.fillStyle = out ? "#f472b6" : "#22d3ee"; ctx.beginPath(); ctx.arc(x, Y(d), out ? 5 : 3, 0, 7); ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("X-bar control chart", ox + 6, 18); ctx.fillStyle = "#fca5a5"; ctx.fillText("UCL", ox + pw - 26, Y(UCL) - 4); ctx.fillText("LCL", ox + pw - 26, Y(LCL) + 12);
  };

  const t = useTransport(frame);

  const shiftSigma = shift / sigma;
  const explain = shift === 0
    ? `The process is centered on target: points scatter randomly inside the ±3σ limits, so every point is just noise — reacting now would only add variation (tampering).`
    : Math.abs(shift) < 2 * sigma
    ? `A ${shiftSigma.toFixed(1)}σ shift is small next to the ±3σ band, so most points still fall inside — a Shewhart chart is deliberately slow to flag shifts under ~1.5σ, and run rules would catch this sooner than a single breach.`
    : `A ${shiftSigma.toFixed(1)}σ shift drags the mean near or past a control limit, so points breach often — the clear out-of-control signal SPC is built to catch.`;

  const code = `import numpy as np
target, sigma, shift = ${target}, ${sigma}, ${shift}
UCL, LCL = target + 3 * sigma, target - 3 * sigma
pts = target + shift + np.random.normal(0, sigma, 40)
viol = int(((pts > UCL) | (pts < LCL)).sum())
print(f"UCL={UCL} LCL={LCL}  out-of-control points: {viol}/40")`;

  return (
    <StudioChrome title="SPC Control Chart" tagline="in control or not?"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Process shift" value={shift} min={-8} max={8} step={0.5} onChange={(v) => update({ shift: v })} />
        <p className="mt-3 text-xs text-slate-500">Statistical process control watches a process over time against control limits set at three standard deviations from the target. Points inside are normal random variation — leave them alone. A point beyond the limits, or a run trending one way, signals a real change worth investigating. Nudge the process shift and watch points breach the limits.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Center line" value={String(target)} /><Stat label="Control limits" value={`±3σ (${LCL}–${UCL})`} /><Stat label="Out of control" value={String(violations)} /><Equation tex={`\\text{UCL},\\text{LCL} = \\mu \\pm 3\\sigma = ${target} \\pm 3(${sigma}) = ${UCL},\\,${LCL}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
