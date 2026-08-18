"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { vcc: number; rc: number; re: number; ib: number; beta: number }> = {
  "Mid-bias (active)": { vcc: 12, rc: 2.2, re: 0.47, ib: 20, beta: 150 },
  "High gain": { vcc: 15, rc: 4.7, re: 0.1, ib: 10, beta: 200 },
  "Saturated": { vcc: 9, rc: 3.3, re: 0.47, ib: 40, beta: 200 },
  "Near cutoff": { vcc: 12, rc: 2.2, re: 0.47, ib: 1, beta: 50 },
};

export function BjtAmplifierStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ vcc, rc, re, ib, beta }, update] = useShareableNumbers({ vcc: 12, rc: 2.2, re: 0.47, ib: 20, beta: 150 });
  const Ic = beta * ib / 1000; // mA (ib in µA)
  const Vrc = Ic * rc, Vre = Ic * re; // V (rc,re in kΩ, Ic in mA → V)
  const Vce = vcc - Vrc - Vre;
  const gain = -rc / re; // approx CE with emitter degeneration
  const saturated = Vce < 0.2;
  const cutoff = Vce > vcc - 0.5;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 40, pw = W - 90, ph = H - 70;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // load line: Ic vs Vce, Ic_max = Vcc/(rc+re)
    const icMax = vcc / (rc + re);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy - (icMax / icMax) * ph); ctx.lineTo(ox + (vcc / vcc) * pw, oy); ctx.stroke();
    // Q point
    const qx = ox + (Math.max(0, Vce) / vcc) * pw, qy = oy - (Ic / icMax) * ph;
    ctx.fillStyle = saturated ? "#f87171" : "#a3e635"; ctx.beginPath(); ctx.arc(qx, qy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("DC load line & Q-point", ox + 6, oy - ph + 12); ctx.fillText("V_CE →", ox + pw - 44, oy + 20); ctx.fillText("I_C ↑", ox - 40, oy - ph + 10);
  }, [vcc, rc, re, ib, beta, Ic, Vce, saturated]);

  const explain = saturated
    ? `The Q-point has slammed into saturation (V_CE ≈ ${Vce.toFixed(1)} V): Rc drops nearly all of Vcc, so the output can’t swing — back off the base current or Rc.`
    : cutoff
    ? "Biased near cutoff: almost no collector current flows, so there’s little drop across Rc and no room to amplify — raise the base current to center the Q-point."
    : `Sitting in the active region with about ${Vce.toFixed(1)} V of V_CE headroom; the gain ≈ -Rc/Re ≈ ${gain.toFixed(1)}×, so shrinking Re trades bias stability for more voltage gain.`;

  const code = `vcc, rc, re, ib_uA, beta = ${vcc}, ${rc}, ${re}, ${ib}, ${beta}
Ic = beta * ib_uA / 1000          # mA
Vce = vcc - Ic*rc - Ic*re         # V
gain = -rc / re                   # small-signal, with emitter degeneration
print("Ic", round(Ic, 3), "mA  Vce", round(Vce, 3), "V  gain", round(gain, 2))`;

  return (
    <StudioChrome title="BJT Common-Emitter Amplifier" tagline="bias point & gain"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Supply Vcc (V)" value={vcc} min={5} max={24} step={1} onChange={(v) => update({ vcc: v })} />
        <Slider label="Collector Rc (kΩ)" value={rc} min={0.5} max={10} step={0.1} onChange={(v) => update({ rc: v })} />
        <Slider label="Emitter Re (kΩ)" value={re} min={0.1} max={3} step={0.05} onChange={(v) => update({ re: v })} />
        <Slider label="Base current (µA)" value={ib} min={1} max={80} step={1} onChange={(v) => update({ ib: v })} />
        <Slider label="Current gain β" value={beta} min={50} max={400} step={10} onChange={(v) => update({ beta: v })} />
        <p className="mt-3 text-xs text-slate-500">A transistor amplifies because a tiny base current controls a much larger collector current (Ic = β·Ib). The Q-point on the DC load line sets how much undistorted swing you get; too far and the transistor saturates or cuts off. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Collector current" value={`${Ic.toFixed(2)} mA`} />
        <Stat label="V_CE (bias)" value={`${Vce.toFixed(2)} V`} />
        <Stat label="Voltage gain" value={`${gain.toFixed(1)} ×`} />
        <Stat label="Region" value={saturated ? "saturated ⚠" : cutoff ? "cutoff ⚠" : "active ✓"} />
        <Equation tex={`V_{CE} = V_{CC} - I_C(R_C + R_E) = ${vcc} - ${Ic.toFixed(2)}\\,(${rc} + ${re}) = ${Vce.toFixed(2)}\\ \\text{V}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
