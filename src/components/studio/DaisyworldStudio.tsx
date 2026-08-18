"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Watson-Lovelock Daisyworld: self-regulating planetary temperature.
export function DaisyworldStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(true);
  const [lum, setLum] = useState(0.7);
  const [temp, setTemp] = useState(0);
  const [white, setWhite] = useState(0.2);
  const [black, setBlack] = useState(0.2);
  const hist = useRef<{ L: number; T: number; w: number; b: number }[]>([]);
  const dir = useRef(1);

  useEffect(() => {
    if (!running) return; let raf = 0;
    const Aw = 0.75, Ab = 0.25, Ag = 0.5; const SIGMA = 5.67e-8; const S0 = 917;
    const wr = { w: 0.2, b: 0.2, L: lum };
    const loop = () => {
      wr.L += dir.current * 0.0006; if (wr.L > 1.6) dir.current = -1; if (wr.L < 0.6) dir.current = 1;
      for (let it = 0; it < 4; it++) {
        const bare = Math.max(0, 1 - wr.w - wr.b); const A = wr.w * Aw + wr.b * Ab + bare * Ag;
        const Te = Math.pow(S0 * wr.L * (1 - A) / SIGMA, 0.25);
        const localT = (x: number) => Te + 20 * (A - x); // local temp for albedo x
        const growth = (Tl: number) => Math.max(0, 1 - 0.003265 * (295.5 - Tl) ** 2);
        const gw = growth(localT(Aw)), gb = growth(localT(Ab));
        wr.w += wr.w * (bare * gw - 0.3) * 0.4; wr.b += wr.b * (bare * gb - 0.3) * 0.4;
        wr.w = Math.min(1, Math.max(0.001, wr.w)); wr.b = Math.min(1, Math.max(0.001, wr.b));
        setTemp(Te - 273.15); setWhite(wr.w); setBlack(wr.b);
      }
      setLum(wr.L);
      const bare = Math.max(0, 1 - wr.w - wr.b); const A = wr.w * Aw + wr.b * Ab + bare * Ag; const Te = Math.pow(S0 * wr.L * (1 - A) / SIGMA, 0.25) - 273.15;
      hist.current.push({ L: wr.L, T: Te, w: wr.w, b: wr.b }); if (hist.current.length > 500) hist.current.shift();
      const W = 520, H = 360; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      // planet disk
      const cx = 90, cy = 90, R = 60; ctx.fillStyle = "#57534e"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      let s = 42; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = 0; i < 200; i++) { const a = rnd() * 7, rr = Math.sqrt(rnd()) * R; const dx = cx + Math.cos(a) * rr, dy = cy + Math.sin(a) * rr; const p = rnd(); if (p < wr.w) ctx.fillStyle = "#f8fafc"; else if (p < wr.w + wr.b) ctx.fillStyle = "#1c1917"; else continue; ctx.beginPath(); ctx.arc(dx, dy, 3, 0, 7); ctx.fill(); }
      // time series
      const ox = 180, oy = 320, pw = W - 200, ph = 260;
      ctx.strokeStyle = "#334155"; ctx.strokeRect(ox, oy - ph, pw, ph);
      const plot = (key: "T" | "w" | "b", col: string, min: number, max: number) => { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); hist.current.forEach((h, i) => { const x = ox + (i / 500) * pw; const y = oy - ((h[key] - min) / (max - min)) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); };
      plot("w", "#e2e8f0", 0, 1); plot("b", "#78716c", 0, 1); plot("T", "#f472b6", -20, 80);
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("white daisies", ox + 6, oy - ph + 14); ctx.fillText("black daisies", ox + 90, oy - ph + 14); ctx.fillStyle = "#f472b6"; ctx.fillText("temperature", ox + 180, oy - ph + 14);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <StudioChrome title="Daisyworld" tagline="planetary self-regulation (Gaia)"
      controls={<div>
        <button onClick={() => setRunning((r) => !r)} className="w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">Watson and Lovelock&apos;s Daisyworld shows how life can regulate a planet. Black daisies warm a cold world by absorbing sunlight; white daisies cool a hot one by reflecting it. As the sun brightens, the daisy mix shifts to hold the temperature nearly constant — biological homeostasis with no foresight.</p>
      </div>}
      inspector={<div><Stat label="Luminosity" value={lum.toFixed(2)} /><Stat label="Temperature" value={`${temp.toFixed(1)} °C`} /><Stat label="White / black" value={`${(white * 100).toFixed(0)}% / ${(black * 100).toFixed(0)}%`} /></div>}
    ><canvas ref={canvasRef} width={520} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
