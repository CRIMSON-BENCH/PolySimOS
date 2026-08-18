"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { corr: number; spread: number }> = {
  "Uncorrelated": { corr: 0, spread: 1.6 },
  "Strong positive": { corr: 0.9, spread: 1.6 },
  "Strong negative": { corr: -0.9, spread: 1.6 },
  "Elongated cloud": { corr: 0.5, spread: 3 },
};

export function PCAStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ corr, spread }, update] = useShareableNumbers({ corr: 0.7, spread: 1.6 });
  const [seed, setSeed] = useState(1);
  const [ev, setEv] = useState({ l1: 0, l2: 0, angle: 0 });

  useEffect(() => {
    let s = seed * 9871 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const pts: [number, number][] = []; for (let i = 0; i < 200; i++) { const a = gauss(); const b = gauss(); const x = a * spread; const y = (corr * a + Math.sqrt(1 - corr * corr) * b) * 1.0; pts.push([x, y]); }
    const mx = pts.reduce((s2, p) => s2 + p[0], 0) / pts.length, my = pts.reduce((s2, p) => s2 + p[1], 0) / pts.length;
    let cxx = 0, cyy = 0, cxy = 0; for (const [x, y] of pts) { cxx += (x - mx) ** 2; cyy += (y - my) ** 2; cxy += (x - mx) * (y - my); } cxx /= pts.length; cyy /= pts.length; cxy /= pts.length;
    const tr = cxx + cyy, det = cxx * cyy - cxy * cxy; const l1 = tr / 2 + Math.sqrt(tr * tr / 4 - det), l2 = tr / 2 - Math.sqrt(tr * tr / 4 - det);
    const angle = 0.5 * Math.atan2(2 * cxy, cxx - cyy); setEv({ l1, l2, angle: angle * 180 / Math.PI });
    const W = 460, H = 380; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const cx = W / 2, cy = H / 2, sc = 40;
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    for (const [x, y] of pts) { ctx.beginPath(); ctx.arc(cx + x * sc, cy - y * sc, 2.5, 0, 7); ctx.fillStyle = "rgba(244,114,182,0.7)"; ctx.fill(); }
    // principal axes
    const drawAxis = (ln: number, ang: number, col: string) => { const len = Math.sqrt(ln) * sc * 2; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - Math.cos(ang) * len, cy + Math.sin(ang) * len); ctx.lineTo(cx + Math.cos(ang) * len, cy - Math.sin(ang) * len); ctx.stroke(); };
    drawAxis(l1, angle, "#22d3ee"); drawAxis(l2, angle + Math.PI / 2, "#a3e635");
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("PC1", cx + Math.cos(angle) * 100 + 4, cy - Math.sin(angle) * 100); ctx.fillText("PC2", cx - Math.sin(angle) * 60, cy - Math.cos(angle) * 60);
  }, [corr, spread, seed]);

  const totalVar = ev.l1 + ev.l2; const pc1pct = totalVar ? ev.l1 / totalVar * 100 : 0;

  const explain =
    Math.abs(corr) >= 0.85
      ? `Strong correlation (${corr}) squeezes the cloud onto one axis — PC1 already captures ${pc1pct.toFixed(0)}% of the variance, so you could drop to a single dimension with little loss.`
      : Math.abs(corr) <= 0.15
      ? `With almost no correlation (${corr}) the axes carry similar variance (PC1 ${pc1pct.toFixed(0)}%), so neither dimension is redundant and PCA cannot compress the data much.`
      : `PC1 explains ${pc1pct.toFixed(0)}% of the variance here; the stronger the correlation between features, the more PCA concentrates information on that first component.`;

  const code = `import numpy as np
corr, spread = ${corr}, ${spread}
rng = np.random.default_rng(${seed})
a, b = rng.standard_normal((2, 200))
X = np.column_stack([a * spread, corr * a + np.sqrt(1 - corr**2) * b])
vals, vecs = np.linalg.eigh(np.cov(X, rowvar=False))
vals = vals[::-1]   # eigenvalues = variance along each principal component
print("variance ratio PC1:", vals[0] / vals.sum())`;

  return (
    <StudioChrome title="Principal Component Analysis" tagline="finding the axes of variation"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Correlation" value={corr} min={-0.95} max={0.95} step={0.05} onChange={(v) => update({ corr: v })} />
        <Slider label="Spread (x)" value={spread} min={0.5} max={3} step={0.1} onChange={(v) => update({ spread: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New data</button>
        <p className="mt-3 text-xs text-slate-500">PCA finds the directions along which data varies most. The eigenvectors of the covariance matrix are the principal components (cyan = most variance, green = least), and their eigenvalues are the variances along each. Projecting onto the top components is the basis of dimensionality reduction.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Variance PC1" value={ev.l1.toFixed(2)} />
        <Stat label="Variance PC2" value={ev.l2.toFixed(2)} />
        <Stat label="PC1 explains" value={`${pc1pct.toFixed(0)}%`} />
        <Stat label="PC1 angle" value={`${ev.angle.toFixed(0)}°`} />
        <Equation tex={`Cv = \\lambda v,\\quad \\frac{\\lambda_1}{\\lambda_1+\\lambda_2} = \\frac{${ev.l1.toFixed(2)}}{${totalVar.toFixed(2)}} = ${(pc1pct / 100).toFixed(2)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={460} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
