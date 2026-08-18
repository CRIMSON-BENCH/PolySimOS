"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { Vcc: number; R1: number; R2: number; Rc: number; Re: number; beta: number }> = {
  "Classic 12V": { Vcc: 12, R1: 47, R2: 10, Rc: 1, Re: 0.5, beta: 150 },
  "Low-power 5V": { Vcc: 5, R1: 100, R2: 22, Rc: 2, Re: 1, beta: 200 },
  "High-gain 15V": { Vcc: 15, R1: 68, R2: 12, Rc: 2.2, Re: 1, beta: 300 },
  "Near saturation": { Vcc: 9, R1: 22, R2: 22, Rc: 4.7, Re: 0.5, beta: 150 },
};

// BJT voltage-divider bias, Q-point on load line.
export function TransistorBiasStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ Vcc, R1, R2, Rc, Re, beta }, update] = useShareableNumbers({ Vcc: 12, R1: 47, R2: 10, Rc: 1, Re: 0.5, beta: 150 });

  const Vth = Vcc * R2 / (R1 + R2); const Rth = (R1 * R2) / (R1 + R2);
  const Ib = (Vth - 0.7) / (Rth + (beta + 1) * Re); // mA (kΩ, V -> mA)
  const Ic = beta * Ib; // mA
  const Vce = Vcc - Ic * (Rc + Re); // V
  const region = Vce < 0.2 ? "saturation" : Ic < 0.001 ? "cutoff" : "active";

  useEffect(() => {
    const W = 500, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 70, ph = H - 55; const IcMax = Vcc / (Rc + Re);
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // load line: Ic = (Vcc - Vce)/(Rc+Re)
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy - (IcMax / (IcMax * 1.1)) * ph); ctx.lineTo(ox + (Vcc / (Vcc * 1.05)) * pw, oy); ctx.stroke();
    // Q point
    const qx = ox + (Vce / (Vcc * 1.05)) * pw; const qy = oy - (Ic / (IcMax * 1.1)) * ph;
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(qx, qy, 6, 0, 7); ctx.fill();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox, qy); ctx.lineTo(qx, qy); ctx.lineTo(qx, oy); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("DC load line & Q-point", ox + 6, oy - ph + 12); ctx.fillText("Vce (V) →", ox + pw - 60, oy + 18); ctx.save(); ctx.translate(16, oy - ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("Ic (mA)", -20, 0); ctx.restore();
    ctx.fillStyle = "#f9a8d4"; ctx.fillText(`Q (${Vce.toFixed(1)}V, ${Ic.toFixed(2)}mA)`, qx + 8, qy - 6);
  }, [Vcc, R1, R2, Rc, Re, beta]);

  const explain =
    region === "saturation"
      ? "The Q-point has slid into saturation (Vce near 0) — the transistor is fully on and cannot amplify; lower Rc/Re or raise Vcc to pull it back into the active region."
      : region === "cutoff"
      ? "The base voltage is too low to turn the transistor on (cutoff) — almost no collector current flows; increase R2 or Vcc to lift the base above ~0.7 V."
      : Vce > Vcc * 0.75
      ? "The Q-point sits high on the load line (large Vce, small Ic) — plenty of voltage headroom but limited output swing before cutoff."
      : Vce < Vcc * 0.25
      ? "The Q-point sits low on the load line (small Vce) — close to saturation, so a large signal will clip on the bottom."
      : "The Q-point sits near mid-load-line — the sweet spot for a linear amplifier, giving the largest symmetric output swing.";

  const code = `Vcc, R1, R2, Rc, Re, beta = ${Vcc}, ${R1}, ${R2}, ${Rc}, ${Re}, ${beta}  # V, kOhm
Vth = Vcc * R2 / (R1 + R2)
Rth = R1 * R2 / (R1 + R2)
Ib = (Vth - 0.7) / (Rth + (beta + 1) * Re)  # mA
Ic = beta * Ib
Vce = Vcc - Ic * (Rc + Re)
print("Ic", round(Ic, 3), "mA  Vce", round(Vce, 2), "V")`;

  return (
    <StudioChrome title="BJT Transistor Bias" tagline="voltage-divider Q-point"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Supply Vcc (V)" value={Vcc} min={5} max={24} step={1} onChange={(v) => update({ Vcc: v })} />
        <Slider label="R1 (kΩ)" value={R1} min={10} max={200} step={1} onChange={(v) => update({ R1: v })} />
        <Slider label="R2 (kΩ)" value={R2} min={2} max={100} step={1} onChange={(v) => update({ R2: v })} />
        <Slider label="Collector Rc (kΩ)" value={Rc} min={0.2} max={10} step={0.1} onChange={(v) => update({ Rc: v })} />
        <Slider label="Emitter Re (kΩ)" value={Re} min={0} max={5} step={0.1} onChange={(v) => update({ Re: v })} />
        <Slider label="Current gain β" value={beta} min={50} max={400} step={10} onChange={(v) => update({ beta: v })} />
        <p className="mt-3 text-xs text-slate-500">Voltage-divider bias sets a transistor&apos;s operating point (Q-point) stably against variations in β. The base voltage fixes the emitter current, and the collector-emitter voltage falls on the DC load line. For a clean amplifier, the Q-point should sit near the middle of the active region.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Collector current Ic" value={`${Ic.toFixed(2)} mA`} /><Stat label="Vce" value={`${Vce.toFixed(2)} V`} /><Stat label="Base voltage" value={`${Vth.toFixed(2)} V`} /><Stat label="Region" value={region} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
