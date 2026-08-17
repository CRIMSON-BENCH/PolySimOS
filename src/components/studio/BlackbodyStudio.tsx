"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 460;

export function BlackbodyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [T, setT] = useState(5778); // Kelvin (Sun)

  const planck = (lambdaNm: number, temp: number) => { const h = 6.626e-34, c = 3e8, k = 1.381e-23; const l = lambdaNm * 1e-9; return (2 * h * c * c) / (Math.pow(l, 5) * (Math.exp((h * c) / (l * k * temp)) - 1)); };
  const peakNm = 2.898e6 / T; // Wien's law (nm)

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const pad = 44, loNm = 100, hiNm = 2500;
    let maxI = 0; for (let nm = loNm; nm <= hiNm; nm += 5) maxI = Math.max(maxI, planck(nm, T));
    const sx = (nm: number) => pad + ((nm - loNm) / (hiNm - loNm)) * (W - 2 * pad); const sy = (I: number) => H - pad - (I / maxI) * (H - 2 * pad);
    // visible band
    for (let nm = 380; nm <= 700; nm += 2) { ctx.fillStyle = wl(nm); ctx.globalAlpha = 0.25; ctx.fillRect(sx(nm), pad, sx(nm + 2) - sx(nm) + 1, H - 2 * pad); } ctx.globalAlpha = 1;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); let first = true; for (let nm = loNm; nm <= hiNm; nm += 4) { const x = sx(nm), y = sy(planck(nm, T)); first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false; } ctx.stroke();
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(sx(peakNm), pad); ctx.lineTo(sx(peakNm), H - pad); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`peak ${peakNm.toFixed(0)} nm (Wien)`, sx(peakNm) + 6, pad + 16); ctx.fillText("wavelength (nm) →", W - 150, H - 16); ctx.fillText("visible band shaded", pad, pad - 12);
  }, [T]);

  return (
    <StudioChrome title="Blackbody Radiation" tagline="Planck's law · Wien's displacement"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Every warm object glows with a Planck spectrum. Heat it up and the peak shifts to shorter (bluer) wavelengths — that&apos;s why stars range from red to blue-white.</p>
        <Slider label="Temperature (K)" value={T} min={1000} max={12000} step={100} onChange={setT} />
        <div className="mt-2 flex flex-wrap gap-1">{[["Ember", 1000], ["Bulb", 3000], ["Sun", 5778], ["Sirius", 9940]].map(([n, t]) => <button key={n as string} onClick={() => setT(t as number)} className="rounded-md border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-400">{n}</button>)}</div>
      </div>}
      inspector={<div><Stat label="Temperature" value={`${T} K`} /><Stat label="Peak wavelength" value={`${peakNm.toFixed(0)} nm`} /><Stat label="Color" value={peakNm < 450 ? "blue-white" : peakNm < 600 ? "white/yellow" : peakNm < 750 ? "red" : "infrared"} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}

function wl(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else { r = 1; }
  return `rgb(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0})`;
}
