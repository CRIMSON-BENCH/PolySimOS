"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { sigFreq: number; fs: number }> = {
  "Clean (5/20)": { sigFreq: 5, fs: 20 },
  "Nyquist edge (5/11)": { sigFreq: 5, fs: 11 },
  "Aliased (9/12)": { sigFreq: 9, fs: 12 },
  "Severe (15/8)": { sigFreq: 15, fs: 8 },
};

export function SamplingTheoremStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ sigFreq, fs }, update] = useShareableNumbers({ sigFreq: 5, fs: 8 });
  const aliased = fs < 2 * sigFreq;
  const aliasFreq = aliased ? Math.abs(sigFreq - Math.round(sigFreq / fs) * fs) : sigFreq;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cy = H / 2, amp = 90, pw = W - 60, dur = 1;
    ctx.strokeStyle = "#0e7490"; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = dur * i / pw; const y = cy - Math.sin(2 * Math.PI * sigFreq * t) * amp; i ? ctx.lineTo(30 + i, y) : ctx.moveTo(30 + i, y); } ctx.stroke();
    // samples
    const ns = Math.floor(fs * dur); ctx.fillStyle = "#fbbf24"; const pts: [number, number][] = [];
    for (let k = 0; k <= ns; k++) { const t = k / fs; if (t > dur) break; const x = 30 + t / dur * pw, y = cy - Math.sin(2 * Math.PI * sigFreq * t) * amp; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); pts.push([x, y]); }
    // reconstructed (alias) line through samples
    if (aliased) { ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = dur * i / pw; const y = cy - Math.sin(2 * Math.PI * aliasFreq * t) * amp; i ? ctx.lineTo(30 + i, y) : ctx.moveTo(30 + i, y); } ctx.stroke(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(aliased ? "ALIASING: samples suggest a false low frequency (pink)" : "well sampled — signal is recoverable", 30, 22);
  }, [sigFreq, fs, aliased, aliasFreq]);

  const explain = aliased
    ? `Undersampled: fs=${fs} Hz is below the ${2 * sigFreq} Hz Nyquist rate, so the ${sigFreq} Hz tone masquerades as a false ${aliasFreq.toFixed(1)} Hz signal.`
    : fs < 2.5 * sigFreq
    ? `Just above Nyquist: fs=${fs} Hz clears the ${2 * sigFreq} Hz minimum but with little margin — real converters add headroom for imperfect anti-alias filters.`
    : `Comfortably sampled: fs=${fs} Hz sits well above the ${2 * sigFreq} Hz Nyquist rate, so the ${sigFreq} Hz signal is fully recoverable.`;

  const code = `import numpy as np
sig, fs = ${sigFreq}, ${fs}
t = np.arange(0, 1, 1/1000)
x = np.sin(2*np.pi*sig*t)
n = np.arange(0, 1, 1/fs)
samples = np.sin(2*np.pi*sig*n)
print("Nyquist", 2*sig, "fs", fs, "aliased", fs < 2*sig)`;

  return (
    <StudioChrome title="Sampling & Nyquist" tagline="when digital gets it wrong"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Signal frequency (Hz)" value={sigFreq} min={1} max={20} step={1} onChange={(v) => update({ sigFreq: v })} />
        <Slider label="Sample rate fs (Hz)" value={fs} min={2} max={50} step={1} onChange={(v) => update({ fs: v })} />
        <p className="mt-3 text-xs text-slate-500">The Nyquist–Shannon theorem says you must sample faster than twice the highest frequency. Sample too slowly and a high frequency masquerades as a low one — aliasing — which is why anti-alias filters guard every ADC. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Nyquist rate" value={`${2 * sigFreq} Hz`} />
        <Stat label="Sampling" value={aliased ? "too slow ⚠" : "adequate ✓"} />
        <Stat label="Apparent frequency" value={`${aliasFreq.toFixed(1)} Hz`} />
        <Equation tex={`f_s > 2f_{\\max}:\\ ${fs}\\,\\text{Hz} ${aliased ? "<" : ">"} ${2 * sigFreq}\\,\\text{Hz}${aliased ? `\\ \\Rightarrow\\ f_{\\text{alias}}=${aliasFreq.toFixed(1)}\\,\\text{Hz}` : ""}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
