"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { noise: number; pos: number }> = {
  "Clean signal": { noise: 0.3, pos: 0.5 },
  "Buried pulse": { noise: 3, pos: 0.6 },
  "Early arrival": { noise: 1.5, pos: 0.15 },
  "At threshold": { noise: 2.5, pos: 0.7 },
};

export function MatchedFilterStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ noise, pos }, update] = useShareableNumbers({ noise: 1.5, pos: 0.55 });
  const N = 300, plen = 30;
  const rnd = (n: number) => ((n * 9301 + 49297) % 233280) / 233280 - 0.5;
  const pulse = (i: number) => (i >= 0 && i < plen) ? Math.sin(Math.PI * i / plen) : 0;
  const sig: number[] = []; const start = Math.floor(pos * N);
  for (let n = 0; n < N; n++) sig[n] = pulse(n - start) + noise * rnd(n);
  const corr: number[] = []; for (let k = 0; k < N; k++) { let s = 0; for (let i = 0; i < plen; i++) if (k + i < N) s += sig[k + i] * pulse(i); corr[k] = s; }
  const peakIdx = corr.indexOf(Math.max(...corr));
  const detected = Math.max(...corr) > plen / 3;

  const explain = noise < 1
    ? "Noise is low, so the pulse is already visible — yet correlating with the template still sharpens it into a single unambiguous peak."
    : detected
    ? "The pulse is buried, but correlation adds its energy coherently while random noise averages toward zero — the peak still clears the detection threshold."
    : "Noise now swamps the template: the correlation peak has sunk below threshold, so the reported position is unreliable — this is the SNR floor where matched filtering fails.";

  const code = `import numpy as np
N, plen, noise, pos = 300, 30, ${noise}, ${pos}
rnd = lambda n: ((n*9301 + 49297) % 233280)/233280 - 0.5
pulse = lambda i: np.sin(np.pi*i/plen) if 0 <= i < plen else 0.0
start = int(pos*N)
sig = np.array([pulse(n - start) + noise*rnd(n) for n in range(N)])
tpl = np.array([pulse(i) for i in range(plen)])
corr = np.array([np.dot(sig[k:k+plen], tpl) if k+plen <= N else 0.0 for k in range(N)])
print("detected position", corr.argmax()/N, "x length")`;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#0e7490"; ctx.lineWidth = 1; ctx.beginPath(); sig.forEach((v, n) => { const x = 30 + n / N * (W - 50), y = 80 - v * 30; n ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("noisy signal — pulse is buried", 30, 20);
    const cmax = Math.max(...corr, 0.01); ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); corr.forEach((v, k) => { const x = 30 + k / N * (W - 50), y = 250 - v / cmax * 120; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    const px = 30 + peakIdx / N * (W - 50); ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(px, 250); ctx.lineTo(px, 130); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("matched-filter output — sharp peak locates the pulse", 30, 148);
  }, [noise, pos]);

  return (
    <StudioChrome title="Matched Filter" tagline="pulling signal out of noise"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Noise level" value={noise} min={0} max={4} step={0.1} onChange={(v) => update({ noise: v })} />
        <Slider label="Pulse position" value={pos} min={0.1} max={0.85} step={0.05} onChange={(v) => update({ pos: v })} />
        <p className="mt-3 text-xs text-slate-500">A matched filter correlates a received signal with a known template, concentrating the pulse energy into a single sharp peak while averaging noise away. It gives the best possible detection in white noise — the core of radar, sonar, and GPS. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Detected position" value={`${(peakIdx / N).toFixed(2)} × length`} />
        <Stat label="Detection" value={detected ? "pulse found ✓" : "lost in noise"} />
        <Equation tex={`h(t)=s(T-t),\\quad y(t)=\\int x(\\tau)\\,s(\\tau-t)\\,d\\tau,\\quad \\hat t=${(peakIdx / N).toFixed(2)}\\,T`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
