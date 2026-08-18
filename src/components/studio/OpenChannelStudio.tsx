"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { b: number; y: number; S: number; n: number }> = {
  "Concrete canal": { b: 3, y: 1, S: 0.001, n: 0.013 },
  "Natural stream": { b: 4, y: 0.8, S: 0.005, n: 0.035 },
  "Steep spillway": { b: 2, y: 0.5, S: 0.02, n: 0.013 },
  "Wide flat river": { b: 8, y: 2, S: 0.0005, n: 0.03 },
};

export function OpenChannelStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ b, y, S, n }, update] = useShareableNumbers({ b: 3, y: 1, S: 0.001, n: 0.013 });
  const A = b * y, P = b + 2 * y, R = A / P;
  const V = (1 / n) * Math.pow(R, 2 / 3) * Math.sqrt(S);
  const Q = V * A;
  const Fr = V / Math.sqrt(9.81 * y);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, base = H - 60, bw = Math.min(360, b * 60), wh = Math.min(160, y * 90);
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - bw / 2 - 30, base - 120); ctx.lineTo(cx - bw / 2, base); ctx.lineTo(cx + bw / 2, base); ctx.lineTo(cx + bw / 2 + 30, base - 120); ctx.stroke();
    ctx.fillStyle = "#0e7490"; ctx.globalAlpha = 0.8; ctx.fillRect(cx - bw / 2, base - wh, bw, wh); ctx.globalAlpha = 1;
    ctx.strokeStyle = "#67e8f9"; ctx.beginPath(); ctx.moveTo(cx - bw / 2, base - wh); ctx.lineTo(cx + bw / 2, base - wh); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(Fr < 1 ? "subcritical (tranquil) flow" : "supercritical (rapid) flow", 20, 24); ctx.fillText(`Q = ${Q.toFixed(2)} m³/s`, 20, H - 16);
  }, [b, y, S, n, Q, Fr]);

  const explain = Fr < 0.8
    ? `Froude number ${Fr.toFixed(2)} is below 1: the flow is subcritical (deep, slow, tranquil), so disturbances can travel upstream and downstream depth controls the flow.`
    : Fr > 1.2
    ? `Froude number ${Fr.toFixed(2)} is above 1: the flow is supercritical (shallow, fast) — slow it down and a hydraulic jump forms as it drops back to subcritical.`
    : `Froude number ${Fr.toFixed(2)} sits near 1 (critical flow), where specific energy is at a minimum and small changes in slope or depth cause large swings in the water surface.`;

  const code = `import math
b, y, S, n = ${b}, ${y}, ${S}, ${n}
A = b*y; P = b + 2*y; R = A/P
V = (1/n) * R**(2/3) * math.sqrt(S)
Q = V*A; Fr = V/math.sqrt(9.81*y)
print("V", V, "Q", Q, "Fr", Fr)`;

  return (
    <StudioChrome title="Open-Channel Flow (Manning)" tagline="rivers, canals & storm drains"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Channel width b (m)" value={b} min={0.5} max={8} step={0.5} onChange={(v) => update({ b: v })} />
        <Slider label="Water depth y (m)" value={y} min={0.1} max={3} step={0.1} onChange={(v) => update({ y: v })} />
        <Slider label="Bed slope S" value={S} min={0.0001} max={0.02} step={0.0001} onChange={(v) => update({ S: v })} />
        <Slider label="Manning's n" value={n} min={0.01} max={0.05} step={0.001} onChange={(v) => update({ n: v })} />
        <p className="mt-3 text-xs text-slate-500">Manning’s equation predicts flow in an open channel: V = (1/n)·R^⅔·√S, where R is the hydraulic radius and n the roughness. The Froude number tells you whether flow is tranquil (Fr &lt; 1) or rapid. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Velocity" value={`${V.toFixed(2)} m/s`} />
        <Stat label="Flow rate Q" value={`${Q.toFixed(2)} m³/s`} />
        <Stat label="Hydraulic radius" value={`${R.toFixed(3)} m`} />
        <Stat label="Froude number" value={Fr.toFixed(2)} />
        <Equation tex={`Q = \\frac{1}{n} A R^{2/3} S^{1/2} = \\frac{1}{${n}} \\times ${A.toFixed(2)} \\times ${R.toFixed(3)}^{2/3} \\times ${S}^{1/2} = ${Q.toFixed(2)}\\ \\text{m}^3/\\text{s}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
