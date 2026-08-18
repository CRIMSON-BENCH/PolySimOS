"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// DC motor step response + speed-torque curve.
export function DCMotorStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [V, setV] = useState(12);
  const [R, setR] = useState(2); // ohm
  const [load, setLoad] = useState(0.02); // N·m load torque
  const [ke, setKe] = useState(0.05); // back-emf / torque constant

  // steady state: omega_ss where Kt*(V - Ke*w)/R = load  => w = (V/Ke) - load*R/(Kt*Ke)
  const Kt = ke; const noLoadSpeed = V / ke; const stallTorque = Kt * V / R;
  const omegaSS = (V - load * R / Kt) / ke;
  const tau = 0.15; // mechanical time constant (illustrative)
  const currentSS = (V - ke * omegaSS) / R;

  useEffect(() => {
    const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // step response (left)
    const ox = 40, oy = 150, pw = 280, ph = 120;
    ctx.strokeStyle = "#334155"; ctx.strokeRect(ox, oy - ph, pw, ph);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = (i / pw) * 1.0; const w = omegaSS * (1 - Math.exp(-t / tau)); const y = oy - (w / (noLoadSpeed * 1.05)) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("speed step response", ox + 4, oy - ph - 6); ctx.fillText("time →", ox + pw - 40, oy + 14);
    // speed-torque curve (right)
    const rx = 370, ry = 290, rw = 140, rh = 240;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + rw, ry); ctx.moveTo(rx, ry); ctx.lineTo(rx, ry - rh); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, ry - rh * 0.95); ctx.lineTo(rx + rw * 0.95, ry); ctx.stroke();
    // operating point
    const opx = rx + (load / stallTorque) * rw * 0.95; const opy = ry - (omegaSS / noLoadSpeed) * rh * 0.95;
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(opx, opy, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.fillText("speed", rx - 4, ry - rh - 4); ctx.fillText("torque →", rx + rw - 44, ry + 14); ctx.fillStyle = "#f9a8d4"; ctx.fillText("speed-torque line", rx - 20, ry - rh - 20);
  }, [V, R, load, ke]);

  return (
    <StudioChrome title="DC Motor" tagline="step response & speed-torque"
      controls={<div>
        <Slider label="Voltage (V)" value={V} min={3} max={24} step={1} onChange={setV} />
        <Slider label="Armature resistance (Ω)" value={R} min={0.5} max={10} step={0.5} onChange={setR} />
        <Slider label="Load torque (N·m)" value={load} min={0} max={0.3} step={0.01} onChange={setLoad} />
        <Slider label="Motor constant Kt (N·m/A)" value={ke} min={0.02} max={0.2} step={0.01} onChange={setKe} />
        <p className="mt-3 text-xs text-slate-500">A DC motor speeds up until back-EMF balances the applied voltage, giving a first-order step response. Its steady speed drops linearly with load along the speed-torque line: maximum speed at no load, maximum (stall) torque at zero speed. The green dot is the operating point where motor and load torque match.</p>
      </div>}
      inspector={<div><Stat label="No-load speed" value={`${noLoadSpeed.toFixed(0)} rad/s`} /><Stat label="Steady speed" value={`${omegaSS.toFixed(0)} rad/s`} /><Stat label="Stall torque" value={`${stallTorque.toFixed(2)} N·m`} /><Stat label="Current draw" value={`${currentSS.toFixed(1)} A`} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
