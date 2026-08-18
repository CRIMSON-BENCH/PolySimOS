"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function CardiacActionPotentialStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [bpm, setBpm] = useState(70), [plateau, setPlateau] = useState(1), [amp, setAmp] = useState(110);
  const period = 60 / bpm;
  // simplified AP: fast upstroke, plateau, repolarization → shape over one beat
  const apd = period * 0.4 * plateau;
  const ap = (ph: number) => { const t = ph * period; if (t < 0.01) return -90 + amp * (t / 0.01); if (t < apd) { const f = (t - 0.01) / (apd - 0.01); return 20 - 10 * f; } if (t < apd + 0.08) { const f = (t - apd) / 0.08; return 10 - (100) * f; } return -90; };

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(W - 10, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    const beats = 2.2, pw = W - 55; for (let i = 0; i <= pw; i++) { const phase = (i / pw * beats) % 1; const v = ap(phase); const y = oy - ((v + 90) / 130) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("cardiac action potential — upstroke, plateau, repolarization", ox + 6, 20); ctx.fillText("mV", ox - 34, oy - ph + 10);
  }, [bpm, plateau, amp, period, apd]);

  return (
    <StudioChrome title="Cardiac Action Potential" tagline="the electrical heartbeat"
      controls={<div>
        <Slider label="Heart rate (bpm)" value={bpm} min={40} max={180} step={5} onChange={setBpm} />
        <Slider label="Plateau duration" value={plateau} min={0.3} max={1.6} step={0.1} onChange={setPlateau} />
        <Slider label="Upstroke amplitude (mV)" value={amp} min={80} max={130} step={5} onChange={setAmp} />
        <p className="mt-3 text-xs text-slate-500">Each heartbeat is an electrical wave: a fast sodium upstroke, a long calcium plateau unique to heart cells, then potassium repolarization. That plateau keeps the muscle contracted long enough to pump — and its length sets the refractory period. Educational tool, not medical advice.</p>
      </div>}
      inspector={<div>
        <Stat label="Cycle length" value={`${(period * 1000).toFixed(0)} ms`} />
        <Stat label="Action-potential duration" value={`${(apd * 1000).toFixed(0)} ms`} />
        <Stat label="Peak potential" value={`+${(amp - 90).toFixed(0)} mV`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
