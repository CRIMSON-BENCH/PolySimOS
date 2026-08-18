"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function NaiveBayesStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [mu1, setMu1] = useState(-1), [mu2, setMu2] = useState(1.5), [sig, setSig] = useState(1), [prior, setPrior] = useState(0.5);
  const g = (x: number, mu: number) => Math.exp(-((x - mu) ** 2) / (2 * sig * sig)) / (sig * Math.sqrt(2 * Math.PI));
  const post1 = (x: number) => prior * g(x, mu1) / (prior * g(x, mu1) + (1 - prior) * g(x, mu2));
  // decision boundary where post = 0.5
  let bd = 0; for (let i = 0; i < 400; i++) { const x = -5 + 10 * i / 400; if (post1(x) < 0.5) { bd = x; break; } }

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 40, pw = W - 60, ph = H - 70, xmin = -5, xmax = 5, ymax = 0.45 / sig;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    const plot = (mu: number, scale: number, col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const x = xmin + (xmax - xmin) * i / pw; const y = oy - g(x, mu) * scale / ymax * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke(); };
    plot(mu1, prior, "#f472b6"); plot(mu2, 1 - prior, "#22d3ee");
    const bx = ox + (bd - xmin) / (xmax - xmin) * pw; ctx.strokeStyle = "#a3e635"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(bx, oy); ctx.lineTo(bx, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("two class distributions — boundary where they cross", ox + 6, 20);
  }, [mu1, mu2, sig, prior, bd]);

  return (
    <StudioChrome title="Naive Bayes Classifier" tagline="classification by probability"
      controls={<div>
        <Slider label="Class 1 mean" value={mu1} min={-3} max={1} step={0.1} onChange={setMu1} />
        <Slider label="Class 2 mean" value={mu2} min={-1} max={3} step={0.1} onChange={setMu2} />
        <Slider label="Spread σ" value={sig} min={0.4} max={2} step={0.1} onChange={setSig} />
        <Slider label="Prior P(class 1)" value={prior} min={0.1} max={0.9} step={0.05} onChange={setPrior} />
        <p className="mt-3 text-xs text-slate-500">Naive Bayes models each class as a probability distribution and assigns a new point to whichever class makes it most likely, weighted by the prior. Where the weighted curves cross is the decision boundary. It is fast, simple, and famously strong on text. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Decision boundary" value={bd.toFixed(2)} />
        <Stat label="Class overlap" value={Math.abs(mu2 - mu1) < 2 * sig ? "high (hard)" : "low (easy)"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
