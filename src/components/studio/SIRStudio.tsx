"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function SIRStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [r0, setR0] = useState(2.5);
  const [infPeriod, setInfPeriod] = useState(7); // days
  const [vacc, setVacc] = useState(0); // initial immune fraction
  const [peakI, setPeakI] = useState(0);
  const [totalInf, setTotalInf] = useState(0);

  useEffect(() => {
    const gamma = 1 / infPeriod; const beta = r0 * gamma; const days = 160; const dt = 0.1;
    let S = 1 - vacc - 1e-4, I = 1e-4, R = vacc; const S0 = S;
    const sArr: number[] = [], iArr: number[] = [], rArr: number[] = []; let pI = 0;
    for (let t = 0; t < days / dt; t++) {
      const dS = -beta * S * I, dI = beta * S * I - gamma * I, dR = gamma * I;
      S += dS * dt; I += dI * dt; R += dR * dt; pI = Math.max(pI, I);
      if (t % 5 === 0) { sArr.push(S); iArr.push(I); rArr.push(R); }
    }
    setPeakI(pI); setTotalInf(R - vacc);
    const W = 540, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 60, ph = H - 50;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const plot = (arr: number[], col: string) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); arr.forEach((v, i) => { const x = ox + (i / arr.length) * pw; const y = oy - v * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); };
    plot(sArr, "#22d3ee"); plot(iArr, "#f472b6"); plot(rArr, "#a3e635");
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#22d3ee"; ctx.fillText("Susceptible", ox + 8, oy - ph + 14); ctx.fillStyle = "#f472b6"; ctx.fillText("Infected", ox + 90, oy - ph + 14); ctx.fillStyle = "#a3e635"; ctx.fillText("Recovered", ox + 150, oy - ph + 14);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("time (days) →", ox + pw - 80, oy + 18); void S0;
  }, [r0, infPeriod, vacc]);

  const herd = 1 - 1 / r0;

  return (
    <StudioChrome title="SIR Epidemic Model" tagline="compartmental disease dynamics"
      controls={<div>
        <Slider label="Basic reproduction R₀" value={r0} min={0.5} max={6} step={0.1} onChange={setR0} />
        <Slider label="Infectious period (days)" value={infPeriod} min={1} max={21} step={1} onChange={setInfPeriod} />
        <Slider label="Initial immune (vaccinated)" value={vacc} min={0} max={0.9} step={0.05} onChange={setVacc} />
        <p className="mt-3 text-xs text-slate-500">The SIR model splits a population into Susceptible, Infected, and Recovered and lets them flow between compartments. R₀ — the average number infected by one case — sets whether an outbreak grows. Vaccinating above the herd-immunity threshold 1−1/R₀ prevents an epidemic outright.</p>
      </div>}
      inspector={<div><Stat label="Peak infected" value={`${(peakI * 100).toFixed(1)}%`} /><Stat label="Total infected" value={`${(totalInf * 100).toFixed(1)}%`} /><Stat label="Herd immunity" value={`${(herd * 100).toFixed(0)}%`} /></div>}
    ><canvas ref={canvasRef} width={540} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
