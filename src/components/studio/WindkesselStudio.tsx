"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function WindkesselStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [R, setR] = useState(1.0), [C, setC] = useState(1.5), [hr, setHr] = useState(70), [sv, setSv] = useState(70);
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
  return (
    <StudioChrome title="Windkessel (Arterial Pressure)" tagline="why arteries smooth the pulse"
      controls={<div>
        <Slider label="Vascular resistance R" value={R} min={0.5} max={2.5} step={0.1} onChange={setR} />
        <Slider label="Arterial compliance C" value={C} min={0.5} max={3} step={0.1} onChange={setC} />
        <Slider label="Heart rate (bpm)" value={hr} min={40} max={160} step={5} onChange={setHr} />
        <Slider label="Stroke volume (mL)" value={sv} min={40} max={120} step={5} onChange={setSv} />
        <p className="mt-3 text-xs text-slate-500">The Windkessel model treats the aorta as an elastic reservoir: each heartbeat pumps blood in, and the artery&apos;s compliance stores it and releases it smoothly between beats. Stiffer arteries (low compliance) give sharper, higher pressure swings. Educational tool, not medical advice.</p>
      </div>}
      inspector={<div>
        <Stat label="Approx. pressure" value={`${map.toFixed(0)} mmHg`} />
        <Stat label="Time constant RC" value={`${(R * C).toFixed(2)} s`} />
        <Stat label="Cardiac output" value={`${(hr * sv / 1000).toFixed(1)} L/min`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
