"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

function normCDF(x: number) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
function normPDF(x: number) { return 0.3989423 * Math.exp(-x * x / 2); }

export function HypothesisTestStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mean, setMean] = useState(52);
  const [mu0, setMu0] = useState(50);
  const [sd, setSd] = useState(8);
  const [n, setN] = useState(40);
  const [twoTail, setTwoTail] = useState(true);

  const se = sd / Math.sqrt(n); const z = (mean - mu0) / se;
  const p = twoTail ? 2 * (1 - normCDF(Math.abs(z))) : 1 - normCDF(z);
  const zCrit = twoTail ? 1.96 : 1.645; const reject = Math.abs(z) > zCrit;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 20, oy = H - 40, pw = W - 40, ph = H - 70;
    const X = (zz: number) => ox + ((zz + 4) / 8) * pw;
    // rejection regions
    ctx.fillStyle = "rgba(239,68,68,0.3)";
    const shade = (from: number, to: number) => { ctx.beginPath(); ctx.moveTo(X(from), oy); for (let zz = from; zz <= to; zz += 0.05) ctx.lineTo(X(zz), oy - normPDF(zz) / 0.4 * ph); ctx.lineTo(X(to), oy); ctx.closePath(); ctx.fill(); };
    if (twoTail) { shade(-4, -zCrit); shade(zCrit, 4); } else shade(zCrit, 4);
    // curve
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let zz = -4; zz <= 4; zz += 0.05) { const y = oy - normPDF(zz) / 0.4 * ph; zz === -4 ? ctx.moveTo(X(zz), y) : ctx.lineTo(X(zz), y); } ctx.stroke();
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    // test statistic
    const zc = Math.max(-3.9, Math.min(3.9, z)); ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(zc), oy); ctx.lineTo(X(zc), oy - ph); ctx.stroke();
    ctx.fillStyle = "#bef264"; ctx.font = "11px sans-serif"; ctx.fillText(`z = ${z.toFixed(2)}`, X(zc) + 4, oy - ph + 10);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("null distribution (standard normal)", ox + 6, 18); ctx.fillStyle = "#fca5a5"; ctx.fillText("rejection region", ox + pw - 100, oy - 6);
  }, [mean, mu0, sd, n, twoTail]);

  return (
    <StudioChrome title="Hypothesis Test (z-test)" tagline="p-values & rejection regions"
      controls={<div>
        <Slider label="Sample mean x̄" value={mean} min={40} max={60} step={0.5} onChange={setMean} />
        <Slider label="Null mean μ₀" value={mu0} min={40} max={60} step={0.5} onChange={setMu0} />
        <Slider label="Std deviation s" value={sd} min={2} max={20} step={0.5} onChange={setSd} />
        <Slider label="Sample size n" value={n} min={5} max={200} step={5} onChange={setN} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={twoTail} onChange={(e) => setTwoTail(e.target.checked)} /> Two-tailed test</label>
        <p className="mt-3 text-xs text-slate-500">A hypothesis test asks whether a sample mean is far enough from the null value to be surprising by chance alone. The test statistic z measures that distance in standard errors; if it falls in the red rejection region (p below 0.05) we reject the null. Larger samples shrink the standard error and sharpen the test.</p>
      </div>}
      inspector={<div><Stat label="Standard error" value={se.toFixed(3)} /><Stat label="z-statistic" value={z.toFixed(3)} /><Stat label="p-value" value={p.toFixed(4)} /><Stat label="Decision" value={reject ? "reject H₀" : "fail to reject"} /></div>}
    ><canvas ref={canvasRef} width={540} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
