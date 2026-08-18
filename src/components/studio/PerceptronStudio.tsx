"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const rnd = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;

const PRESETS: Record<string, { sep: number; lr: number }> = {
  "Separable": { sep: 2.0, lr: 0.1 },
  "Overlapping": { sep: 0.6, lr: 0.1 },
  "Fast learner": { sep: 1.5, lr: 0.4 },
  "Slow & steady": { sep: 1.5, lr: 0.02 },
};

export function PerceptronStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ sep, lr }, update] = useShareableNumbers({ sep: 1.4, lr: 0.1 });
  const pts: { x: number; y: number; c: number }[] = [];
  for (let i = 0; i < 40; i++) { const cls = i % 2; pts.push({ x: rnd(i * 3 + 1) * 2 - 1 + (cls ? sep : -sep) * 0.5, y: rnd(i * 7 + 2) * 2 - 1 + (cls ? sep : -sep) * 0.5, c: cls }); }
  const st = useRef({ w: [0.3, -0.2], b: 0, i: 0, acc: 0 });

  useEffect(() => {
    const s = st.current; s.w = [0.3, -0.2]; s.b = 0; s.i = 0;
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); let raf = 0;
    const loop = () => {
      // one update step
      for (let k = 0; k < 3; k++) { const p = pts[s.i % pts.length]; s.i++; const pred = (s.w[0] * p.x + s.w[1] * p.y + s.b) > 0 ? 1 : 0; const err = p.c - pred; s.w[0] += lr * err * p.x; s.w[1] += lr * err * p.y; s.b += lr * err; }
      let correct = 0; pts.forEach(p => { const pred = (s.w[0] * p.x + s.w[1] * p.y + s.b) > 0 ? 1 : 0; if (pred === p.c) correct++; }); s.acc = correct / pts.length;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const cx = W / 2, cy = H / 2, sc = 90;
      pts.forEach(p => { ctx.fillStyle = p.c ? "#22d3ee" : "#f472b6"; ctx.beginPath(); ctx.arc(cx + p.x * sc, cy - p.y * sc, 4, 0, Math.PI * 2); ctx.fill(); });
      // boundary w0 x + w1 y + b = 0 → y = -(w0 x + b)/w1
      if (Math.abs(s.w[1]) > 1e-3) { ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); const xL = -2.5, xR = 2.5; ctx.moveTo(cx + xL * sc, cy - (-(s.w[0] * xL + s.b) / s.w[1]) * sc); ctx.lineTo(cx + xR * sc, cy - (-(s.w[0] * xR + s.b) / s.w[1]) * sc); ctx.stroke(); }
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`perceptron learning a boundary · accuracy ${(s.acc * 100).toFixed(0)}%`, 12, 20);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [sep, lr]);

  const explain =
    sep < 0.8
      ? "The two clusters overlap heavily, so no straight line can cleanly separate them — the boundary keeps twitching and accuracy plateaus below 100%."
      : sep > 1.6
      ? "The classes are well separated, so the perceptron is guaranteed to find a dividing line and settle at 100% accuracy."
      : lr > 0.3
      ? "A high learning rate makes the boundary lurch on every mistake — it moves fast but overshoots and wobbles before settling."
      : "Moderate separation with a gentle learning rate: the boundary drifts steadily toward a clean split over many passes.";

  const code = `import numpy as np
rng = np.random.default_rng(0)
sep, lr = ${sep}, ${lr}
X, y = [], []
for i in range(40):
    cls = i % 2
    off = (sep if cls else -sep) * 0.5
    X.append([rng.random()*2-1 + off, rng.random()*2-1 + off]); y.append(cls)
w, b = np.array([0.3, -0.2]), 0.0
for _ in range(50):
    for xi, yi in zip(X, y):
        pred = 1 if np.dot(w, xi) + b > 0 else 0
        err = yi - pred
        w = w + lr*err*np.array(xi); b += lr*err
acc = np.mean([(1 if np.dot(w, xi) + b > 0 else 0) == yi for xi, yi in zip(X, y)])
print("weights", w, "bias", b, "accuracy", acc)`;

  return (
    <StudioChrome title="Perceptron" tagline="the simplest learning machine"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Class separation" value={sep} min={0.4} max={2.5} step={0.1} onChange={(v) => update({ sep: v })} />
        <Slider label="Learning rate" value={lr} min={0.01} max={0.5} step={0.01} onChange={(v) => update({ lr: v })} />
        <p className="mt-3 text-xs text-slate-500">The perceptron — the ancestor of every neural network — nudges a straight boundary each time it misclassifies a point. If the two classes are linearly separable it is guaranteed to find a dividing line; if they overlap, it never quite settles. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Model" value="linear classifier" />
        <Stat label="Converges?" value={sep > 1 ? "yes (separable)" : "struggles (overlap)"} />
        <Equation tex={`\\hat y=\\operatorname{step}(\\mathbf{w}\\cdot\\mathbf{x}+b),\\quad \\mathbf{w}\\leftarrow\\mathbf{w}+${lr.toFixed(2)}\\,(y-\\hat y)\\,\\mathbf{x}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
