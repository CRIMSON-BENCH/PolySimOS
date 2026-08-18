"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function OpenChannelStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [b, setB] = useState(3), [y, setY] = useState(1), [S, setS] = useState(0.001), [n, setN] = useState(0.013);
  const A = b * y, P = b + 2 * y, R = A / P;
  const V = (1 / n) * Math.pow(R, 2 / 3) * Math.sqrt(S);
  const Q = V * A;
  const Fr = V / Math.sqrt(9.81 * y);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, base = H - 60, bw = Math.min(360, b * 60), wh = Math.min(160, y * 90);
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - bw / 2 - 30, base - 120); ctx.lineTo(cx - bw / 2, base); ctx.lineTo(cx + bw / 2, base); ctx.lineTo(cx + bw / 2 + 30, base - 120); ctx.stroke();
    ctx.fillStyle = "#0e7490"; ctx.globalAlpha = 0.8; ctx.fillRect(cx - bw / 2, base - wh, bw, wh); ctx.globalAlpha = 1;
    ctx.strokeStyle = "#67e8f9"; ctx.beginPath(); ctx.moveTo(cx - bw / 2, base - wh); ctx.lineTo(cx + bw / 2, base - wh); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(Fr < 1 ? "subcritical (tranquil) flow" : "supercritical (rapid) flow", 20, 24); ctx.fillText(`Q = ${Q.toFixed(2)} m³/s`, 20, H - 16);
  }, [b, y, S, n, Q, Fr]);

  return (
    <StudioChrome title="Open-Channel Flow (Manning)" tagline="rivers, canals & storm drains"
      controls={<div>
        <Slider label="Channel width b (m)" value={b} min={0.5} max={8} step={0.5} onChange={setB} />
        <Slider label="Water depth y (m)" value={y} min={0.1} max={3} step={0.1} onChange={setY} />
        <Slider label="Bed slope S" value={S} min={0.0001} max={0.02} step={0.0001} onChange={setS} />
        <Slider label="Manning's n" value={n} min={0.01} max={0.05} step={0.001} onChange={setN} />
        <p className="mt-3 text-xs text-slate-500">Manning’s equation predicts flow in an open channel: V = (1/n)·R^⅔·√S, where R is the hydraulic radius and n the roughness. The Froude number tells you whether flow is tranquil (Fr &lt; 1) or rapid. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Velocity" value={`${V.toFixed(2)} m/s`} />
        <Stat label="Flow rate Q" value={`${Q.toFixed(2)} m³/s`} />
        <Stat label="Hydraulic radius" value={`${R.toFixed(3)} m`} />
        <Stat label="Froude number" value={Fr.toFixed(2)} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
