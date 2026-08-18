"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { dose: number; Vd: number; thalf: number; ka: number }> = {
  "Ibuprofen-like": { dose: 400, Vd: 10, thalf: 2, ka: 2.5 },
  "Long half-life": { dose: 500, Vd: 30, thalf: 20, ka: 1 },
  "Fast absorption": { dose: 500, Vd: 30, thalf: 4, ka: 3.5 },
  "Large volume": { dose: 1000, Vd: 90, thalf: 6, ka: 1.2 },
};

export function PharmacokineticsStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ dose, Vd, thalf, ka }, update] = useShareableNumbers({ dose: 500, Vd: 30, thalf: 4, ka: 1.2 });
  const [oral, setOral] = useState(1);
  const ke = 0.693 / thalf;
  const conc = (t: number) => oral ? (dose * ka) / (Vd * (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t)) : (dose / Vd) * Math.exp(-ke * t);
  const cmax = oral ? Math.max(...Array.from({ length: 200 }, (_, i) => conc(i / 200 * 24))) : dose / Vd;
  const tmax = oral ? Math.log(ka / ke) / (ka - ke) : 0;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 32, pw = W - 65, ph = H - 52, tmaxH = 24, cmaxScale = cmax * 1.15;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // therapeutic band
    ctx.fillStyle = "rgba(163,230,53,0.12)"; ctx.fillRect(ox, oy - (cmax * 0.8 / cmaxScale) * ph, pw, (cmax * 0.4 / cmaxScale) * ph);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = tmaxH * i / pw; const y = oy - Math.max(0, conc(t) / cmaxScale) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("plasma concentration vs time (green = therapeutic window)", ox + 6, oy - ph + 12); ctx.fillText("hours →", ox + pw - 50, oy + 18);
  }, [dose, Vd, thalf, ka, oral, cmax]);

  const explain = !oral
    ? `IV dose: concentration peaks instantly at ${cmax.toFixed(1)} mg/L, then decays with a ${thalf}-hour half-life — after about ${(thalf * 5).toFixed(0)} h roughly 97% has cleared.`
    : ka > 3 * ke
    ? `Absorption (ka ${ka}/h) is much faster than elimination, so the drug reaches its peak quickly (about ${tmax.toFixed(1)} h) and the curve then tracks the ${thalf}-hour half-life on the way down.`
    : `Absorption and elimination rates are close, so the rise to peak is gradual (about ${tmax.toFixed(1)} h) and the peak concentration stays relatively low at ${cmax.toFixed(1)} mg/L.`;

  const code = `import numpy as np
dose, Vd, thalf, ka, oral = ${dose}, ${Vd}, ${thalf}, ${ka}, ${oral}
ke = 0.693 / thalf
t = np.linspace(0, 24, 200)
if oral:
    C = dose*ka / (Vd*(ka - ke)) * (np.exp(-ke*t) - np.exp(-ka*t))
    tmax = np.log(ka/ke) / (ka - ke)
else:
    C = dose/Vd * np.exp(-ke*t)
    tmax = 0.0
print("Cmax", C.max(), "tmax", tmax, "ke", ke)`;

  return (
    <StudioChrome title="Pharmacokinetics" tagline="how a drug rises and clears"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Dose (mg)" value={dose} min={50} max={2000} step={50} onChange={(v) => update({ dose: v })} />
        <Slider label="Volume of distribution (L)" value={Vd} min={5} max={100} step={5} onChange={(v) => update({ Vd: v })} />
        <Slider label="Half-life (h)" value={thalf} min={0.5} max={24} step={0.5} onChange={(v) => update({ thalf: v })} />
        <Slider label="Absorption rate ka (/h)" value={ka} min={0.2} max={4} step={0.1} onChange={(v) => update({ ka: v })} />
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={!!oral} onChange={(e) => setOral(e.target.checked ? 1 : 0)} /> Oral dose (absorption phase)</label>
        <p className="mt-3 text-xs text-slate-500">After a dose, drug concentration rises as it absorbs, then falls exponentially as the body clears it. The half-life sets the decline; the goal is to stay inside the therapeutic window — high enough to work, low enough to be safe. Educational tool, not medical advice.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Peak concentration" value={`${cmax.toFixed(2)} mg/L`} />
        <Stat label="Time to peak" value={oral ? `${tmax.toFixed(1)} h` : "immediate"} />
        <Stat label="Elimination rate ke" value={`${ke.toFixed(3)} /h`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
