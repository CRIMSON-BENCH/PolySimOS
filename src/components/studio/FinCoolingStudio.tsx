"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function FinCoolingStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(200), [h, setH] = useState(50), [t, setT] = useState(0.003), [L, setL] = useState(0.05), [Tb, setTb] = useState(100);
  const Tinf = 25;
  const m = Math.sqrt(2 * h / (k * t));
  const theta = (x: number) => Math.cosh(m * (L - x)) / Math.cosh(m * L);
  const eff = Math.tanh(m * L) / (m * L);
  const Ttip = Tinf + (Tb - Tinf) * theta(L);
  const q = Math.sqrt(2 * h * k * t) * (Tb - Tinf) * Math.tanh(m * L);

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const y = H / 2, len = W - 80;
    for (let i = 0; i < len; i++) { const x = i / len * L; const T = Tinf + (Tb - Tinf) * theta(x); const c01 = (T - Tinf) / (Tb - Tinf); ctx.fillStyle = `rgb(${Math.round(60 + c01 * 195)},${Math.round(90 + (1 - c01) * 120)},${Math.round(160 - c01 * 100)})`; ctx.fillRect(40 + i, y - 26, 1, 52); }
    ctx.strokeStyle = "#334155"; ctx.strokeRect(40, y - 26, len, 52);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`base ${Tb}°C`, 44, y - 34); ctx.fillText(`tip ${Ttip.toFixed(0)}°C`, 40 + len - 50, y - 34); ctx.fillText("heat conducts out along the fin, convects to air", 40, H - 16);
  }, [k, h, t, L, Tb, m]);

  return (
    <StudioChrome title="Fin Cooling" tagline="heat sinks & extended surfaces"
      controls={<div>
        <Slider label="Conductivity k (W/m·K)" value={k} min={15} max={400} step={5} onChange={setK} />
        <Slider label="Convection h (W/m²·K)" value={h} min={5} max={200} step={5} onChange={setH} />
        <Slider label="Fin thickness (m)" value={t} min={0.001} max={0.01} step={0.001} onChange={setT} />
        <Slider label="Fin length (m)" value={L} min={0.01} max={0.15} step={0.005} onChange={setL} />
        <Slider label="Base temp (°C)" value={Tb} min={40} max={150} step={5} onChange={setTb} />
        <p className="mt-3 text-xs text-slate-500">A fin extends a hot surface into the air to shed more heat. Temperature falls along it as θ(x)/θ_b = cosh(m(L−x))/cosh(mL). Long, thin, low-conductivity fins run cool at the tip — wasted area, captured by the fin efficiency. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Tip temperature" value={`${Ttip.toFixed(1)} °C`} />
        <Stat label="Fin efficiency" value={`${(eff * 100).toFixed(0)}%`} />
        <Stat label="Heat dissipated" value={`${q.toFixed(1)} W`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
