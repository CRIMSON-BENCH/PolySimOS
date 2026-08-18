"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 720, H = 440;

export function PrismStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dispersion, setDispersion] = useState(1);
  const [angle, setAngle] = useState(35);

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

  return (
    <StudioChrome title="Prism Dispersion" tagline="refraction varies with wavelength"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">A prism bends violet light more than red because the refractive index depends on wavelength — splitting white light into a rainbow, exactly as Newton showed.</p>
        <Slider label="Dispersion strength" value={dispersion} min={0.2} max={3} step={0.1} onChange={setDispersion} />
        <Slider label="Exit angle" value={angle} min={10} max={60} step={1} onChange={setAngle} />
      </div>}
      inspector={<div><Stat label="Colors" value="7 (ROYGBIV)" /><Stat label="Cause" value="n(λ) dispersion" /><Stat label="Most bent" value="violet" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
