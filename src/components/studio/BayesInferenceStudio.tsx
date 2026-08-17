"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Beta-Binomial Bayesian updating for a coin's bias.
function betaPDF(x: number, a: number, b: number) { if (x <= 0 || x >= 1) return 0;
  const lnB = lgamma(a) + lgamma(b) - lgamma(a + b); return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - lnB); }
function lgamma(z: number): number { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z); z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i); const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x); }

export function BayesInferenceStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priorA, setPriorA] = useState(2);
  const [priorB, setPriorB] = useState(2);
  const [heads, setHeads] = useState(14);
  const [tails, setTails] = useState(6);

  const postA = priorA + heads, postB = priorB + tails;
  const postMean = postA / (postA + postB);
  const postVar = (postA * postB) / ((postA + postB) ** 2 * (postA + postB + 1)); const postSd = Math.sqrt(postVar);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 60, ph = H - 55;
    let ymax = 0; for (let i = 1; i < 200; i++) { const x = i / 200; ymax = Math.max(ymax, betaPDF(x, postA, postB), betaPDF(x, priorA, priorB)); }
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const plot = (a: number, b: number, col: string, fill: boolean) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 200; const y = oy - (betaPDF(x, a, b) / ymax) * ph; i ? ctx.lineTo(ox + x * pw, y) : ctx.moveTo(ox + x * pw, y); } ctx.stroke(); if (fill) { ctx.lineTo(ox + pw, oy); ctx.lineTo(ox, oy); ctx.closePath(); ctx.fillStyle = col.replace(")", ",0.12)").replace("rgb", "rgba"); ctx.fill(); } };
    plot(priorA, priorB, "#64748b", false); plot(postA, postB, "#22d3ee", false);
    // likelihood (normalized as beta of data)
    plot(heads + 1, tails + 1, "#f472b6", false);
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#94a3b8"; ctx.fillText("prior", ox + 6, 16); ctx.fillStyle = "#f472b6"; ctx.fillText("likelihood", ox + 50, 16); ctx.fillStyle = "#22d3ee"; ctx.fillText("posterior", ox + 130, 16);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("P(bias) — 0 to 1", ox + pw - 100, oy + 18);
  }, [priorA, priorB, heads, tails]);

  return (
    <StudioChrome title="Bayesian Inference" tagline="prior × likelihood → posterior"
      controls={<div>
        <Slider label="Prior α (pseudo-heads)" value={priorA} min={0.5} max={20} step={0.5} onChange={setPriorA} />
        <Slider label="Prior β (pseudo-tails)" value={priorB} min={0.5} max={20} step={0.5} onChange={setPriorB} />
        <Slider label="Observed heads" value={heads} min={0} max={100} step={1} onChange={setHeads} />
        <Slider label="Observed tails" value={tails} min={0} max={100} step={1} onChange={setTails} />
        <p className="mt-3 text-xs text-slate-500">Bayesian inference updates a prior belief with data to form a posterior. For a coin, a Beta prior combined with binomial coin flips gives a Beta posterior — the conjugate update is just adding heads to α and tails to β. Watch the posterior sharpen and shift as evidence accumulates.</p>
      </div>}
      inspector={<div><Stat label="Posterior mean" value={postMean.toFixed(3)} /><Stat label="Posterior SD" value={postSd.toFixed(3)} /><Stat label="Posterior α, β" value={`${postA.toFixed(1)}, ${postB.toFixed(1)}`} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
