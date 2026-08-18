"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Rankine active earth pressure + wall stability.
export function RetainingWallStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [H, setH] = useState(4); // wall height m
  const [phi, setPhi] = useState(30); // friction angle deg
  const [gamma, setGamma] = useState(18); // kN/m^3
  const [width, setWidth] = useState(2.2); // base width m
  const [wallGamma, setWallGamma] = useState(24); // concrete

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

  return (
    <StudioChrome title="Retaining Wall (Rankine)" tagline="earth pressure & stability"
      controls={<div>
        <Slider label="Wall height H (m)" value={H} min={1} max={7} step={0.5} onChange={setH} />
        <Slider label="Soil friction angle φ (°)" value={phi} min={20} max={40} step={1} onChange={setPhi} />
        <Slider label="Soil unit weight γ (kN/m³)" value={gamma} min={14} max={22} step={0.5} onChange={setGamma} />
        <Slider label="Base width (m)" value={width} min={1} max={4} step={0.1} onChange={setWidth} />
        <p className="mt-3 text-xs text-slate-500">Rankine theory gives the active earth pressure behind a wall from the coefficient Ka = tan²(45−φ/2). The soil pushes with a triangular pressure resultant Pa acting at one-third the height. The wall must resist overturning and sliding with adequate factors of safety. Educational tool, not a geotechnical design.</p>
      </div>}
      inspector={<div><Stat label="Ka" value={Ka.toFixed(3)} /><Stat label="Active thrust Pa" value={`${Pa.toFixed(1)} kN/m`} /><Stat label="FS overturning" value={FS_overturn.toFixed(2)} /><Stat label="FS sliding" value={FS_slide.toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={480} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
