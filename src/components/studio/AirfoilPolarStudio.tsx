"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function AirfoilPolarStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aoa, setAoa] = useState(6);
  const [aspect, setAspect] = useState(8);

  const clSlope = 2 * Math.PI / (1 + 2 / aspect); // per radian, finite wing
  const stallDeg = 15;
  const cl = (a: number) => { if (a <= stallDeg) return clSlope * a * Math.PI / 180; return clSlope * stallDeg * Math.PI / 180 * Math.max(0.3, 1 - (a - stallDeg) * 0.06); };
  const clv = cl(aoa); const cd0 = 0.02; const cd = cd0 + clv * clv / (Math.PI * aspect * 0.85); const ld = clv / cd;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 340; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    const X = (a: number) => ox + ((a + 4) / 30) * pw; const Y = (c: number) => oy - (c / 1.8) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let a = -4; a <= 26; a += 0.5) { const y = Y(cl(a)); a === -4 ? ctx.moveTo(X(a), y) : ctx.lineTo(X(a), y); } ctx.stroke();
    // stall marker
    ctx.strokeStyle = "#f472b6"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(stallDeg), oy); ctx.lineTo(X(stallDeg), oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(X(aoa), Y(clv), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("lift coefficient CL vs angle of attack", ox + 6, oy - ph + 12); ctx.fillStyle = "#f9a8d4"; ctx.fillText("stall", X(stallDeg) + 3, oy - ph + 26); ctx.fillStyle = "#94a3b8"; ctx.fillText("AoA (°) →", ox + pw - 60, oy + 16);
  }, [aoa, aspect]);

  return (
    <StudioChrome title="Airfoil Lift & Drag" tagline="the wing's polar"
      controls={<div>
        <Slider label="Angle of attack (°)" value={aoa} min={-4} max={25} step={0.5} onChange={setAoa} />
        <Slider label="Aspect ratio" value={aspect} min={2} max={20} step={0.5} onChange={setAspect} />
        <p className="mt-3 text-xs text-slate-500">Lift rises almost linearly with angle of attack — until the airflow separates and the wing stalls, losing lift sharply. Drag has a fixed part plus induced drag that grows with lift squared and shrinks with aspect ratio. The lift-to-drag ratio, peaking at a modest angle, is the single number that governs a wing&apos;s efficiency.</p>
      </div>}
      inspector={<div><Stat label="Lift coeff. CL" value={clv.toFixed(2)} /><Stat label="Drag coeff. CD" value={cd.toFixed(3)} /><Stat label="Lift/Drag" value={ld.toFixed(1)} /><Stat label="Status" value={aoa > stallDeg ? "stalled" : "attached"} /></div>}
    ><canvas ref={canvasRef} width={500} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
