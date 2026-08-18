"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function BjtAmplifierStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [vcc, setVcc] = useState(12), [rc, setRc] = useState(2.2), [re, setRe] = useState(0.47), [ib, setIb] = useState(20), [beta, setBeta] = useState(150);
  const Ic = beta * ib / 1000; // mA (ib in µA)
  const Vrc = Ic * rc, Vre = Ic * re; // V (rc,re in kΩ, Ic in mA → V)
  const Vce = vcc - Vrc - Vre;
  const gain = -rc / re; // approx CE with emitter degeneration
  const saturated = Vce < 0.2;

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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

  return (
    <StudioChrome title="BJT Common-Emitter Amplifier" tagline="bias point & gain"
      controls={<div>
        <Slider label="Supply Vcc (V)" value={vcc} min={5} max={24} step={1} onChange={setVcc} />
        <Slider label="Collector Rc (kΩ)" value={rc} min={0.5} max={10} step={0.1} onChange={setRc} />
        <Slider label="Emitter Re (kΩ)" value={re} min={0.1} max={3} step={0.05} onChange={setRe} />
        <Slider label="Base current (µA)" value={ib} min={1} max={80} step={1} onChange={setIb} />
        <Slider label="Current gain β" value={beta} min={50} max={400} step={10} onChange={setBeta} />
        <p className="mt-3 text-xs text-slate-500">A transistor amplifies because a tiny base current controls a much larger collector current (Ic = β·Ib). The Q-point on the DC load line sets how much undistorted swing you get; too far and the transistor saturates or cuts off. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Collector current" value={`${Ic.toFixed(2)} mA`} />
        <Stat label="V_CE (bias)" value={`${Vce.toFixed(2)} V`} />
        <Stat label="Voltage gain" value={`${gain.toFixed(1)} ×`} />
        <Stat label="Region" value={saturated ? "saturated ⚠" : Vce > vcc - 0.5 ? "cutoff ⚠" : "active ✓"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
