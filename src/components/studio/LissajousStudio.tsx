"use client";

import { useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 600, H = 480;

const PRESETS: Record<string, { a: number; b: number; delta: number }> = {
  "Circle 1:1": { a: 1, b: 1, delta: 0.5 },
  "Figure-8 (1:2)": { a: 1, b: 2, delta: 0.5 },
  "Pretzel 3:2": { a: 3, b: 2, delta: 0.5 },
  "Weave 5:4": { a: 5, b: 4, delta: 0.25 },
};

export function LissajousStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const [{ a, b, delta }, update] = useShareableNumbers({ a: 3, b: 2, delta: 0.5 });
  const aRef = useRef(a); aRef.current = a;
  const bRef = useRef(b); bRef.current = b;
  const deltaRef = useRef(delta); deltaRef.current = delta;

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H);
    const a = aRef.current, b = bRef.current, delta = deltaRef.current;
    const R = 200, cx = W / 2, cy = H / 2;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(34,211,238,0.7)"; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let p = 0; p <= 1000; p++) { const tt = (p / 1000) * Math.PI * 2; const x = cx + R * Math.sin(a * tt + delta * Math.PI), y = cy + R * Math.sin(b * tt); p ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    tRef.current += 0.02 * steps;
    const dx = cx + R * Math.sin(a * tRef.current + delta * Math.PI), dy = cy + R * Math.sin(b * tRef.current);
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(dx, dy, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "13px system-ui"; ctx.fillText(`x = sin(${a}t + ${delta.toFixed(1)}π),  y = sin(${b}t)`, 16, 26);
  };

  const t = useTransport(frame);

  const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
  const g = gcd(a, b) || 1;
  const ra = a / g, rb = b / g;
  const explain = a === b
    ? `Equal frequencies trace an ellipse — a circle when δ is near 0.5π and a collapsing diagonal line as δ approaches 0.`
    : `Reduced to ${ra}:${rb}, the curve closes into a stable ${ra}-by-${rb} lobe figure; because the ratio is a whole-number fraction it never drifts, and the phase δ only morphs and rotates that fixed pattern.`;

  const code = `import numpy as np
import matplotlib.pyplot as plt
a, b, delta = ${a}, ${b}, ${delta}
t = np.linspace(0, 2*np.pi, 1000)
x = np.sin(a*t + delta*np.pi)
y = np.sin(b*t)
plt.plot(x, y); plt.axis("equal"); plt.show()`;

  return (
    <StudioChrome title="Lissajous Curves" tagline="harmonic motion in two axes"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">Combine two perpendicular sine waves. The frequency ratio a:b sets the number of lobes; the phase δ morphs the shape — the patterns you see on an oscilloscope.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Frequency a (x)" value={a} min={1} max={9} step={1} onChange={(v) => update({ a: v })} />
        <Slider label="Frequency b (y)" value={b} min={1} max={9} step={1} onChange={(v) => update({ b: v })} />
        <Slider label="Phase δ (×π)" value={delta} min={0} max={2} step={0.05} onChange={(v) => update({ delta: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Ratio" value={`${a}:${b}`} /><Stat label="Phase" value={`${delta.toFixed(2)}π`} /><Stat label="Closed" value={Number.isInteger(a / b) || Number.isInteger(b / a) ? "yes" : "rational"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
