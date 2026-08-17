"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// BJT voltage-divider bias, Q-point on load line.
export function TransistorBiasStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [Vcc, setVcc] = useState(12);
  const [R1, setR1] = useState(47); // kΩ
  const [R2, setR2] = useState(10); // kΩ
  const [Rc, setRc] = useState(1); // kΩ
  const [Re, setRe] = useState(0.5); // kΩ
  const [beta, setBeta] = useState(150);

  const Vth = Vcc * R2 / (R1 + R2); const Rth = (R1 * R2) / (R1 + R2);
  const Ib = (Vth - 0.7) / (Rth + (beta + 1) * Re); // mA (kΩ, V -> mA)
  const Ic = beta * Ib; // mA
  const Vce = Vcc - Ic * (Rc + Re); // V
  const region = Vce < 0.2 ? "saturation" : Ic < 0.001 ? "cutoff" : "active";

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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

  return (
    <StudioChrome title="BJT Transistor Bias" tagline="voltage-divider Q-point"
      controls={<div>
        <Slider label="Supply Vcc (V)" value={Vcc} min={5} max={24} step={1} onChange={setVcc} />
        <Slider label="R1 (kΩ)" value={R1} min={10} max={200} step={1} onChange={setR1} />
        <Slider label="R2 (kΩ)" value={R2} min={2} max={100} step={1} onChange={setR2} />
        <Slider label="Collector Rc (kΩ)" value={Rc} min={0.2} max={10} step={0.1} onChange={setRc} />
        <Slider label="Emitter Re (kΩ)" value={Re} min={0} max={5} step={0.1} onChange={setRe} />
        <Slider label="Current gain β" value={beta} min={50} max={400} step={10} onChange={setBeta} />
        <p className="mt-3 text-xs text-slate-500">Voltage-divider bias sets a transistor&apos;s operating point (Q-point) stably against variations in β. The base voltage fixes the emitter current, and the collector-emitter voltage falls on the DC load line. For a clean amplifier, the Q-point should sit near the middle of the active region.</p>
      </div>}
      inspector={<div><Stat label="Collector current Ic" value={`${Ic.toFixed(2)} mA`} /><Stat label="Vce" value={`${Vce.toFixed(2)} V`} /><Stat label="Base voltage" value={`${Vth.toFixed(2)} V`} /><Stat label="Region" value={region} /></div>}
    ><canvas ref={canvasRef} width={500} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
