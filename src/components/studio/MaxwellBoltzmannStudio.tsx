"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 740, H = 440;

const PRESETS: Record<string, { temp: number; mass: number }> = {
  "Room air (O₂)": { temp: 300, mass: 32 },
  "Hot forge": { temp: 1000, mass: 32 },
  "Cold helium": { temp: 100, mass: 4 },
  "Heavy vapor": { temp: 300, mass: 132 },
};

export function MaxwellBoltzmannStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ temp, mass }, update] = useShareableNumbers({ temp: 300, mass: 32 });

  const data = useMemo(() => {
    const a = mass / (2 * 8.314 * temp) * 1000; const xs: number[] = [], ys: number[] = []; let maxY = 0;
    for (let v = 0; v <= 1500; v += 10) { const f = 4 * Math.PI * v * v * Math.pow(a / Math.PI, 1.5) * Math.exp(-a * v * v); xs.push(v); ys.push(f); if (f > maxY) maxY = f; }
    const vmp = Math.sqrt(1 / a); const vavg = 2 / Math.sqrt(Math.PI * a); const vrms = Math.sqrt(1.5 / a);
    return { xs, ys, maxY, vmp, vavg, vrms };
  }, [temp, mass]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const pad = 40;
    const sx = (v: number) => pad + (v / 1500) * (W - 2 * pad); const sy = (y: number) => H - pad - (y / data.maxY) * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); data.xs.forEach((v, i) => i ? ctx.lineTo(sx(v), sy(data.ys[i])) : ctx.moveTo(sx(v), sy(data.ys[i]))); ctx.stroke();
    ctx.lineTo(sx(1500), H - pad); ctx.lineTo(pad, H - pad); ctx.closePath(); ctx.fillStyle = "rgba(34,211,238,0.12)"; ctx.fill();
    ctx.strokeStyle = "rgba(163,230,53,0.6)"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(sx(data.vmp), pad); ctx.lineTo(sx(data.vmp), H - pad); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("molecular speed distribution", pad, 22); ctx.fillText("speed (m/s) →", W - 120, H - 14); ctx.fillText(`v_mp ${data.vmp.toFixed(0)}`, sx(data.vmp) + 6, pad + 16);
  }, [data]);

  const explain =
    mass <= 8
      ? `Light molecules barely feel inertia, so the peak sits far to the right near ${data.vmp.toFixed(0)} m/s with a broad, fast tail.`
      : temp >= 700
      ? `Heating widens and flattens the curve — the most-probable speed climbs as the square root of T, here to ${data.vmp.toFixed(0)} m/s.`
      : mass >= 100
      ? `Heavy molecules move sluggishly, so the distribution is narrow and shifted left, peaking around ${data.vmp.toFixed(0)} m/s.`
      : `The peak (v_mp ${data.vmp.toFixed(0)} m/s) sits below the average and RMS speeds because the long high-speed tail pulls those means upward.`;

  const code = `import numpy as np
T, M = ${temp}, ${mass}          # temperature (K), molar mass (g/mol)
a = M/(2*8.314*T)*1000
v = np.arange(0, 1500, 10)
f = 4*np.pi*v**2*(a/np.pi)**1.5*np.exp(-a*v**2)
vmp = np.sqrt(1/a); vavg = 2/np.sqrt(np.pi*a); vrms = np.sqrt(1.5/a)
print("v_mp", vmp, "v_avg", vavg, "v_rms", vrms)`;

  return (
    <StudioChrome title="Maxwell–Boltzmann Distribution" tagline="molecular speeds in a gas"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Gas molecules do not all move at one speed — they spread into this distribution. Heat the gas or lighten the molecule and the curve broadens and shifts faster.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Temperature (K)" value={temp} min={100} max={1000} step={25} onChange={(v) => update({ temp: v })} />
        <Slider label="Molar mass (g/mol)" value={mass} min={2} max={132} step={2} onChange={(v) => update({ mass: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Most probable" value={`${data.vmp.toFixed(0)} m/s`} /><Stat label="Average" value={`${data.vavg.toFixed(0)} m/s`} /><Stat label="RMS" value={`${data.vrms.toFixed(0)} m/s`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
