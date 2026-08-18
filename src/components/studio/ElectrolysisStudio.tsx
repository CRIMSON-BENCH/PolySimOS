"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const METALS = [{ n: "Copper", M: 63.5, z: 2 }, { n: "Silver", M: 107.9, z: 1 }, { n: "Aluminum", M: 27, z: 3 }, { n: "Gold", M: 197, z: 3 }, { n: "Nickel", M: 58.7, z: 2 }];

const PRESETS: Record<string, { current: number; minutes: number }> = {
  "Fast plate": { current: 8, minutes: 20 },
  "Gentle finish": { current: 0.5, minutes: 90 },
  "Heavy deposit": { current: 10, minutes: 180 },
  "Lab standard": { current: 2, minutes: 30 },
};

export function ElectrolysisStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [metal, setMetal] = useState(0);
  const [{ current, minutes }, update] = useShareableNumbers({ current: 2, minutes: 30 });
  const m = METALS[metal], F = 96485;
  const Q = current * minutes * 60;
  const moles = Q / (m.z * F);
  const grams = moles * m.M;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // beaker with two electrodes; deposit thickness ~ grams
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 2; ctx.strokeRect(120, 70, 280, 200);
    ctx.fillStyle = "rgba(56,189,248,0.15)"; ctx.fillRect(122, 100, 276, 168);
    ctx.fillStyle = "#94a3b8"; ctx.fillRect(180, 80, 14, 180); // anode
    const dep = Math.min(40, grams * 4); ctx.fillStyle = "#fbbf24"; ctx.fillRect(326 - dep, 80, 14 + dep, 180); ctx.fillStyle = "#64748b"; ctx.fillRect(326, 80, 14, 180);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "12px sans-serif"; ctx.fillText("cathode (plating)", 300, 292); ctx.fillText("anode", 170, 292); ctx.fillText(`${grams.toFixed(2)} g of ${m.n} deposited`, 130, 40);
  }, [metal, current, minutes, grams, m]);

  const explain = `Passing ${Q.toFixed(0)} C plates ${grams.toFixed(3)} g of ${m.n}. Each ${m.n} ion carries ${m.z} electron${m.z === 1 ? "" : "s"}, so it takes ${m.z}× the charge to deposit one atom — a higher ion charge means less metal per coulomb, even at the same current.`;

  const code = `F = 96485.0           # Faraday constant (C/mol)
current, minutes = ${current}, ${minutes}
M, z = ${m.M}, ${m.z}        # ${m.n}: molar mass, ion charge
Q = current * minutes * 60    # total charge (C)
moles = Q / (z * F)
grams = moles * M
print(f"{grams:.3f} g deposited")`;

  return (
    <StudioChrome title="Electrolysis (Faraday's Laws)" tagline="electroplating by the numbers"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <label className="mb-2 block text-xs text-slate-400">Metal</label>
        <select value={metal} onChange={(e) => setMetal(Number(e.target.value))} className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">{METALS.map((x, i) => <option key={x.n} value={i}>{x.n}</option>)}</select>
        <Slider label="Current (A)" value={current} min={0.1} max={10} step={0.1} onChange={(v) => update({ current: v })} />
        <Slider label="Time (minutes)" value={minutes} min={1} max={240} step={1} onChange={(v) => update({ minutes: v })} />
        <p className="mt-3 text-xs text-slate-500">Faraday&apos;s laws tie electric charge to chemistry: the mass deposited equals (Q/F)·(M/z), where Q is total charge, F the Faraday constant, and z the ion charge. Double the current or time and you double the metal plated. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Charge passed" value={`${Q.toFixed(0)} C`} />
        <Stat label="Moles deposited" value={`${moles.toFixed(4)} mol`} />
        <Stat label="Mass deposited" value={`${grams.toFixed(3)} g`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
