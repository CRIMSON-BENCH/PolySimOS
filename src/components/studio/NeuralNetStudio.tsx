"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { useShareableNumbers } from "@/lib/studioKit";

type DS = "circle" | "xor" | "spiral";

const PRESETS: Record<string, { hidden: number; lr: number }> = {
  "Gentle (lr 0.03)": { hidden: 8, lr: 0.03 },
  "Balanced": { hidden: 8, lr: 0.1 },
  "Aggressive (lr 0.4)": { hidden: 6, lr: 0.4 },
  "Wide (16 units)": { hidden: 16, lr: 0.1 },
};

function makeData(kind: DS): [number, number, number][] {
  const pts: [number, number, number][] = [];
  let s = 12345; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 160; i++) {
    const x = rnd() * 2 - 1, y = rnd() * 2 - 1; let label = 0;
    if (kind === "circle") label = x * x + y * y < 0.35 ? 1 : 0;
    else if (kind === "xor") label = x * y > 0 ? 1 : 0;
    else { const r = Math.sqrt(x * x + y * y), a = Math.atan2(y, x); label = Math.sin(a * 2 + r * 6) > 0 ? 1 : 0; }
    pts.push([x, y, label]);
  }
  return pts;
}

export function NeuralNetStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataset, setDataset] = useState<DS>("circle");
  const [{ hidden, lr }, update] = useShareableNumbers({ hidden: 8, lr: 0.1 });
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState(0);
  const net = useRef<{ W1: number[][]; b1: number[]; W2: number[]; b2: number } | null>(null);
  const data = useRef<[number, number, number][]>([]);
  const lrRef = useRef(lr); lrRef.current = lr;

  const init = () => {
    const H = Math.round(hidden); let s = 999; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 - 0.5; };
    net.current = { W1: Array.from({ length: H }, () => [rnd(), rnd()]), b1: Array.from({ length: H }, () => 0), W2: Array.from({ length: H }, () => rnd()), b2: 0 };
    data.current = makeData(dataset); setEpoch(0);
  };
  useEffect(init, [dataset, hidden]);

  const th = (x: number) => Math.tanh(x); const sig = (x: number) => 1 / (1 + Math.exp(-x));
  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const n = net.current!; const H = n.W1.length; const lrr = lrRef.current;
    for (let fr = 0; fr < steps; fr++) for (let iter = 0; iter < 20; iter++) {
      let L = 0;
      for (const [x, y, t] of data.current) {
        const z1 = n.W1.map((w, j) => w[0] * x + w[1] * y + n.b1[j]); const a1 = z1.map(th);
        const z2 = a1.reduce((s2, a, j) => s2 + a * n.W2[j], n.b2); const out = sig(z2);
        L += -(t * Math.log(out + 1e-9) + (1 - t) * Math.log(1 - out + 1e-9));
        const dz2 = out - t;
        for (let j = 0; j < H; j++) { const dW2 = dz2 * a1[j]; const da1 = dz2 * n.W2[j]; const dz1 = da1 * (1 - a1[j] * a1[j]);
          n.W2[j] -= lrr * dW2; n.W1[j][0] -= lrr * dz1 * x; n.W1[j][1] -= lrr * dz1 * y; n.b1[j] -= lrr * dz1; }
        n.b2 -= lrr * dz2;
      }
      setLoss(L / data.current.length);
    }
    setEpoch((e) => e + 20 * steps);
    // render decision boundary
    const ctx = canvas.getContext("2d")!; const W = canvas.width, Hh = canvas.height; const R = 60;
    const img = ctx.createImageData(W, Hh);
    for (let py = 0; py < Hh; py += 1) for (let px = 0; px < W; px += 1) {
      const x = (px / W) * 2 - 1, y = (py / Hh) * 2 - 1;
      const a1 = n.W1.map((w, j) => th(w[0] * x + w[1] * y + n.b1[j]));
      const out = sig(a1.reduce((s2, a, j) => s2 + a * n.W2[j], n.b2));
      const idx = (py * W + px) * 4; const r = 244 * out + 34 * (1 - out), g = 114 * out + 197 * (1 - out), b = 182 * out + 244 * (1 - out);
      img.data[idx] = r * 0.5 + 11; img.data[idx + 1] = g * 0.4 + 18; img.data[idx + 2] = b * 0.4 + 32; img.data[idx + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    for (const [x, y, t] of data.current) { const px = ((x + 1) / 2) * W, py = ((y + 1) / 2) * Hh; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 7); ctx.fillStyle = t ? "#f9a8d4" : "#67e8f9"; ctx.fill(); ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 1; ctx.stroke(); }
    void R;
  };

  const t = useTransport(frame);

  const explain =
    lr > 0.3
      ? "A high learning rate trains fast but overshoots — expect the loss to bounce and the boundary to jitter before it settles."
      : lr < 0.05
      ? "A low learning rate is stable but slow: the decision boundary tightens gradually over many epochs."
      : `With ${Math.round(hidden)} hidden units the net bends the boundary into curves — more units capture finer shapes like the spiral, but too many can overfit.`;

  const code = `import numpy as np
hidden, lr = ${Math.round(hidden)}, ${lr}
# 2 -> hidden -> 1 MLP, tanh + sigmoid, trained by backprop
rng = np.random.default_rng(0)
W1 = rng.normal(0, .5, (hidden, 2)); b1 = np.zeros(hidden)
W2 = rng.normal(0, .5, hidden); b2 = 0.
# X: Nx2 features, y: N labels in {0,1}
for epoch in range(500):
    for x, t in zip(X, y):
        a1 = np.tanh(W1 @ x + b1)
        out = 1/(1+np.exp(-(a1 @ W2 + b2)))
        dz2 = out - t
        W2 -= lr*dz2*a1; b2 -= lr*dz2
        dz1 = dz2*W2*(1-a1**2)
        W1 -= lr*np.outer(dz1, x); b1 -= lr*dz1`;

  return (
    <StudioChrome title="Neural Network Playground" tagline="2-layer MLP · live backprop"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-2">{(["circle", "xor", "spiral"] as DS[]).map((d) => <button key={d} onClick={() => setDataset(d)} className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${dataset === d ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{d}</button>)}</div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Hidden neurons" value={hidden} min={2} max={16} step={1} onChange={(v) => update({ hidden: v })} />
        <Slider label="Learning rate" value={lr} min={0.01} max={0.5} step={0.01} onChange={(v) => update({ lr: v })} />
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { init(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mt-3 text-xs text-slate-500">A tiny multilayer perceptron trained by real backpropagation. The background shows its learned decision boundary; dots are the training data, colored by true class.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Epoch" value={String(epoch)} /><Stat label="Loss" value={loss.toFixed(4)} /><Stat label="Architecture" value={`2→${Math.round(hidden)}→1`} /><Equation tex={`a = \\tanh(W_1 x + b_1),\\quad \\hat y = \\sigma(W_2 a + b_2),\\quad L = ${loss.toFixed(4)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={420} height={420} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
