"use client";

import { useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const G = 6.674e-11;
const BODIES: Record<string, { m: number; r: number }> = {
  Moon: { m: 7.342e22, r: 1.737e6 }, Mars: { m: 6.417e23, r: 3.39e6 }, Earth: { m: 5.972e24, r: 6.371e6 },
  Jupiter: { m: 1.898e27, r: 6.9911e7 }, Sun: { m: 1.989e30, r: 6.957e8 },
};

const PRESETS: Record<string, { massE: number; radiusE: number }> = {
  "Super-Earth": { massE: 5, radiusE: 1.6 },
  "Mini-Neptune": { massE: 10, radiusE: 2.5 },
  "Gas giant": { massE: 300, radiusE: 11 },
  "Dwarf planet": { massE: 0.2, radiusE: 0.3 },
};

export function EscapeVelocityStudio() {
  const [body, setBody] = useState("Earth");
  const [custom, setCustom] = useState(false);
  const [{ massE, radiusE }, update] = useShareableNumbers({ massE: 1, radiusE: 1 }); // massE in Earth masses, radiusE in Earth radii

  const M = custom ? massE * 5.972e24 : BODIES[body].m;
  const R = custom ? radiusE * 6.371e6 : BODIES[body].r;
  const vEsc = Math.sqrt(2 * G * M / R); // m/s
  const vOrb = Math.sqrt(G * M / R);
  const gSurf = G * M / (R * R);

  const label = custom ? "this custom body" : body;
  const explain = `Leaving ${label} takes ${(vEsc / 1000).toFixed(1)} km/s no matter the spacecraft mass, while a circular orbit needs only ${(vOrb / 1000).toFixed(1)} km/s — smaller by exactly √2 (about 1.41×).`;

  const code = `import math
G = 6.674e-11
M = ${M.toExponential(4)}  # kg
R = ${R.toExponential(4)}  # m
v_esc = math.sqrt(2 * G * M / R)
v_orb = math.sqrt(G * M / R)
print("escape km/s", round(v_esc / 1000, 2), "orbit km/s", round(v_orb / 1000, 2))`;

  return (
    <StudioChrome title="Escape & Orbital Velocity" tagline="how fast to leave a world"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-1">{Object.keys(BODIES).map((b) => <button key={b} onClick={() => { setBody(b); setCustom(false); }} className={`rounded-lg px-2 py-1 text-xs font-semibold ${!custom && body === b ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{b}</button>)}</div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} /> Custom body</label>
        <div className="mt-3"><Presets presets={Object.keys(PRESETS).map((l) => ({ label: l }))} onApply={(l) => { setCustom(true); update(PRESETS[l]); }} /></div>
        {custom && <div className="mt-2"><Slider label="Mass (Earth masses)" value={massE} min={0.01} max={300} step={0.01} onChange={(v) => update({ massE: v })} /><Slider label="Radius (Earth radii)" value={radiusE} min={0.1} max={12} step={0.1} onChange={(v) => update({ radiusE: v })} /></div>}
        <p className="mt-3 text-xs text-slate-500">Escape velocity v = √(2GM/R) is the speed needed to break free of a body&apos;s gravity from its surface, ignoring air resistance. Circular orbital velocity is √(GM/R) — a factor of √2 smaller. Both depend only on mass and radius, not on the mass of the escaping object.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Escape velocity" value={`${(vEsc / 1000).toFixed(2)} km/s`} /><Stat label="Orbital velocity" value={`${(vOrb / 1000).toFixed(2)} km/s`} /><Stat label="Surface gravity" value={`${gSurf.toFixed(2)} m/s²`} /><Equation tex={`v_e = \\sqrt{\\dfrac{2GM}{R}} = \\sqrt{\\dfrac{2\\,(6.674\\times10^{-11})\\,(${M.toExponential(2)})}{${R.toExponential(2)}}} = ${(vEsc / 1000).toFixed(2)}\\ \\text{km/s}`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center justify-center py-16">
        <div className="text-xs uppercase tracking-widest text-slate-500">Escape velocity — {custom ? "custom body" : body}</div>
        <div className="mt-3 text-6xl font-black text-cyan-500">{(vEsc / 1000).toFixed(2)}<span className="ml-2 text-2xl text-slate-400">km/s</span></div>
        <div className="mt-6 grid grid-cols-2 gap-8 text-center">
          <div><div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{(vOrb / 1000).toFixed(2)}</div><div className="text-xs text-slate-500">orbital km/s</div></div>
          <div><div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{(gSurf / 9.81).toFixed(2)}</div><div className="text-xs text-slate-500">surface g (× Earth)</div></div>
        </div>
      </div></StudioChrome>
  );
}
