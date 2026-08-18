"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { s0: number; slope: number; temp: number; amount: number }> = {
  "Table salt": { s0: 36, slope: 0.1, temp: 25, amount: 50 },
  "Potassium nitrate": { s0: 13, slope: 2.5, temp: 60, amount: 120 },
  "Recrystallize": { s0: 20, slope: 1.8, temp: 10, amount: 90 },
  "Hot & saturated": { s0: 40, slope: 1.2, temp: 90, amount: 160 },
};

export function SolubilityStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ s0, slope, temp, amount }, update] = useShareableNumbers({ s0: 30, slope: 1.2, temp: 40, amount: 80 });
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

  const explain =
    undissolved > 0
      ? `At ${temp}°C only ${solNow.toFixed(0)} g/100mL will dissolve, so ${undissolved.toFixed(0)} g stays as solid — the solution is saturated and sitting on the curve.`
      : slope < 0.3
      ? `A near-flat temperature coefficient means heating barely helps here — solubility stays around ${solNow.toFixed(0)} g/100mL no matter the temperature.`
      : dissolved > 0.9 * solNow
      ? `Everything dissolves, but at ${(dissolved / solNow * 100).toFixed(0)}% of capacity you are close to saturation — a little cooling would drop crystals out.`
      : `The added ${amount} g dissolves easily below the ${solNow.toFixed(0)} g/100mL ceiling, leaving an unsaturated solution with room to spare.`;

  const pyCode = `s0, slope, temp, amount = ${s0}, ${slope}, ${temp}, ${amount}
sol = lambda t: s0 + slope * t
sol_now = sol(temp)
dissolved = min(amount, sol_now)
undissolved = max(0, amount - sol_now)
print("solubility", sol_now, "dissolved", dissolved, "solid", undissolved)`;

  return (
    <StudioChrome title="Solubility & Saturation" tagline="how much dissolves"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Solubility at 0°C (g/100mL)" value={s0} min={5} max={60} step={1} onChange={(v) => update({ s0: v })} />
        <Slider label="Temperature coefficient" value={slope} min={0} max={3} step={0.1} onChange={(v) => update({ slope: v })} />
        <Slider label="Temperature (°C)" value={temp} min={0} max={100} step={1} onChange={(v) => update({ temp: v })} />
        <Slider label="Salt added (g/100mL)" value={amount} min={10} max={200} step={5} onChange={(v) => update({ amount: v })} />
        <p className="mt-3 text-xs text-slate-500">Most salts dissolve more readily as water warms. Below the solubility curve everything dissolves; above it, the excess stays as solid crystals. Cooling a saturated solution forces crystals out — the basis of recrystallization. Educational tool.</p>
        <ShareBar code={pyCode} />
      </div>}
      inspector={<div>
        <Stat label="Solubility now" value={`${solNow.toFixed(0)} g/100mL`} />
        <Stat label="Dissolved" value={`${dissolved.toFixed(0)} g`} />
        <Stat label="Undissolved solid" value={`${undissolved.toFixed(0)} g`} />
        <Stat label="State" value={undissolved > 0 ? "saturated + solid" : "unsaturated"} />
        <Equation tex={`S(T) = S_0 + kT = ${s0} + ${slope}\\times ${temp} = ${solNow.toFixed(0)}\\ \\text{g/100mL}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
