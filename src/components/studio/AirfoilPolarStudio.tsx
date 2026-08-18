"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { aoa: number; aspect: number }> = {
  "Cruise (low AoA)": { aoa: 4, aspect: 12 },
  "Climb": { aoa: 9, aspect: 10 },
  "Near stall": { aoa: 14, aspect: 8 },
  "Stalled": { aoa: 20, aspect: 6 },
};

export function AirfoilPolarStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ aoa, aspect }, update] = useShareableNumbers({ aoa: 6, aspect: 8 });

  const clSlope = 2 * Math.PI / (1 + 2 / aspect); // per radian, finite wing
  const stallDeg = 15;
  const cl = (a: number) => { if (a <= stallDeg) return clSlope * a * Math.PI / 180; return clSlope * stallDeg * Math.PI / 180 * Math.max(0.3, 1 - (a - stallDeg) * 0.06); };
  const clv = cl(aoa); const cd0 = 0.02; const cd = cd0 + clv * clv / (Math.PI * aspect * 0.85); const ld = clv / cd;

  useEffect(() => {
    const W = 500, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    const X = (a: number) => ox + ((a + 4) / 30) * pw; const Y = (c: number) => oy - (c / 1.8) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let a = -4; a <= 26; a += 0.5) { const y = Y(cl(a)); a === -4 ? ctx.moveTo(X(a), y) : ctx.lineTo(X(a), y); } ctx.stroke();
    // stall marker
    ctx.strokeStyle = "#f472b6"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(stallDeg), oy); ctx.lineTo(X(stallDeg), oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(X(aoa), Y(clv), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("lift coefficient CL vs angle of attack", ox + 6, oy - ph + 12); ctx.fillStyle = "#f9a8d4"; ctx.fillText("stall", X(stallDeg) + 3, oy - ph + 26); ctx.fillStyle = "#94a3b8"; ctx.fillText("AoA (°) →", ox + pw - 60, oy + 16);
  }, [aoa, aspect]);

  const explain =
    aoa > stallDeg
      ? `Stalled: at ${aoa}° the flow has separated past the ~${stallDeg}° stall angle, so lift has collapsed off its peak while drag spikes.`
      : aoa > stallDeg - 3
      ? `Near stall: ${aoa}° sits just below the ~${stallDeg}° stall angle — lift is near its maximum, but a little more incidence will separate the flow and drop it.`
      : aoa < 0
      ? `Below the zero-lift line: at ${aoa}° this symmetric-airfoil model gives little or negative lift. Adding camber would shift the whole curve up so lift is positive here.`
      : `Pre-stall: lift rises almost linearly with angle of attack at ${aoa}°, well below the ~${stallDeg}° stall angle. Adding camber would lift the entire curve higher.`;

  const code = `import numpy as np
aoa, aspect = ${aoa}, ${aspect}
stall_deg = 15
cl_slope = 2*np.pi / (1 + 2/aspect)   # per radian, finite wing
def cl(a):
    if a <= stall_deg:
        return cl_slope * np.radians(a)
    return cl_slope * np.radians(stall_deg) * max(0.3, 1 - (a - stall_deg)*0.06)
clv = cl(aoa)
cd0 = 0.02
cd = cd0 + clv**2 / (np.pi * aspect * 0.85)   # profile + induced drag
print("CL", round(clv, 3), "CD", round(cd, 4), "L/D", round(clv/cd, 1))`;

  return (
    <StudioChrome title="Airfoil Lift & Drag" tagline="the wing's polar"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Angle of attack (°)" value={aoa} min={-4} max={25} step={0.5} onChange={(v) => update({ aoa: v })} />
        <Slider label="Aspect ratio" value={aspect} min={2} max={20} step={0.5} onChange={(v) => update({ aspect: v })} />
        <p className="mt-3 text-xs text-slate-500">Lift rises almost linearly with angle of attack — until the airflow separates and the wing stalls, losing lift sharply. Drag has a fixed part plus induced drag that grows with lift squared and shrinks with aspect ratio. The lift-to-drag ratio, peaking at a modest angle, is the single number that governs a wing&apos;s efficiency.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Lift coeff. CL" value={clv.toFixed(2)} /><Stat label="Drag coeff. CD" value={cd.toFixed(3)} /><Stat label="Lift/Drag" value={ld.toFixed(1)} /><Stat label="Status" value={aoa > stallDeg ? "stalled" : "attached"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
