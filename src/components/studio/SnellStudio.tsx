"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 640, H = 460;

export function SnellStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [n1, setN1] = useState(1);
  const [n2, setN2] = useState(1.5);
  const [angle, setAngle] = useState(40);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    ctx.fillStyle = "rgba(34,120,200,0.18)"; ctx.fillRect(0, cy, W, H - cy);
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.setLineDash([4, 4]); ctx.strokeStyle = "#475569"; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke(); ctx.setLineDash([]);
    const ai = angle * Math.PI / 180;
    // incident ray
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - Math.sin(ai) * 260, cy - Math.cos(ai) * 260); ctx.lineTo(cx, cy); ctx.stroke();
    const sinT = (n1 / n2) * Math.sin(ai); const tir = sinT > 1;
    if (tir) { const ar = ai; ctx.strokeStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(ar) * 260, cy - Math.cos(ar) * 260); ctx.stroke(); }
    else { const at = Math.asin(sinT); ctx.strokeStyle = "#22d3ee"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(at) * 260, cy + Math.cos(at) * 260); ctx.stroke();
      ctx.strokeStyle = "rgba(244,114,182,0.5)"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(ai) * 120, cy - Math.cos(ai) * 120); ctx.stroke(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`n₁=${n1}`, 14, cy - 12); ctx.fillText(`n₂=${n2}`, 14, cy + 22);
    ctx.fillText(tir ? "total internal reflection" : `refracted ${(Math.asin(sinT) * 180 / Math.PI).toFixed(1)}°`, cx + 10, tir ? cy - 20 : cy + 40);
  }, [n1, n2, angle]);

  const critical = n1 > n2 ? (Math.asin(n2 / n1) * 180 / Math.PI).toFixed(1) + "°" : "n/a";
  return (
    <StudioChrome title="Snell's Law — Refraction" tagline="n₁ sin θ₁ = n₂ sin θ₂"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Light bends when it crosses between media. Going into a slower medium it bends toward the normal; going the other way past the critical angle it reflects entirely.</p>
        <Slider label="Incidence angle" value={angle} min={0} max={89} step={1} onChange={setAngle} />
        <Slider label="Index n₁ (top)" value={n1} min={1} max={2.5} step={0.05} onChange={setN1} />
        <Slider label="Index n₂ (bottom)" value={n2} min={1} max={2.5} step={0.05} onChange={setN2} />
      </div>}
      inspector={<div><Stat label="n₁ → n₂" value={`${n1} → ${n2}`} /><Stat label="Critical angle" value={critical} /><Stat label="Snell" value="n₁sinθ₁ = n₂sinθ₂" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
