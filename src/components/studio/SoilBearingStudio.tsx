"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { c: number; phi: number; gamma: number; B: number; depth: number; FS: number }> = {
  "Soft clay": { c: 40, phi: 0, gamma: 16, B: 2, depth: 1, FS: 3 },
  "Dense sand": { c: 0, phi: 38, gamma: 20, B: 2, depth: 1.5, FS: 3 },
  "Silty loam": { c: 10, phi: 25, gamma: 18, B: 2.5, depth: 1.5, FS: 3 },
  "Deep footing": { c: 15, phi: 30, gamma: 19, B: 3, depth: 3, FS: 3 },
};

// Terzaghi bearing capacity for a strip footing.
export function SoilBearingStudio() {
  const [{ c, phi, gamma, B, depth, FS }, update] = useShareableNumbers({ c: 10, phi: 30, gamma: 18, B: 2, depth: 1.5, FS: 3 });

  const phiR = phi * Math.PI / 180;
  const Nq = Math.exp(Math.PI * Math.tan(phiR)) * Math.tan(Math.PI / 4 + phiR / 2) ** 2;
  const Nc = phi === 0 ? 5.14 : (Nq - 1) / Math.tan(phiR);
  const Ngamma = 2 * (Nq + 1) * Math.tan(phiR);
  const q = gamma * depth;
  const qult = c * Nc + q * Nq + 0.5 * gamma * B * Ngamma; // kPa
  const qallow = qult / FS;
  const capacity = qallow * B; // kN/m per unit length

  const explain =
    phi === 0
      ? "Purely cohesive soil (φ = 0): capacity comes almost entirely from the cohesion term via Nc ≈ 5.14 — footing width barely matters here."
      : phi >= 35
      ? "High friction angle: Nq and Nγ climb steeply, so embedment surcharge and footing width dominate the capacity rather than cohesion."
      : "Mixed c-φ soil: all three terms contribute — deeper embedment and a wider footing both push the ultimate capacity higher.";

  const code = `import numpy as np
c, phi, gamma, B, depth, FS = ${c}, ${phi}, ${gamma}, ${B}, ${depth}, ${FS}
phiR = np.radians(phi)
Nq = np.exp(np.pi * np.tan(phiR)) * np.tan(np.pi / 4 + phiR / 2) ** 2
Nc = 5.14 if phi == 0 else (Nq - 1) / np.tan(phiR)
Ng = 2 * (Nq + 1) * np.tan(phiR)
qult = c * Nc + gamma * depth * Nq + 0.5 * gamma * B * Ng
print("qult", qult, "qallow", qult / FS)`;

  return (
    <StudioChrome title="Soil Bearing Capacity (Terzaghi)" tagline="foundation design"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Cohesion c (kPa)" value={c} min={0} max={100} step={5} onChange={(v) => update({ c: v })} />
        <Slider label="Friction angle φ (°)" value={phi} min={0} max={40} step={1} onChange={(v) => update({ phi: v })} />
        <Slider label="Unit weight γ (kN/m³)" value={gamma} min={14} max={22} step={0.5} onChange={(v) => update({ gamma: v })} />
        <Slider label="Footing width B (m)" value={B} min={0.5} max={5} step={0.1} onChange={(v) => update({ B: v })} />
        <Slider label="Embedment depth (m)" value={depth} min={0.5} max={4} step={0.25} onChange={(v) => update({ depth: v })} />
        <Slider label="Factor of safety" value={FS} min={2} max={4} step={0.5} onChange={(v) => update({ FS: v })} />
        <p className="mt-3 text-xs text-slate-500">Terzaghi&apos;s equation predicts the ultimate bearing capacity of a shallow footing as the sum of cohesion, surcharge, and self-weight terms, each with a bearing-capacity factor that grows sharply with the soil friction angle. Dividing by a factor of safety gives the allowable pressure. Educational tool, not a geotechnical design.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Nc" value={Nc.toFixed(1)} /><Stat label="Nq" value={Nq.toFixed(1)} /><Stat label="Nγ" value={Ngamma.toFixed(1)} /><Stat label="Ultimate qult" value={`${qult.toFixed(0)} kPa`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Allowable bearing pressure</div>
        <div className="mt-3 text-6xl font-black text-cyan-500">{qallow.toFixed(0)}<span className="ml-2 text-2xl text-slate-400">kPa</span></div>
        <div className="mt-4 text-sm text-slate-500">Allowable load ≈ {capacity.toFixed(0)} kN per metre of footing</div>
      </div></StudioChrome>
  );
}
