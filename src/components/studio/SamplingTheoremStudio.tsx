"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function SamplingTheoremStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [sigFreq, setSigFreq] = useState(5), [fs, setFs] = useState(8);
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

  return (
    <StudioChrome title="Sampling & Nyquist" tagline="when digital gets it wrong"
      controls={<div>
        <Slider label="Signal frequency (Hz)" value={sigFreq} min={1} max={20} step={1} onChange={setSigFreq} />
        <Slider label="Sample rate fs (Hz)" value={fs} min={2} max={50} step={1} onChange={setFs} />
        <p className="mt-3 text-xs text-slate-500">The Nyquist–Shannon theorem says you must sample faster than twice the highest frequency. Sample too slowly and a high frequency masquerades as a low one — aliasing — which is why anti-alias filters guard every ADC. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Nyquist rate" value={`${2 * sigFreq} Hz`} />
        <Stat label="Sampling" value={aliased ? "too slow ⚠" : "adequate ✓"} />
        <Stat label="Apparent frequency" value={`${aliasFreq.toFixed(1)} Hz`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
