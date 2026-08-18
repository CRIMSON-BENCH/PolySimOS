"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 720, H = 440;

const PRESETS: Record<string, { dispersion: number; angle: number }> = {
  "Faint spread": { dispersion: 0.5, angle: 35 },
  "Newton spectrum": { dispersion: 1.5, angle: 35 },
  "Wide fan": { dispersion: 3, angle: 25 },
  "Steep exit": { dispersion: 1, angle: 55 },
};

export function PrismStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ dispersion, angle }, update] = useShareableNumbers({ dispersion: 1, angle: 35 });

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    // prism triangle
    ctx.strokeStyle = "#64748b"; ctx.fillStyle = "rgba(148,163,184,0.08)"; ctx.beginPath(); ctx.moveTo(cx, cy - 90); ctx.lineTo(cx - 80, cy + 80); ctx.lineTo(cx + 80, cy + 80); ctx.closePath(); ctx.fill(); ctx.stroke();
    // incoming white ray
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(60, cy - 20); ctx.lineTo(cx - 30, cy + 8); ctx.stroke();
    const ai = angle * Math.PI / 180;
    const colors = ["#7c3aed", "#2563eb", "#06b6d4", "#22c55e", "#eab308", "#f97316", "#ef4444"];
    colors.forEach((c, i) => { const bend = ai + (i - 3) * 0.03 * dispersion; ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 30, cy + 8); ctx.lineTo(cx + 60 + Math.cos(bend) * 260, cy + 8 + Math.sin(bend) * 260); ctx.stroke(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("white light disperses into a spectrum — each color refracts by a different amount", 14, H - 14);
  }, [dispersion, angle]);

  const explain =
    dispersion >= 2.5
      ? `Strong dispersion (${dispersion}×) fans the colors far apart — violet bends well beyond red, giving a broad, vivid spectrum.`
      : dispersion <= 0.5
      ? `Weak dispersion (${dispersion}×) barely separates the colors, so the exiting light stays close to white with only a faint rainbow fringe.`
      : `At ${dispersion}× dispersion and a ${angle}° exit angle, each wavelength refracts by a slightly different amount, splitting white light into an ordered ROYGBIV band.`;

  const code = `import numpy as np
dispersion, angle = ${dispersion}, ${angle}
ai = np.radians(angle)
# 7 wavelengths (violet..red) fan out around the base exit angle
bends = ai + (np.arange(7) - 3) * 0.03 * dispersion
print("exit angles (deg):", np.degrees(bends).round(2))`;

  return (
    <StudioChrome title="Prism Dispersion" tagline="refraction varies with wavelength"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A prism bends violet light more than red because the refractive index depends on wavelength — splitting white light into a rainbow, exactly as Newton showed.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Dispersion strength" value={dispersion} min={0.2} max={3} step={0.1} onChange={(v) => update({ dispersion: v })} />
        <Slider label="Exit angle" value={angle} min={10} max={60} step={1} onChange={(v) => update({ angle: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Colors" value="7 (ROYGBIV)" /><Stat label="Cause" value="n(λ) dispersion" /><Stat label="Most bent" value="violet" /><Equation tex={`n_1\\sin\\theta_1 = n_2\\sin\\theta_2:\\quad 1.00\\,\\sin ${angle}^{\\circ} = ${(1.5 + 0.05 * dispersion).toFixed(2)}\\,\\sin\\theta_2 \\Rightarrow \\theta_2 = ${(Math.asin(Math.min(1, Math.sin(angle * Math.PI / 180) / (1.5 + 0.05 * dispersion))) * 180 / Math.PI).toFixed(1)}^{\\circ}`} label="Snell's law of refraction" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
