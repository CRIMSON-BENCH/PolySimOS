"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { gradient: number; latitude: number }> = {
  "Mid-latitude breeze": { gradient: 3, latitude: 45 },
  "Tight storm gradient": { gradient: 7, latitude: 50 },
  "Polar jet": { gradient: 5, latitude: 80 },
  "Near the tropics": { gradient: 2, latitude: 15 },
};

// Geostrophic wind: balance of pressure-gradient and Coriolis.
export function GeostrophicWindStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ gradient, latitude }, update] = useShareableNumbers({ gradient: 3, latitude: 45 });

  const f = 2 * 7.292e-5 * Math.sin(latitude * Math.PI / 180); const rho = 1.2;
  const dpdn = gradient * 100 / 100000; // Pa/m
  const vg = latitude > 1 ? dpdn / (rho * f) : Infinity;

  useEffect(() => {
    const W = 500, H = 340; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // isobars (horizontal lines), spacing ~ gradient
    const spacing = 200 / gradient; ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5;
    for (let y = 30, p = 1012; y < H - 20; y += spacing, p -= 4) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W - 20, y); ctx.stroke(); ctx.fillStyle = "#64748b"; ctx.font = "10px sans-serif"; ctx.fillText(`${p}`, W - 45, y - 3); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("LOW pressure", 24, 22); ctx.fillText("HIGH pressure", 24, H - 8);
    // wind arrow parallel to isobars (geostrophic)
    const cx = W / 2, cy = H / 2; ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 80, cy); ctx.lineTo(cx + 80, cy); ctx.stroke(); ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.moveTo(cx + 80, cy); ctx.lineTo(cx + 68, cy - 7); ctx.lineTo(cx + 68, cy + 7); ctx.fill();
    // pressure-gradient force (toward low) + Coriolis (toward high)
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 40); ctx.stroke(); ctx.fillStyle = "#f472b6"; ctx.font = "10px sans-serif"; ctx.fillText("PGF", cx + 4, cy - 30);
    ctx.strokeStyle = "#a3e635"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 40); ctx.stroke(); ctx.fillStyle = "#a3e635"; ctx.fillText("Coriolis", cx + 4, cy + 34);
    ctx.fillStyle = "#67e8f9"; ctx.fillText("geostrophic wind (along isobars)", cx - 90, cy - 12);
  }, [gradient, latitude]);

  const explain =
    latitude < 20
      ? "Close to the equator the Coriolis force nearly vanishes, so geostrophic balance breaks down and the predicted wind runs unrealistically fast — real tropical winds are not geostrophic."
      : gradient >= 6
      ? "Tightly packed isobars mean a strong pressure-gradient force; to balance it the geostrophic wind must be fast, which is why storms show closely spaced pressure lines."
      : latitude >= 70
      ? "At high latitude the Coriolis force is strong, so even a modest pressure gradient is balanced by a slower wind than the same gradient would drive nearer the tropics."
      : "The wind blows along the isobars, not across them: the pressure-gradient force toward low pressure is exactly cancelled by the Coriolis force, leaving a steady flow parallel to the lines.";

  const code = `import numpy as np
gradient, latitude = ${gradient}, ${latitude}  # mbar/100km, degrees
f = 2*7.292e-5*np.sin(np.radians(latitude)); rho = 1.2
dpdn = gradient*100/1e5  # Pa/m
vg = dpdn/(rho*f)
print("geostrophic wind", round(vg, 1), "m/s")`;

  return (
    <StudioChrome title="Geostrophic Wind" tagline="wind parallel to isobars"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Pressure gradient (mbar/100km)" value={gradient} min={0.5} max={8} step={0.5} onChange={(v) => update({ gradient: v })} />
        <Slider label="Latitude (°)" value={latitude} min={5} max={90} step={1} onChange={(v) => update({ latitude: v })} />
        <p className="mt-3 text-xs text-slate-500">Away from the ground, wind does not blow from high to low pressure — it blows along the isobars. The pressure-gradient force pushing air toward low pressure is balanced by the Coriolis force, and the result, the geostrophic wind, runs parallel to the pressure lines. Tighter isobar spacing means stronger wind. This is why you can read wind straight off a weather map.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Geostrophic wind" value={isFinite(vg) ? `${vg.toFixed(1)} m/s` : "∞ (equator)"} /><Stat label="In km/h" value={isFinite(vg) ? `${(vg * 3.6).toFixed(0)} km/h` : "—"} /><Stat label="Coriolis f" value={`${(f * 1e4).toFixed(2)}×10⁻⁴`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
