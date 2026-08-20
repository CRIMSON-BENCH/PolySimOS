"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { ExplainResult } from "./SolverExtras";
import { Equation } from "./Equation";
import Link from "next/link";
import { hidpi } from "@/lib/studioKit";

const CW = 760, CH = 420;

// Material: E (MPa = N/mm²), yield σy (MPa), density ρ (g/cm³), stock cost ($/kg).
const MATERIALS: Record<string, { E: number; sy: number; rho: number; cost: number }> = {
  "Aluminum 6061": { E: 69000, sy: 276, rho: 2.70, cost: 7 },
  "Mild steel": { E: 200000, sy: 250, rho: 7.85, cost: 2.5 },
  "4140 steel": { E: 205000, sy: 655, rho: 7.85, cost: 4 },
  "Titanium Ti-6Al-4V": { E: 114000, sy: 880, rho: 4.43, cost: 35 },
  "Acrylic": { E: 3200, sy: 70, rho: 1.18, cost: 4 },
  "Pine (wood)": { E: 9000, sy: 40, rho: 0.5, cost: 2 },
  "Carbon fiber": { E: 70000, sy: 600, rho: 1.6, cost: 45 },
};

// Size a cantilever (end load F, span L, width b) to meet a max deflection AND a safety
// factor on yield, for each material. δ = F·L³/(3·E·I), σ = 6·F·L/(b·h²), I = b·h³/12.
function evaluate(F: number, L: number, b: number, dMax: number, SF: number) {
  return Object.entries(MATERIALS).map(([name, m]) => {
    const Ireq = (F * L ** 3) / (3 * m.E * dMax);          // mm⁴ required for deflection
    const hDefl = Math.cbrt((12 * Ireq) / b);
    const sAllow = m.sy / SF;
    const hStress = Math.sqrt((6 * F * L) / (b * sAllow));  // required for stress
    const h = Math.max(hDefl, hStress, 1);
    const I = (b * h ** 3) / 12;
    const defl = (F * L ** 3) / (3 * m.E * I);
    const stress = (6 * F * L) / (b * h * h);
    const sfActual = m.sy / stress;
    const mass = m.rho * 1e-6 * b * h * L;                  // kg  (ρ[g/cm³]·1e-6 g/mm³→kg)
    const cost = mass * m.cost;
    return { name, h, mass, cost, defl, sfActual, driver: hStress > hDefl ? "stress" : "deflection" };
  });
}

export function DesignOptimizerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [F, setF] = useState(500);
  const [L, setL] = useState(300);
  const [b, setB] = useState(30);
  const [dMax, setDMax] = useState(3);
  const [SF, setSF] = useState(2);
  const [objective, setObjective] = useState<"mass" | "cost">("mass");

  const rows = useMemo(() => evaluate(F, L, b, dMax, SF), [F, L, b, dMax, SF]);
  const ranked = useMemo(() => [...rows].sort((a, z) => (objective === "mass" ? a.mass - z.mass : a.cost - z.cost)), [rows, objective]);
  const best = ranked[0];

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, CW, CH);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, CW, CH);
    const maxVal = Math.max(...rows.map((r) => (objective === "mass" ? r.mass : r.cost)));
    const barH = 34, gap = 14, x0 = 150, top = 40;
    ctx.font = "12px sans-serif";
    ranked.forEach((r, i) => {
      const y = top + i * (barH + gap);
      const val = objective === "mass" ? r.mass : r.cost;
      const w = (val / maxVal) * (CW - x0 - 120);
      ctx.fillStyle = r.name === best.name ? "#22d3ee" : "#334155";
      ctx.fillRect(x0, y, Math.max(2, w), barH);
      ctx.fillStyle = "#e2e8f0"; ctx.textAlign = "right"; ctx.fillText(r.name, x0 - 10, y + barH / 2 + 4);
      ctx.textAlign = "left"; ctx.fillStyle = r.name === best.name ? "#020617" : "#cbd5e1";
      const label = objective === "mass" ? `${(r.mass * 1000).toFixed(0)} g` : `$${r.cost.toFixed(2)}`;
      ctx.fillText(`${label}  ·  h=${r.h.toFixed(1)}mm`, x0 + Math.max(2, w) + (r.name === best.name ? -0 : 8) + (r.name === best.name ? 8 : 0), y + barH / 2 + 4);
    });
    ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`minimum ${objective} to hold ${F} N over ${L} mm within ${dMax} mm deflection (SF ${SF})`, 12, 20);
    ctx.fillStyle = "#a3e635"; ctx.fillText(`✓ best: ${best.name}`, 12, CH - 12);
  }, [rows, ranked, best, objective, F, L, dMax, SF]);

  const explain = `To hold ${F} N at the end of a ${L} mm cantilever within ${dMax} mm of deflection (safety factor ${SF} on yield), the lightest option is ${best.name}: a ${b}×${best.h.toFixed(1)} mm section (${(best.mass * 1000).toFixed(0)} g, ~$${best.cost.toFixed(2)}), sized by ${best.driver}. Its actual safety factor is ${best.sfActual.toFixed(1)}. ${objective === "mass" ? "Switch the objective to cost if budget matters more than weight." : "Switch to mass if weight matters more than budget."} This is a first-cut sizing aid — verify with a full FEA and physical testing before relying on the part.`;

  return (
    <StudioChrome
      title="Design Optimizer"
      tagline="state a spec → get the lightest part that meets it"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Set the load and the requirement; PolySim sizes a cantilever cross-section and picks the material that meets the spec at minimum mass or cost.</p>
          <Slider label="Load F (N)" value={F} min={50} max={5000} step={50} onChange={setF} />
          <Slider label="Span L (mm)" value={L} min={50} max={1000} step={10} onChange={setL} />
          <Slider label="Width b (mm)" value={b} min={5} max={100} step={1} onChange={setB} />
          <Slider label="Max deflection (mm)" value={dMax} min={0.5} max={20} step={0.5} onChange={setDMax} />
          <Slider label="Safety factor" value={SF} min={1} max={5} step={0.5} onChange={setSF} />
          <div className="mt-3 mb-2 flex gap-1.5">
            <span className="self-center text-xs text-slate-500">Minimize:</span>
            {(["mass", "cost"] as const).map((o) => <button key={o} onClick={() => setObjective(o)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${objective === o ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{o}</button>)}
          </div>
          <div className="mt-3 rounded-lg border border-cyan-300/40 bg-cyan-500/10 p-3 text-xs text-slate-700 dark:border-cyan-500/30 dark:text-slate-300">
            Best: <b>{best.name}</b>, {b}×{best.h.toFixed(1)}×{L} mm. <Link href="/studio/fabricate" className="font-semibold text-cyan-700 underline dark:text-cyan-400">Make it in Fabricate →</Link>
          </div>
        </div>
      }
      inspector={
        <div>
          <Stat label="Best material" value={best.name} />
          <Stat label="Section" value={`${b}×${best.h.toFixed(1)} mm`} />
          <Stat label="Mass" value={`${(best.mass * 1000).toFixed(0)} g`} />
          <Stat label="Material cost" value={`$${best.cost.toFixed(2)}`} />
          <Stat label="Safety factor" value={best.sfActual.toFixed(1)} />
          <Stat label="Sized by" value={best.driver} />
          <Equation tex={`\\delta=\\dfrac{F L^3}{3EI},\\quad I=\\dfrac{b h^3}{12}`} />
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={CW} height={CH} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
