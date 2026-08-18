"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function TitrationCurveStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [Ca, setCa] = useState(0.1), [Va, setVa] = useState(25), [Cb, setCb] = useState(0.1);
  const Veq = Ca * Va / Cb;
  const pHat = (v: number) => { const na = Ca * Va / 1000, nb = Cb * v / 1000, tot = (Va + v) / 1000; if (Math.abs(na - nb) < 1e-9) return 7; if (nb < na) return -Math.log10((na - nb) / tot); return 14 + Math.log10((nb - na) / tot); };

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 32, pw = W - 60, ph = H - 52, vmax = Veq * 2;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    for (let p = 0; p <= 14; p += 7) { const y = oy - (p / 14) * ph; ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + pw, y); ctx.stroke(); }
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const v = vmax * i / pw; const y = oy - (pHat(v) / 14) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    const ex = ox + 0.5 * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ex, oy); ctx.lineTo(ex, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("pH vs titrant added — steep jump at equivalence", ox + 6, oy - ph + 12); ctx.fillText("volume →", ox + pw - 54, oy + 18);
  }, [Ca, Va, Cb, Veq]);

  return (
    <StudioChrome title="Acid–Base Titration" tagline="the pH jump at equivalence"
      controls={<div>
        <Slider label="Acid conc. (M)" value={Ca} min={0.01} max={0.5} step={0.01} onChange={setCa} />
        <Slider label="Acid volume (mL)" value={Va} min={5} max={50} step={1} onChange={setVa} />
        <Slider label="Base conc. (M)" value={Cb} min={0.01} max={0.5} step={0.01} onChange={setCb} />
        <p className="mt-3 text-xs text-slate-500">Adding base to an acid barely moves the pH until you approach the equivalence point, where it leaps almost vertically. That steep jump is what makes an indicator color change so sharp. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Equivalence volume" value={`${Veq.toFixed(1)} mL`} />
        <Stat label="pH at start" value={pHat(0).toFixed(2)} />
        <Stat label="pH at equivalence" value="7.00" />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
