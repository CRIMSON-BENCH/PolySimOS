"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;

export function FourierStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [harmonics, setHarmonics] = useState(8);
  const [wave, setWave] = useState<"square" | "sawtooth" | "triangle">("square");

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const mid = H / 2, amp = H * 0.32, pad = 30;
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(pad, mid); ctx.lineTo(W - pad, mid); ctx.stroke();
    const term = (n: number, t: number): number => {
      if (wave === "square") return n % 2 === 1 ? Math.sin(n * t) / n : 0;
      if (wave === "sawtooth") return (n % 2 === 0 ? -1 : 1) * Math.sin(n * t) / n;
      return n % 2 === 1 ? (n % 4 === 1 ? 1 : -1) * Math.sin(n * t) / (n * n) : 0; // triangle
    };
    const norm = wave === "square" ? 4 / Math.PI : wave === "sawtooth" ? 2 / Math.PI : 8 / (Math.PI * Math.PI);
    // partial harmonics faint
    for (let n = 1; n <= harmonics; n++) {
      ctx.strokeStyle = `hsla(${190 - (n / harmonics) * 120},80%,60%,0.25)`; ctx.lineWidth = 1; ctx.beginPath();
      for (let px = pad; px <= W - pad; px++) { const t = ((px - pad) / (W - 2 * pad)) * 4 * Math.PI; ctx.lineTo(px, mid - amp * norm * term(n, t)); }
      ctx.stroke();
    }
    // sum
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let px = pad; px <= W - pad; px++) { const t = ((px - pad) / (W - 2 * pad)) * 4 * Math.PI; let s = 0; for (let n = 1; n <= harmonics; n++) s += term(n, t); ctx.lineTo(px, mid - amp * norm * s); }
    ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`${wave} wave · ${harmonics} harmonics`, pad, 24);
  }, [harmonics, wave]);

  return (
    <StudioChrome title="Fourier Series Builder" tagline="synthesize waves from sinusoids"
      controls={<div>
        <div className="mb-3 flex gap-2">
          {(["square", "sawtooth", "triangle"] as const).map((m) => <button key={m} onClick={() => setWave(m)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold capitalize ${wave === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>)}
        </div>
        <p className="mb-3 text-xs text-slate-500">Add harmonics and watch sine waves sum into a square, sawtooth, or triangle wave — the Fourier series in action.</p>
        <Slider label="Harmonics" value={harmonics} min={1} max={50} step={1} onChange={setHarmonics} />
      </div>}
      inspector={<div><Stat label="Wave" value={wave} /><Stat label="Harmonics" value={String(harmonics)} /><Stat label="Basis" value="sine" /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
