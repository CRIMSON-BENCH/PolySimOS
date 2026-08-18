"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { H: number; phi: number; gamma: number; width: number }> = {
  "Low garden wall": { H: 2, phi: 32, gamma: 17, width: 1.5 },
  "Standard 4 m": { H: 4, phi: 30, gamma: 18, width: 2.2 },
  "Tall & loose fill": { H: 6, phi: 24, gamma: 20, width: 3.5 },
  "Dense backfill": { H: 5, phi: 38, gamma: 21, width: 2.8 },
};

// Rankine active earth pressure + wall stability.
export function RetainingWallStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ H, phi, gamma, width }, update] = useShareableNumbers({ H: 4, phi: 30, gamma: 18, width: 2.2 });
  const [wallGamma] = useState(24); // concrete

  const Ka = Math.tan((45 - phi / 2) * Math.PI / 180) ** 2;
  const Pa = 0.5 * Ka * gamma * H * H; // kN/m, acts at H/3
  const overturnM = Pa * (H / 3);
  const wallW = width * H * 0.5 * wallGamma; // rough stem+base weight per m
  const resistM = wallW * (width / 2);
  const FS_overturn = resistM / overturnM;
  const mu = Math.tan(phi * Math.PI / 180 * 0.67); const FS_slide = (wallW * mu) / Pa;

  useEffect(() => {
    const W = 480, Hc = 320; const ctx = hidpi(canvasRef.current!, W, Hc); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, Hc);
    const ox = 120, base = Hc - 40; const scale = 45;
    // soil
    ctx.fillStyle = "#3f2d1e"; ctx.fillRect(ox + 30, base - H * scale, W - ox - 40, H * scale);
    // wall
    ctx.fillStyle = "#64748b"; ctx.fillRect(ox, base - H * scale, 30, H * scale); ctx.fillRect(ox - 30, base - 20, width * scale + 30, 20);
    // pressure triangle
    ctx.fillStyle = "rgba(244,114,182,0.4)"; ctx.beginPath(); ctx.moveTo(ox + 30, base - H * scale); ctx.lineTo(ox + 30, base); ctx.lineTo(ox + 30 + Ka * gamma * H * 1.2, base); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#f472b6"; ctx.stroke();
    ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText("active pressure", ox + 40, base - 10); ctx.fillText(`H = ${H} m`, ox - 60, base - H * scale / 2);
  }, [H, phi, gamma, width]);

  const explain =
    FS_overturn < 1.5
      ? `Overturning FS is only ${FS_overturn.toFixed(2)}, below the usual ~1.5 target — this wall would tip forward. Widen the base or lower the height.`
      : FS_slide < 1.5
      ? `Sliding FS is ${FS_slide.toFixed(2)}, under the ~1.5 target — the wall could slide out. A wider base or a shear key would help.`
      : `Both factors of safety clear ~1.5 (overturning ${FS_overturn.toFixed(2)}, sliding ${FS_slide.toFixed(2)}), so this section resists the ${Pa.toFixed(0)} kN/m thrust with margin.`;

  const code = `import math
H, phi, gamma, width, wall_gamma = ${H}, ${phi}, ${gamma}, ${width}, ${wallGamma}
Ka = math.tan(math.radians(45 - phi/2))**2
Pa = 0.5*Ka*gamma*H*H              # kN/m, acts at H/3
overturn = Pa*(H/3)
wall_w = width*H*0.5*wall_gamma
resist = wall_w*(width/2)
mu = math.tan(math.radians(phi)*0.67)
print("Ka", round(Ka, 3), "FS_overturn", round(resist/overturn, 2), "FS_slide", round(wall_w*mu/Pa, 2))`;

  return (
    <StudioChrome title="Retaining Wall (Rankine)" tagline="earth pressure & stability"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Wall height H (m)" value={H} min={1} max={7} step={0.5} onChange={(v) => update({ H: v })} />
        <Slider label="Soil friction angle φ (°)" value={phi} min={20} max={40} step={1} onChange={(v) => update({ phi: v })} />
        <Slider label="Soil unit weight γ (kN/m³)" value={gamma} min={14} max={22} step={0.5} onChange={(v) => update({ gamma: v })} />
        <Slider label="Base width (m)" value={width} min={1} max={4} step={0.1} onChange={(v) => update({ width: v })} />
        <p className="mt-3 text-xs text-slate-500">Rankine theory gives the active earth pressure behind a wall from the coefficient Ka = tan²(45−φ/2). The soil pushes with a triangular pressure resultant Pa acting at one-third the height. The wall must resist overturning and sliding with adequate factors of safety. Educational tool, not a geotechnical design.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Ka" value={Ka.toFixed(3)} /><Stat label="Active thrust Pa" value={`${Pa.toFixed(1)} kN/m`} /><Stat label="FS overturning" value={FS_overturn.toFixed(2)} /><Stat label="FS sliding" value={FS_slide.toFixed(2)} /><Equation tex={`K_a=\\tan^2\\!\\left(45-\\tfrac{\\varphi}{2}\\right)=${Ka.toFixed(3)},\\quad P_a=\\tfrac{1}{2}K_a\\gamma H^2=${Pa.toFixed(1)}\\ \\mathrm{kN/m}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={480} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
