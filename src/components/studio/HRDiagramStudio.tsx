"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Star color from temperature (approx blackbody)
function tempColor(T: number): string {
  if (T > 30000) return "#9bb0ff"; if (T > 10000) return "#aabfff"; if (T > 7500) return "#cad7ff";
  if (T > 6000) return "#fbf8ff"; if (T > 5200) return "#fff4e8"; if (T > 3700) return "#ffd2a1"; return "#ffb56c";
}
const SPECTRAL = (T: number) => T > 30000 ? "O" : T > 10000 ? "B" : T > 7500 ? "A" : T > 6000 ? "F" : T > 5200 ? "G" : T > 3700 ? "K" : "M";

export function HRDiagramStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [temp, setTemp] = useState(5778); // your star's temperature
  const stars = useRef<{ T: number; L: number; r: number }[]>([]);

  useEffect(() => { let s = 20261; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const arr: { T: number; L: number; r: number }[] = [];
    for (let i = 0; i < 400; i++) { const u = rnd(); const T = 3000 + Math.pow(rnd(), 2.2) * 25000; const L = Math.pow(T / 5778, 4) * (0.6 + rnd() * 0.8); arr.push({ T, L, r: 1 + rnd() }); } // main sequence
    for (let i = 0; i < 60; i++) { const T = 3200 + rnd() * 2200; arr.push({ T, L: 60 + rnd() * 3000, r: 2 }); } // red giants
    for (let i = 0; i < 25; i++) { const T = 8000 + rnd() * 20000; arr.push({ T, L: 0.001 + rnd() * 0.05, r: 1.4 }); } // white dwarfs
    for (let i = 0; i < 15; i++) { const T = 4000 + rnd() * 16000; arr.push({ T, L: 10000 + rnd() * 90000, r: 2.4 }); } // supergiants
    stars.current = arr; }, []);

  const L = Math.pow(temp / 5778, 4);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 420; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const x = (T: number) => W - 40 - ((T - 3000) / 32000) * (W - 70); // hot on left
    const y = (Lum: number) => 30 + (1 - (Math.log10(Lum) + 4) / 9) * (H - 70); // log L, -4..5
    ctx.strokeStyle = "#1e293b"; ctx.strokeRect(30, 20, W - 50, H - 50);
    stars.current.forEach((st) => { ctx.beginPath(); ctx.arc(x(st.T), y(st.L), st.r, 0, 7); ctx.fillStyle = tempColor(st.T); ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1; });
    // your star
    ctx.beginPath(); ctx.arc(x(temp), y(L), 8, 0, 7); ctx.fillStyle = tempColor(temp); ctx.fill(); ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("← hotter    temperature (K)    cooler →", 120, H - 12); ctx.save(); ctx.translate(14, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("luminosity (L☉, log)", -50, 0); ctx.restore();
  }, [temp]);

  return (
    <StudioChrome title="Hertzsprung-Russell Diagram" tagline="the map of the stars"
      controls={<div>
        <Slider label="Your star temperature (K)" value={temp} min={3000} max={35000} step={100} onChange={setTemp} />
        <div className="mt-3 flex flex-wrap gap-1">{[["Sun", 5778], ["Sirius", 9940], ["Betelgeuse", 3500], ["Rigel", 12100], ["Proxima", 3042]].map(([n, t]) => <button key={n} onClick={() => setTemp(t as number)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">{n}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">The H-R diagram plots stars by temperature and luminosity, revealing the main sequence (a diagonal band), red giants, supergiants, and white dwarfs. Your star (pink ring) sits on the main sequence where luminosity scales as T⁴.</p>
      </div>}
      inspector={<div><Stat label="Spectral class" value={SPECTRAL(temp)} /><Stat label="Luminosity" value={`${L.toFixed(2)} L☉`} /><Stat label="Temperature" value={`${temp.toLocaleString()} K`} /></div>}
    ><canvas ref={canvasRef} width={500} height={420} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
