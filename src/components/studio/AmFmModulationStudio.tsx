"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function AmFmModulationStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [fc, setFc] = useState(20), [fm, setFm] = useState(2), [index, setIndex] = useState(0.7), [mode, setMode] = useState(0);
  const carrier = (t: number) => Math.cos(2 * Math.PI * fc * t);
  const msg = (t: number) => Math.cos(2 * Math.PI * fm * t);
  const modulated = (t: number) => mode ? Math.cos(2 * Math.PI * fc * t + index * 8 * Math.sin(2 * Math.PI * fm * t)) : (1 + index * msg(t)) * carrier(t);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pw = W - 60;
    const wave = (f: (t: number) => number, oy: number, amp: number, col: string, lbl: string) => { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = i / pw; const y = oy - f(t) * amp; i ? ctx.lineTo(30 + i, y) : ctx.moveTo(30 + i, y); } ctx.stroke(); ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText(lbl, 30, oy - amp - 6); };
    wave(msg, 55, 24, "#a3e635", "message"); wave(carrier, 140, 24, "#64748b", "carrier"); wave(modulated, 250, 46, "#22d3ee", mode ? "FM signal" : "AM signal");
  }, [fc, fm, index, mode]);

  return (
    <StudioChrome title="AM / FM Modulation" tagline="how radio carries sound"
      controls={<div>
        <label className="mb-2 block text-xs text-slate-400">Modulation</label>
        <select value={mode} onChange={(e) => setMode(Number(e.target.value))} className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><option value={0}>AM (amplitude)</option><option value={1}>FM (frequency)</option></select>
        <Slider label="Carrier frequency" value={fc} min={10} max={40} step={1} onChange={setFc} />
        <Slider label="Message frequency" value={fm} min={1} max={6} step={1} onChange={setFm} />
        <Slider label="Modulation index" value={index} min={0.1} max={1} step={0.05} onChange={setIndex} />
        <p className="mt-3 text-xs text-slate-500">Radio hides a low-frequency message inside a high-frequency carrier. AM varies the carrier&apos;s amplitude with the message; FM varies its frequency. FM resists noise better, which is why music stations use it. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Mode" value={mode ? "Frequency (FM)" : "Amplitude (AM)"} />
        <Stat label="Carrier / message" value={`${fc} / ${fm}`} />
        <Stat label="Modulation index" value={index.toFixed(2)} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
