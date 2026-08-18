"use client";

import { useMemo } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { n: number; T: number; V: number }> = {
  "Cold & slow": { n: 1, T: 150, V: 24 },
  "Room temperature": { n: 1, T: 300, V: 24 },
  "Hot & fast": { n: 1, T: 700, V: 24 },
  "Compressed (high density)": { n: 2, T: 300, V: 6 },
};

export function IdealGasStudio() {
  const [{ n, T, V }, update] = useShareableNumbers({ n: 1, T: 300, V: 24 });

  const P = useMemo(() => (n * 8.314 * T) / (V / 1000) / 1000, [n, T, V]); // kPa
  const vRel = useMemo(() => Math.sqrt(T / 300), [T]); // mean speed relative to 300 K

  const explain =
    `At ${T} K, ${n} mol in ${V} L, PV = nRT gives about ${P.toFixed(1)} kPa (${(P / 101.325).toFixed(2)} atm). ` +
    `Mean molecular speed scales with the square root of temperature, so this gas moves about ${vRel.toFixed(2)}x as fast as it would at 300 K. ` +
    (T > 500
      ? "Hotter molecules move faster and hit the walls harder and more often, so pressure and the collision rate rise with T. "
      : T < 200
      ? "Cold molecules move slowly, so wall collisions are gentle and infrequent and pressure stays low. "
      : "Around room temperature the molecules carry moderate kinetic energy. ") +
    (V < 12
      ? "The small volume packs the molecules together, so each hits the walls more often and pressure climbs sharply."
      : "Expanding the volume spreads the molecules out, lowering the collision rate and the pressure.");

  const code = `R = 8.314          # J/(mol.K)
n, T, V = ${n}, ${T}, ${V}   # moles, kelvin, liters
V_m3 = V / 1000.0
P = n * R * T / V_m3          # pressure in Pa (kinetic theory / PV = nRT)
print(P / 1000.0, "kPa", "|", P / 101325.0, "atm")`;

  return (
    <StudioChrome title="Ideal Gas Law (PV = nRT)" tagline="pressure · volume · temperature · moles"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Set moles, temperature, and volume — pressure follows from PV = nRT. Compress the volume or heat the gas and watch the pressure climb.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Moles (n)" value={n} min={0.2} max={5} step={0.1} onChange={(v) => update({ n: v })} />
        <Slider label="Temperature (K)" value={T} min={100} max={800} step={10} onChange={(v) => update({ T: v })} />
        <Slider label="Volume (L)" value={V} min={2} max={60} step={1} onChange={(v) => update({ V: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Pressure" value={`${P.toFixed(1)} kPa`} />
        <Stat label="≈ atm" value={(P / 101.325).toFixed(2)} />
        <Stat label="Mean speed vs 300 K" value={`${vRel.toFixed(2)}x`} />
        <Stat label="Law" value="PV = nRT" />
        <ExplainResult text={explain} />
      </div>}
    >
      <div className="flex h-full min-h-[360px] items-center justify-center gap-10 p-8">
        <div className="relative flex h-72 w-40 flex-col justify-end rounded-lg border-2 border-slate-600 bg-slate-900/50">
          <div className="absolute inset-x-0 bg-cyan-500/30" style={{ height: `${Math.min(100, (V / 60) * 100)}%`, bottom: 0 }} />
          <div className="absolute inset-x-0 border-t-4 border-slate-400" style={{ bottom: `${Math.min(100, (V / 60) * 100)}%` }} />
          {Array.from({ length: Math.min(40, Math.round(n * 12)) }).map((_, i) => (
            <div key={i} className="absolute h-2 w-2 rounded-full bg-cyan-300" style={{ left: `${10 + (i * 37) % 80}%`, bottom: `${5 + (i * 53) % Math.max(10, (V / 60) * 90)}%` }} />
          ))}
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-400">Pressure</div>
          <div className="text-5xl font-black text-cyan-400">{P.toFixed(0)}</div>
          <div className="text-sm text-slate-400">kPa ({(P / 101.325).toFixed(2)} atm)</div>
        </div>
      </div>
    </StudioChrome>
  );
}
