"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { R: number; C: number; hr: number; sv: number }> = {
  "Resting adult": { R: 1.0, C: 1.5, hr: 70, sv: 70 },
  Exercise: { R: 0.8, C: 1.5, hr: 140, sv: 100 },
  "Stiff arteries": { R: 1.2, C: 0.6, hr: 70, sv: 70 },
  Bradycardia: { R: 1.2, C: 2.0, hr: 45, sv: 90 },
};

export function WindkesselStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ R, C, hr, sv }, update] = useShareableNumbers({ R: 1.0, C: 1.5, hr: 70, sv: 70 });
  const period = 60 / hr, sysFrac = 0.3;
  const st = useRef({ P: 80, hist: [] as number[] });

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); let raf = 0, last = 0; const s = st.current;
    const loop = (t: number) => {
      const dt = last ? Math.min(0.02, (t - last) / 1000) : 0; last = t;
      const phase = (t / 1000) % period;
      const inflow = phase < sysFrac * period ? sv / (sysFrac * period) : 0;
      s.P += ((inflow - s.P / R) / C) * dt * 4;
      s.hist.push(s.P); if (s.hist.length > 500) s.hist.shift();
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const oy = H - 30, ph = H - 60;
      ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(40, oy); ctx.lineTo(W - 10, oy); ctx.moveTo(40, oy); ctx.lineTo(40, oy - ph); ctx.stroke();
      ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); s.hist.forEach((p, i) => { const x = 40 + i / 500 * (W - 50); const y = oy - (p / 160) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("aortic pressure waveform (mmHg)", 46, 22);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [R, C, hr, sv, period]);

  const map = st.current.P;

  const explain =
    C < 1.0
      ? "Low compliance means stiff arteries: each beat produces a sharp, high-amplitude pressure swing."
      : hr > 120
      ? "A fast heart rate leaves little time to drain between beats, so mean pressure stays elevated."
      : R * C > 3.5
      ? "A long RC time constant smooths the waveform — pressure barely sags between beats."
      : "With this balance the aorta stores each stroke and releases it gradually, keeping the pulse gentle.";

  const code = `import numpy as np
R, C, hr, sv = ${R}, ${C}, ${hr}, ${sv}
period = 60 / hr; sys_frac = 0.3
P, dt = 80.0, 0.005
for i in range(20000):
    phase = (i * dt) % period
    inflow = sv / (sys_frac * period) if phase < sys_frac * period else 0
    P += (inflow - P / R) / C * dt * 4
print("approx pressure", P)`;

  return (
    <StudioChrome title="Windkessel (Arterial Pressure)" tagline="why arteries smooth the pulse"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Vascular resistance R" value={R} min={0.5} max={2.5} step={0.1} onChange={(v) => update({ R: v })} />
        <Slider label="Arterial compliance C" value={C} min={0.5} max={3} step={0.1} onChange={(v) => update({ C: v })} />
        <Slider label="Heart rate (bpm)" value={hr} min={40} max={160} step={5} onChange={(v) => update({ hr: v })} />
        <Slider label="Stroke volume (mL)" value={sv} min={40} max={120} step={5} onChange={(v) => update({ sv: v })} />
        <p className="mt-3 text-xs text-slate-500">The Windkessel model treats the aorta as an elastic reservoir: each heartbeat pumps blood in, and the artery&apos;s compliance stores it and releases it smoothly between beats. Stiffer arteries (low compliance) give sharper, higher pressure swings. Educational tool, not medical advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Approx. pressure" value={`${map.toFixed(0)} mmHg`} />
        <Stat label="Time constant RC" value={`${(R * C).toFixed(2)} s`} />
        <Stat label="Cardiac output" value={`${(hr * sv / 1000).toFixed(1)} L/min`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
