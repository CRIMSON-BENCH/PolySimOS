"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function SolubilityStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [s0, setS0] = useState(30), [slope, setSlope] = useState(1.2), [temp, setTemp] = useState(40), [amount, setAmount] = useState(80);
  const sol = (t: number) => s0 + slope * t;
  const solNow = sol(temp);
  const dissolved = Math.min(amount, solNow);
  const undissolved = Math.max(0, amount - solNow);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 32, pw = W - 65, ph = H - 52, smax = sol(100) * 1.1;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = 100 * i / pw; const y = oy - (sol(t) / smax) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // amount line
    const ay = oy - (amount / smax) * ph; ctx.strokeStyle = "#fbbf24"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox, ay); ctx.lineTo(ox + pw, ay); ctx.stroke(); ctx.setLineDash([]);
    const tx = ox + (temp / 100) * pw; ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(tx, oy - (solNow / smax) * ph, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("solubility (g/100 mL) vs temperature", ox + 6, oy - ph + 12); ctx.fillText("temperature °C →", ox + pw - 110, oy + 18);
  }, [s0, slope, temp, amount, solNow]);

  return (
    <StudioChrome title="Solubility & Saturation" tagline="how much dissolves"
      controls={<div>
        <Slider label="Solubility at 0°C (g/100mL)" value={s0} min={5} max={60} step={1} onChange={setS0} />
        <Slider label="Temperature coefficient" value={slope} min={0} max={3} step={0.1} onChange={setSlope} />
        <Slider label="Temperature (°C)" value={temp} min={0} max={100} step={1} onChange={setTemp} />
        <Slider label="Salt added (g/100mL)" value={amount} min={10} max={200} step={5} onChange={setAmount} />
        <p className="mt-3 text-xs text-slate-500">Most salts dissolve more readily as water warms. Below the solubility curve everything dissolves; above it, the excess stays as solid crystals. Cooling a saturated solution forces crystals out — the basis of recrystallization. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Solubility now" value={`${solNow.toFixed(0)} g/100mL`} />
        <Stat label="Dissolved" value={`${dissolved.toFixed(0)} g`} />
        <Stat label="Undissolved solid" value={`${undissolved.toFixed(0)} g`} />
        <Stat label="State" value={undissolved > 0 ? "saturated + solid" : "unsaturated"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
