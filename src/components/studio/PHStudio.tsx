"use client";

import { useMemo, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { conc: number; acid: boolean }> = {
  "Lemon juice (pH 2)": { conc: 2, acid: true },
  "Black coffee (pH 5)": { conc: 5, acid: true },
  "Baking soda (pH 9)": { conc: 5, acid: false },
  "Ammonia (pH 11)": { conc: 3, acid: false },
};

export function PHStudio() {
  const [{ conc }, update] = useShareableNumbers({ conc: 3 }); // exponent: 10^-conc
  const [isAcid, setIsAcid] = useState(true);

  const { ph, poh, h, oh } = useMemo(() => {
    const c = Math.pow(10, -conc);
    const ph = isAcid ? conc : 14 - conc;
    return { ph, poh: 14 - ph, h: isAcid ? c : Math.pow(10, -(14 - conc)), oh: isAcid ? Math.pow(10, -(14 - conc)) : c };
  }, [conc, isAcid]);

  const color = ph < 7 ? `hsl(${20 + ph * 4},85%,55%)` : `hsl(${200 + (ph - 7) * 12},70%,55%)`;

  const explain =
    ph < 6.5
      ? `Acidic: [H⁺] of ${h.toExponential(1)} M outnumbers OH⁻, and because pH + pOH always sums to 14, the pOH here is ${poh.toFixed(1)}.`
      : ph > 7.5
      ? `Basic: OH⁻ dominates at ${oh.toExponential(1)} M, giving a low pOH of ${poh.toFixed(1)} — every pH unit up is a tenfold drop in H⁺.`
      : `Near neutral: [H⁺] and [OH⁻] are close to balanced around 10⁻⁷ M, the point where pH and pOH meet at 7.`;

  const code = `conc, is_acid = ${conc}, ${isAcid ? "True" : "False"}
c = 10 ** -conc
ph = conc if is_acid else 14 - conc
poh = 14 - ph
h = c if is_acid else 10 ** -(14 - conc)
print("pH", round(ph, 2), "pOH", round(poh, 2), "[H+]", h)`;

  return (
    <StudioChrome title="pH & pOH Calculator" tagline="acids, bases, and the pH scale"
      controls={<div>
        <div className="mb-3 flex gap-2">{[true, false].map((v) => <button key={String(v)} onClick={() => setIsAcid(v)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${isAcid === v ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{v ? "Acid" : "Base"}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">pH measures hydrogen-ion concentration on a logarithmic scale. Each unit is a 10× change — pH 3 is ten times more acidic than pH 4.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => { update({ conc: PRESETS[label].conc }); setIsAcid(PRESETS[label].acid); }}
        />
        <Slider label="Concentration 10⁻ⁿ M (n)" value={conc} min={0} max={7} step={0.1} onChange={(v) => update({ conc: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="pH" value={ph.toFixed(2)} /><Stat label="pOH" value={poh.toFixed(2)} /><Stat label="[H⁺]" value={h.toExponential(1)} /><Stat label="[OH⁻]" value={oh.toExponential(1)} /><ExplainResult text={explain} /></div>}
    >
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-6 p-8">
        <div className="text-center"><div className="text-sm text-slate-400">pH</div><div className="text-6xl font-black" style={{ color }}>{ph.toFixed(1)}</div><div className="mt-1 text-sm text-slate-400">{ph < 6.5 ? "acidic" : ph > 7.5 ? "basic" : "neutral"}</div></div>
        <div className="h-6 w-full max-w-lg rounded-full" style={{ background: "linear-gradient(90deg,#ef4444,#f97316,#eab308,#22c55e,#06b6d4,#3b82f6,#7c3aed)" }} />
        <div className="relative w-full max-w-lg"><div className="absolute -top-8 h-4 w-1 bg-white" style={{ left: `${(ph / 14) * 100}%` }} /><div className="flex justify-between text-xs text-slate-500"><span>0</span><span>7</span><span>14</span></div></div>
      </div>
    </StudioChrome>
  );
}
