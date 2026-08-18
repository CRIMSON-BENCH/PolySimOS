"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { massNum: number }> = {
  "Deuterium (H-2)": { massNum: 2 },
  "Helium-4": { massNum: 4 },
  "Iron-56 (peak)": { massNum: 56 },
  "Uranium-235": { massNum: 235 },
};

// Semi-empirical mass formula: binding energy per nucleon.
function bePerA(A: number): number {
  if (A < 2) return 0; const Z = Math.round(A / (1.98 + 0.015 * Math.pow(A, 2 / 3)));
  const aV = 15.8, aS = 18.3, aC = 0.714, aA = 23.2; let d = 0; const even = (n: number) => n % 2 === 0;
  if (even(Z) && even(A - Z)) d = 12 / Math.sqrt(A); else if (!even(Z) && !even(A - Z)) d = -12 / Math.sqrt(A);
  const BE = aV * A - aS * Math.pow(A, 2 / 3) - aC * Z * (Z - 1) / Math.pow(A, 1 / 3) - aA * (A - 2 * Z) ** 2 / A + d;
  return BE / A;
}

export function BindingEnergyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ massNum }, update] = useShareableNumbers({ massNum: 56 });
  const be = bePerA(massNum);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const aMax = 250;
    const X = (a: number) => ox + (a / aMax) * pw; const Y = (v: number) => oy - (v / 9.5) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let a = 2; a <= aMax; a++) { const y = Y(bePerA(a)); a === 2 ? ctx.moveTo(X(a), y) : ctx.lineTo(X(a), y); } ctx.stroke();
    // iron peak
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(56), oy); ctx.lineTo(X(56), Y(bePerA(56))); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(massNum), Y(be), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("binding energy per nucleon (MeV)", ox + 6, oy - ph + 12); ctx.fillStyle = "#bef264"; ctx.fillText("Fe-56 peak", X(56) - 20, Y(bePerA(56)) - 8); ctx.fillStyle = "#94a3b8"; ctx.fillText("mass number A →", ox + pw - 110, oy + 16);
  }, [massNum]);

  const process = massNum < 56 ? "fusion releases energy" : "fission releases energy";

  const explain = massNum <= 4
    ? "Very light nuclei are only loosely bound; fusing them upward toward iron unleashes enormous energy — the reaction that powers the Sun."
    : massNum < 56
    ? "Below iron-56 a nucleus gains binding energy by fusing toward the peak, so fusion is the energy-releasing direction at this mass."
    : massNum === 56
    ? "Iron-56 sits at the very peak — the most tightly bound nucleus, where neither fusion nor fission can extract any more energy."
    : "Past the iron-56 peak, a heavy nucleus releases energy by splitting back toward it — the principle behind fission reactors and bombs.";

  const code = `import numpy as np
A = ${massNum}
Z = round(A / (1.98 + 0.015 * A ** (2 / 3)))
aV, aS, aC, aA = 15.8, 18.3, 0.714, 23.2
if Z % 2 == 0 and (A - Z) % 2 == 0: d = 12 / np.sqrt(A)
elif Z % 2 and (A - Z) % 2:         d = -12 / np.sqrt(A)
else:                                d = 0
BE = aV*A - aS*A**(2/3) - aC*Z*(Z-1)/A**(1/3) - aA*(A-2*Z)**2/A + d
print("BE per nucleon", BE / A, "MeV")`;

  return (
    <StudioChrome title="Nuclear Binding Energy" tagline="why stars shine and bombs work"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Mass number A" value={massNum} min={2} max={240} step={1} onChange={(v) => update({ massNum: v })} />
        <p className="mt-3 text-xs text-slate-500">The binding energy per nucleon measures how tightly a nucleus is held together, peaking at iron-56. Light nuclei release energy by fusing toward that peak — the power source of stars; heavy nuclei release energy by splitting toward it — the basis of fission reactors and bombs. Iron is the ash where both paths end.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="BE per nucleon" value={`${be.toFixed(2)} MeV`} />
        <Stat label="Total BE" value={`${(be * massNum).toFixed(0)} MeV`} />
        <Stat label="Energy path" value={process} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
