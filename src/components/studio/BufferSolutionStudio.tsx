"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function BufferSolutionStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [pKa, setPKa] = useState(4.76), [ratio, setRatio] = useState(1), [addAcid, setAddAcid] = useState(0);
  // ratio = [A-]/[HA]. Adding strong acid shifts base to acid.
  const base = ratio / (1 + ratio), acid = 1 / (1 + ratio);
  const nb = base - addAcid * 0.1, na = acid + addAcid * 0.1;
  const pH = pKa + Math.log10(Math.max(1e-6, nb) / Math.max(1e-6, na));
  const pHUnbuffered = addAcid > 0 ? -Math.log10(Math.min(1, addAcid * 0.1)) : 7;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // pH bar 0-14
    const bx = 60, bw = 40; const y0 = 40, y1 = H - 40;
    for (let i = 0; i <= 40; i++) { const p = 14 * i / 40; const yy = y1 - (p / 14) * (y1 - y0); const hue = 20 + p * 16; ctx.fillStyle = `hsl(${hue},70%,50%)`; ctx.fillRect(bx, yy - 4, bw, 6); }
    const py = y1 - (pH / 14) * (y1 - y0); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(bx + bw + 4, py); ctx.lineTo(bx + bw + 16, py - 7); ctx.lineTo(bx + bw + 16, py + 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#e2e8f0"; ctx.font = "13px sans-serif"; ctx.fillText(`buffered pH ${pH.toFixed(2)}`, bx + bw + 24, py + 4);
    ctx.fillStyle = "#f87171"; const uy = y1 - (Math.min(14, pHUnbuffered) / 14) * (y1 - y0); ctx.fillText(`without buffer: pH ${pHUnbuffered.toFixed(1)}`, bx + bw + 24, uy + 4);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("a buffer resists pH change", bx - 20, y0 - 14);
  }, [pKa, ratio, addAcid, pH, pHUnbuffered]);

  return (
    <StudioChrome title="Buffer Solution (Henderson–Hasselbalch)" tagline="resisting pH change"
      controls={<div>
        <Slider label="pKa of weak acid" value={pKa} min={2} max={10} step={0.1} onChange={setPKa} />
        <Slider label="[base]/[acid] ratio" value={ratio} min={0.1} max={10} step={0.1} onChange={setRatio} />
        <Slider label="Strong acid added (units)" value={addAcid} min={0} max={5} step={0.5} onChange={setAddAcid} />
        <p className="mt-3 text-xs text-slate-500">A buffer is a weak acid plus its conjugate base. Its pH follows Henderson–Hasselbalch, pH = pKa + log([base]/[acid]). Add strong acid and the buffer neutralizes most of it, so the pH barely moves — unlike pure water. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Buffer pH" value={pH.toFixed(2)} />
        <Stat label="Same acid, no buffer" value={pHUnbuffered.toFixed(1)} />
        <Stat label="pH change resisted" value={`${Math.max(0, pHUnbuffered - pH).toFixed(1)} units`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
