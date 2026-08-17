"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const C = 299792; // km/s

export function HubbleStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [H0, setH0] = useState(70); // km/s/Mpc
  const galaxies = useRef<{ d: number; scatter: number }[]>([]);

  useEffect(() => { let s = 8675309; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    galaxies.current = Array.from({ length: 40 }, () => ({ d: 20 + rnd() * 900, scatter: (rnd() - 0.5) * 2 })); }, []);

  const ageGyr = (977.8 / H0); // 1/H0 in Gyr approx (Hubble time)

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 360; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 50, oy = H - 40, pw = W - 80, ph = H - 70;
    const maxD = 1000, maxV = H0 * maxD * 1.05;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // Hubble line v = H0 d
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy - (H0 * maxD / maxV) * ph); ctx.stroke();
    galaxies.current.forEach((g) => { const v = H0 * g.d + g.scatter * H0 * 15; const px = ox + (g.d / maxD) * pw; const py = oy - (v / maxV) * ph;
      ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 7); ctx.fillStyle = "#f472b6"; ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("distance (Mpc) →", ox + pw - 100, oy + 22); ctx.save(); ctx.translate(16, oy - ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("recession velocity (km/s)", -60, 0); ctx.restore();
  }, [H0]);

  return (
    <StudioChrome title="Hubble's Law & Redshift" tagline="the expanding universe"
      controls={<div>
        <Slider label="Hubble constant H₀ (km/s/Mpc)" value={H0} min={50} max={100} step={1} onChange={setH0} />
        <p className="mt-3 text-xs text-slate-500">Every distant galaxy recedes at a velocity proportional to its distance: v = H₀·d. This uniform expansion is the same seen from any galaxy — there is no center. The inverse of H₀ gives the Hubble time, a rough estimate of the age of the universe.</p>
      </div>}
      inspector={<div><Stat label="H₀" value={`${H0} km/s/Mpc`} /><Stat label="Hubble time" value={`${ageGyr.toFixed(1)} Gyr`} /><Stat label="v at 100 Mpc" value={`${(H0 * 100).toLocaleString()} km/s`} /></div>}
    ><canvas ref={canvasRef} width={520} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
