"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function PumpCurveStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [h0, setH0] = useState(50), [k, setK] = useState(800), [hs, setHs] = useState(10), [cs, setCs] = useState(400);
  // pump: H = h0 - k Q² ; system: H = hs + cs Q² ; intersection
  const Qop = Math.sqrt(Math.max(0, (h0 - hs) / (k + cs)));
  const Hop = hs + cs * Qop * Qop;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const Qmax = Math.sqrt(h0 / k) * 1.05, Hmax = h0 * 1.05;
    const px = (q: number) => ox + (q / Qmax) * pw, py = (h: number) => oy - (h / Hmax) * ph;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const q = Qmax * i / pw; const y = py(Math.max(0, h0 - k * q * q)); i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const q = Qmax * i / pw; const y = py(hs + cs * q * q); i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(px(Qop), py(Hop), 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("pump (cyan) vs system (pink) → operating point", ox + 6, oy - ph + 12); ctx.fillText("flow Q →", ox + pw - 60, oy + 18);
  }, [h0, k, hs, cs, Qop, Hop]);

  return (
    <StudioChrome title="Pump & System Curves" tagline="finding the operating point"
      controls={<div>
        <Slider label="Pump shutoff head H₀ (m)" value={h0} min={20} max={100} step={2} onChange={setH0} />
        <Slider label="Pump droop k" value={k} min={200} max={2000} step={50} onChange={setK} />
        <Slider label="Static head (m)" value={hs} min={0} max={40} step={1} onChange={setHs} />
        <Slider label="System resistance c" value={cs} min={100} max={1500} step={50} onChange={setCs} />
        <p className="mt-3 text-xs text-slate-500">A pump delivers less head as flow rises; a piping system needs more head as flow rises. They meet at exactly one operating point — the flow and head the system will actually run at. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Operating flow" value={`${Qop.toFixed(3)} m³/s`} />
        <Stat label="Operating head" value={`${Hop.toFixed(1)} m`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
