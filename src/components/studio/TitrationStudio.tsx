"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 740, H = 440;

const PRESETS: Record<string, { acidConc: number; baseConc: number; acidVol: number }> = {
  "Standard 0.1 M": { acidConc: 0.1, baseConc: 0.1, acidVol: 50 },
  "Dilute": { acidConc: 0.02, baseConc: 0.02, acidVol: 50 },
  "Concentrated": { acidConc: 0.3, baseConc: 0.3, acidVol: 60 },
  "Strong titrant": { acidConc: 0.1, baseConc: 0.3, acidVol: 40 },
};

export function TitrationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ acidConc, baseConc, acidVol }, update] = useShareableNumbers({ acidConc: 0.1, baseConc: 0.1, acidVol: 50 });

  const curve = useMemo(() => {
    const pts: { v: number; ph: number }[] = [];
    const molesAcid = acidConc * acidVol / 1000;
    for (let v = 0; v <= 100; v += 0.5) {
      const molesBase = baseConc * v / 1000; const totalVol = (acidVol + v) / 1000;
      let ph: number;
      if (molesBase < molesAcid) { const h = (molesAcid - molesBase) / totalVol; ph = -Math.log10(Math.max(1e-14, h)); }
      else if (molesBase > molesAcid) { const oh = (molesBase - molesAcid) / totalVol; ph = 14 + Math.log10(Math.max(1e-14, oh)); }
      else ph = 7;
      pts.push({ v, ph: Math.max(0, Math.min(14, ph)) });
    }
    return pts;
  }, [acidConc, baseConc, acidVol]);

  const equivVol = (acidConc * acidVol) / baseConc;
  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const pad = 40;
    const sx = (v: number) => pad + (v / 100) * (W - 2 * pad); const sy = (ph: number) => H - pad - (ph / 14) * (H - 2 * pad);
    ctx.strokeStyle = "#1e293b"; for (let ph = 0; ph <= 14; ph += 7) { ctx.beginPath(); ctx.moveTo(pad, sy(ph)); ctx.lineTo(W - pad, sy(ph)); ctx.stroke(); }
    ctx.strokeStyle = "rgba(163,230,53,0.5)"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(sx(equivVol), pad); ctx.lineTo(sx(equivVol), H - pad); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.beginPath(); curve.forEach((p, i) => i ? ctx.lineTo(sx(p.v), sy(p.ph)) : ctx.moveTo(sx(p.v), sy(p.ph))); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("pH", pad - 26, sy(7)); ctx.fillText("base added (mL) →", W - 150, H - 14); ctx.fillText(`equivalence at ${equivVol.toFixed(1)} mL`, sx(equivVol) + 6, pad + 16);
  }, [curve, equivVol]);

  const molesAcidMmol = acidConc * acidVol;
  const explain =
    equivVol < 25
      ? `The titrant is concentrated relative to the acid, so equivalence arrives early — about ${equivVol.toFixed(1)} mL neutralizes all ${molesAcidMmol.toFixed(2)} mmol of acid.`
      : equivVol > 65
      ? `A relatively dilute or low-strength base means you must add roughly ${equivVol.toFixed(1)} mL to reach equivalence, stretching out the flat regions of the curve.`
      : `Equivalence sits near ${equivVol.toFixed(1)} mL; because this is a strong acid with a strong base, the pH there is exactly 7 and the jump is nearly vertical.`;

  const code = `import numpy as np
acid_conc, base_conc, acid_vol = ${acidConc}, ${baseConc}, ${acidVol}
moles_acid = acid_conc * acid_vol / 1000
for v in np.arange(0, 100.5, 0.5):
    moles_base = base_conc * v / 1000
    total = (acid_vol + v) / 1000
    if moles_base < moles_acid:
        ph = -np.log10(max(1e-14, (moles_acid - moles_base) / total))
    elif moles_base > moles_acid:
        ph = 14 + np.log10(max(1e-14, (moles_base - moles_acid) / total))
    else:
        ph = 7
    print(round(v, 1), round(min(14, max(0, ph)), 2))
print("equivalence mL:", acid_conc * acid_vol / base_conc)`;

  return (
    <StudioChrome title="Acid–Base Titration" tagline="pH curve · equivalence point"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Add base to an acid and track the pH. The steep jump marks the equivalence point, where moles of acid equal moles of base.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Acid concentration (M)" value={acidConc} min={0.02} max={0.3} step={0.01} onChange={(v) => update({ acidConc: v })} />
        <Slider label="Base concentration (M)" value={baseConc} min={0.02} max={0.3} step={0.01} onChange={(v) => update({ baseConc: v })} />
        <Slider label="Acid volume (mL)" value={acidVol} min={20} max={80} step={5} onChange={(v) => update({ acidVol: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Equivalence" value={`${equivVol.toFixed(1)} mL`} /><Stat label="Type" value="strong acid + strong base" /><Stat label="pH at eq." value="7.0" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
