"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Inverted pendulum on a cart, stabilized by state feedback.
export function CartPoleStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gain, setGain] = useState(1.0);
  const [disturb, setDisturb] = useState(0.4);
  const [control, setControl] = useState(true);
  const [running, setRunning] = useState(true);
  const st = useRef({ x: 0, xd: 0, th: 0.15, thd: 0 });
  const [balanced, setBalanced] = useState(true);

  const reset = () => { st.current = { x: 0, xd: 0, th: 0.15, thd: 0 }; };

  useEffect(() => {
    if (!running) return; let raf = 0; let s = 3; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 - 0.5; };
    const M = 1, m = 0.2, l = 1, g = 9.8, dt = 0.02;
    const loop = () => {
      const p = st.current;
      for (let k = 0; k < 2; k++) {
        let F = control ? -(gain * (-45 * p.th - 9 * p.thd - 2 * p.x - 3 * p.xd)) * 0 : 0;
        // state-feedback: F = -K·state (hand-tuned)
        F = control ? (55 * p.th + 12 * p.thd + 1.5 * p.x + 3 * p.xd) * gain : 0;
        F += rnd() * disturb * 20;
        const st_ = Math.sin(p.th), ct = Math.cos(p.th);
        const thdd = (g * st_ + ct * ((-F - m * l * p.thd * p.thd * st_) / (M + m))) / (l * (4 / 3 - m * ct * ct / (M + m)));
        const xdd = (F + m * l * (p.thd * p.thd * st_ - thdd * ct)) / (M + m);
        p.thd += thdd * dt; p.th += p.thd * dt; p.xd += xdd * dt; p.x += p.xd * dt;
        if (p.x < -2.4) { p.x = -2.4; p.xd = 0; } if (p.x > 2.4) { p.x = 2.4; p.xd = 0; }
      }
      setBalanced(Math.abs(p.th) < 0.5);
      const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const cy = H - 80, cx = W / 2 + p.x * 90; ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(0, cy + 16); ctx.lineTo(W, cy + 16); ctx.stroke();
      ctx.fillStyle = "#22d3ee"; ctx.fillRect(cx - 30, cy, 60, 16);
      const px = cx + Math.sin(p.th) * 120, py = cy - Math.cos(p.th) * 120;
      ctx.strokeStyle = balanced ? "#a3e635" : "#ef4444"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(px, py, 12, 0, 7); ctx.fill();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, gain, disturb, control]);

  return (
    <StudioChrome title="Cart-Pole Balance" tagline="inverted pendulum control"
      controls={<div>
        <Slider label="Controller gain" value={gain} min={0.3} max={2.5} step={0.1} onChange={setGain} />
        <Slider label="Disturbance" value={disturb} min={0} max={2} step={0.1} onChange={setDisturb} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={control} onChange={(e) => setControl(e.target.checked)} /> Controller on</label>
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={reset} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset</button></div>
        <p className="mt-3 text-xs text-slate-500">Balancing a pole on a moving cart is the classic control benchmark. A state-feedback controller senses the pole angle and cart position and pushes the cart to keep the pole upright. Turn the controller off and it topples instantly; add disturbance to test how hard it can fight back.</p>
      </div>}
      inspector={<div><Stat label="Pole angle" value={`${(st.current.th * 180 / Math.PI).toFixed(1)}°`} /><Stat label="Cart position" value={st.current.x.toFixed(2)} /><Stat label="Status" value={balanced ? "balanced" : "fallen"} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
