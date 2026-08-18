"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { b: number; d: number; As: number; fc: number; fy: number }> = {
  "Typical floor beam": { b: 300, d: 500, As: 1500, fc: 30, fy: 420 },
  "Under-reinforced (ductile)": { b: 300, d: 550, As: 900, fc: 30, fy: 420 },
  "Over-reinforced (check)": { b: 300, d: 400, As: 3500, fc: 25, fy: 420 },
  "High-strength concrete": { b: 350, d: 600, As: 2500, fc: 50, fy: 500 },
};

// Reinforced concrete beam flexural capacity (Whitney stress block, ACI).
export function ConcreteBeamStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ b, d, As, fc, fy }, update] = useShareableNumbers({ b: 300, d: 500, As: 1500, fc: 30, fy: 420 });

  const a = As * fy / (0.85 * fc * b); // mm depth of stress block
  const Mn = As * fy * (d - a / 2) / 1e6; // kN·m
  const phiMn = 0.9 * Mn;
  const rho = As / (b * d);
  const beta1 = fc <= 28 ? 0.85 : Math.max(0.65, 0.85 - 0.05 * (fc - 28) / 7);
  const rhoBal = 0.85 * beta1 * (fc / fy) * (600 / (600 + fy));
  const tension = rho < 0.75 * rhoBal;

  useEffect(() => {
    const W = 340, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const scale = 220 / Math.max(d + 60, b); const ox = W / 2 - b * scale / 2, oy = 40; const bh = (d + 60) * scale;
    ctx.fillStyle = "#475569"; ctx.fillRect(ox, oy, b * scale, bh); ctx.strokeStyle = "#94a3b8"; ctx.strokeRect(ox, oy, b * scale, bh);
    // compression block
    ctx.fillStyle = "rgba(34,211,238,0.4)"; ctx.fillRect(ox, oy, b * scale, a * scale); ctx.strokeStyle = "#22d3ee"; ctx.strokeRect(ox, oy, b * scale, a * scale);
    // rebar
    const nBar = 4; ctx.fillStyle = "#f472b6"; for (let i = 0; i < nBar; i++) { const x = ox + (b * scale) * (i + 1) / (nBar + 1); ctx.beginPath(); ctx.arc(x, oy + d * scale, 6, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText("compression block a", ox + 4, oy + a * scale + 14); ctx.fillText("tension steel", ox + 4, oy + d * scale + 22); ctx.fillText(`b = ${b}`, ox + b * scale / 2 - 16, oy - 8);
  }, [b, d, As, fc, fy]);

  const explain = !tension
    ? `Over-reinforced: ρ ≈ ${rho.toFixed(4)} exceeds 0.75·ρ_bal ≈ ${(0.75 * rhoBal).toFixed(4)}, so the concrete may crush before the steel yields — a brittle failure codes steer you away from by adding depth or trimming steel.`
    : a > d / 3
    ? `The stress block a ≈ ${a.toFixed(0)} mm is deep, shrinking the lever arm d − a/2, so each extra bar of steel adds less capacity than the last — depth d is the stronger lever than area.`
    : `Tension-controlled: with ρ ≈ ${rho.toFixed(4)} well under 0.75·ρ_bal the steel yields first and the beam warns before it fails, while Mn = As·fy·(d − a/2) rises almost linearly with steel here.`;

  const code = `# Reinforced concrete beam flexural capacity (Whitney block, ACI)
b, d, As, fc, fy = ${b}, ${d}, ${As}, ${fc}, ${fy}  # mm, mm, mm^2, MPa, MPa
a = As * fy / (0.85 * fc * b)        # stress-block depth (mm)
Mn = As * fy * (d - a / 2) / 1e6     # nominal moment (kN*m)
phiMn = 0.9 * Mn                     # design moment
print(f"a={a:.0f} mm  Mn={Mn:.0f}  phiMn={phiMn:.0f} kN*m")`;

  return (
    <StudioChrome title="Reinforced Concrete Beam" tagline="flexural capacity (ACI)"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Width b (mm)" value={b} min={200} max={600} step={10} onChange={(v) => update({ b: v })} />
        <Slider label="Effective depth d (mm)" value={d} min={300} max={900} step={10} onChange={(v) => update({ d: v })} />
        <Slider label="Steel area As (mm²)" value={As} min={500} max={4000} step={100} onChange={(v) => update({ As: v })} />
        <Slider label="Concrete f'c (MPa)" value={fc} min={20} max={50} step={1} onChange={(v) => update({ fc: v })} />
        <Slider label="Steel fy (MPa)" value={fy} min={300} max={550} step={10} onChange={(v) => update({ fy: v })} />
        <p className="mt-3 text-xs text-slate-500">A reinforced concrete beam resists bending through a compression block in the concrete and tension in the steel. Setting these forces equal gives the stress-block depth a, and the moment capacity Mn = As·fy·(d − a/2). A tension-controlled section (steel yields first) fails gradually — the ductile behavior codes require. Educational tool, not a design.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Stress block a" value={`${a.toFixed(0)} mm`} /><Stat label="Nominal Mn" value={`${Mn.toFixed(0)} kN·m`} /><Stat label="Design φMn" value={`${phiMn.toFixed(0)} kN·m`} /><Stat label="Behavior" value={tension ? "tension-controlled" : "check ductility"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={340} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
