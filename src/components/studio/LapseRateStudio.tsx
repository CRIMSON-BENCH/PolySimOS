"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Atmospheric profile: T = T0 - lapse*z ; barometric pressure ; lifting condensation level.
export function LapseRateStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [T0, setT0] = useState(15); // surface temp C
  const [dew, setDew] = useState(8); // surface dew point C
  const [lapse, setLapse] = useState(6.5); // C/km environmental

  // LCL height (km) ~ (T - Td)/8 ; cloud base
  const lcl = Math.max(0, (T0 - dew) / 8);
  const P = (z: number) => 1013.25 * Math.pow(1 - 0.0065 * z * 1000 / (T0 + 273.15), 5.255);

  useEffect(() => {
    const W = 480, H = 400; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 40, ph = H - 70, pw = W - 90; const maxZ = 12; // km
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    // temperature profile (x = temp -80..30)
    const tx = (t: number) => ox + ((t + 80) / 110) * pw; const zy = (z: number) => oy - (z / maxZ) * ph;
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); for (let z = 0; z <= maxZ; z += 0.2) { const t = z < 11 ? T0 - lapse * z : T0 - lapse * 11; const x = tx(t), y = zy(z); z ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    // cloud base
    if (lcl < maxZ) { ctx.strokeStyle = "#a3e635"; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(ox, zy(lcl)); ctx.lineTo(ox + pw, zy(lcl)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#bef264"; ctx.font = "11px sans-serif"; ctx.fillText(`cloud base ${lcl.toFixed(1)} km`, ox + pw - 110, zy(lcl) - 6); ctx.fillStyle = "#e2e8f0"; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(ox + 40 + i * 60, zy(lcl) - 10, 10, 0, 7); ctx.fill(); } }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("temperature (°C) →", ox + pw - 110, oy + 20); ctx.save(); ctx.translate(16, oy - ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("altitude (km)", -30, 0); ctx.restore();
  }, [T0, dew, lapse, lcl]);

  return (
    <StudioChrome title="Atmospheric Lapse Rate & Cloud Base" tagline="temperature & pressure with altitude"
      controls={<div>
        <Slider label="Surface temperature (°C)" value={T0} min={-20} max={45} step={1} onChange={setT0} />
        <Slider label="Surface dew point (°C)" value={dew} min={-30} max={35} step={1} onChange={setDew} />
        <Slider label="Environmental lapse rate (°C/km)" value={lapse} min={2} max={10} step={0.1} onChange={setLapse} />
        <p className="mt-3 text-xs text-slate-500">Air cools with height at the environmental lapse rate. Rising air cools until it hits its dew point at the lifting condensation level — the cloud base — estimated by (T − Td)/8 km. The pressure falls with altitude following the barometric formula.</p>
      </div>}
      inspector={<div><Stat label="Cloud base" value={`${lcl.toFixed(2)} km`} /><Stat label="Pressure at 3 km" value={`${P(3).toFixed(0)} hPa`} /><Stat label="T at 5 km" value={`${(T0 - lapse * 5).toFixed(1)} °C`} /></div>}
    ><canvas ref={canvasRef} width={480} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
