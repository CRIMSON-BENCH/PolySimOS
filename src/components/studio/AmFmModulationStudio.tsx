"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { fc: number; fm: number; index: number; mode: number }> = {
  "AM broadcast": { fc: 20, fm: 2, index: 0.7, mode: 0 },
  "Over-modulated AM": { fc: 20, fm: 2, index: 1, mode: 0 },
  "Narrowband FM": { fc: 30, fm: 3, index: 0.3, mode: 1 },
  "Wideband FM": { fc: 30, fm: 2, index: 1, mode: 1 },
};

export function AmFmModulationStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ fc, fm, index }, update] = useShareableNumbers({ fc: 20, fm: 2, index: 0.7 });
  const [mode, setMode] = useState(0);
  const carrier = (t: number) => Math.cos(2 * Math.PI * fc * t);
  const msg = (t: number) => Math.cos(2 * Math.PI * fm * t);
  const modulated = (t: number) => mode ? Math.cos(2 * Math.PI * fc * t + index * 8 * Math.sin(2 * Math.PI * fm * t)) : (1 + index * msg(t)) * carrier(t);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pw = W - 60;
    const wave = (f: (t: number) => number, oy: number, amp: number, col: string, lbl: string) => { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = i / pw; const y = oy - f(t) * amp; i ? ctx.lineTo(30 + i, y) : ctx.moveTo(30 + i, y); } ctx.stroke(); ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText(lbl, 30, oy - amp - 6); };
    wave(msg, 55, 24, "#a3e635", "message"); wave(carrier, 140, 24, "#64748b", "carrier"); wave(modulated, 250, 46, "#22d3ee", mode ? "FM signal" : "AM signal");
  }, [fc, fm, index, mode]);

  const beta = index * 8; // FM phase-deviation index used in the draw
  const bandwidth = 2 * (beta + 1) * fm; // Carson's rule
  const explain = mode
    ? `FM varies the carrier's instantaneous frequency with the ${fm} Hz message. The modulation index (β ≈ ${beta.toFixed(1)}) sets how wide the spectrum spreads: by Carson's rule the occupied bandwidth is about ${bandwidth.toFixed(0)} Hz. ${beta < 3 ? "This is narrowband FM — compact spectrum, more noise-sensitive." : "This is wideband FM — a broad spectrum that trades bandwidth for strong noise immunity."}`
    : `AM varies the carrier's amplitude with the ${fm} Hz message at ${(index * 100).toFixed(0)}% depth. ${index >= 1 ? "At 100% (or above) the envelope pinches to zero and the signal is over-modulated — the recovered message clips and distorts." : "The envelope stays positive, so a simple envelope detector recovers the message cleanly."} The ${fc} Hz carrier is far above the message so the two separate at the receiver.`;

  const code = mode
    ? `import numpy as np
fc, fm, index = ${fc}, ${fm}, ${index}
beta = index * 8            # phase-deviation (modulation) index
t = np.linspace(0, 1, 2000)
message = np.cos(2*np.pi*fm*t)
fm_signal = np.cos(2*np.pi*fc*t + beta*np.sin(2*np.pi*fm*t))
bandwidth = 2*(beta + 1)*fm  # Carson's rule
print("Carson bandwidth ~", bandwidth, "Hz")`
    : `import numpy as np
fc, fm, index = ${fc}, ${fm}, ${index}
t = np.linspace(0, 1, 2000)
message = np.cos(2*np.pi*fm*t)
carrier = np.cos(2*np.pi*fc*t)
am_signal = (1 + index*message) * carrier   # index >= 1 over-modulates
print("modulation depth", index*100, "%")`;

  return (
    <StudioChrome title="AM / FM Modulation" tagline="how radio carries sound"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => { const p = PRESETS[label]; update({ fc: p.fc, fm: p.fm, index: p.index }); setMode(p.mode); }}
        />
        <label className="mb-2 block text-xs text-slate-400">Modulation</label>
        <select value={mode} onChange={(e) => setMode(Number(e.target.value))} className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value={0}>AM (amplitude)</option><option value={1}>FM (frequency)</option></select>
        <Slider label="Carrier frequency" value={fc} min={10} max={40} step={1} onChange={(v) => update({ fc: v })} />
        <Slider label="Message frequency" value={fm} min={1} max={6} step={1} onChange={(v) => update({ fm: v })} />
        <Slider label="Modulation index" value={index} min={0.1} max={1} step={0.05} onChange={(v) => update({ index: v })} />
        <p className="mt-3 text-xs text-slate-500">Radio hides a low-frequency message inside a high-frequency carrier. AM varies the carrier{"'"}s amplitude with the message; FM varies its frequency. FM resists noise better, which is why music stations use it. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Mode" value={mode ? "Frequency (FM)" : "Amplitude (AM)"} />
        <Stat label="Carrier / message" value={`${fc} / ${fm}`} />
        <Stat label="Modulation index" value={index.toFixed(2)} />
        <Stat label={mode ? "Carson bandwidth" : "Modulation depth"} value={mode ? `${bandwidth.toFixed(0)} Hz` : `${(index * 100).toFixed(0)}%`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
