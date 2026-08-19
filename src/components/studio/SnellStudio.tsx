"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, useCanvasDrag } from "@/lib/studioKit";

const W = 640, H = 460;
const HR = 210; // radius (px) of the draggable handle along the incident ray

const PRESETS: Record<string, { n1: number; n2: number; angle: number }> = {
  "Air → glass": { n1: 1, n2: 1.5, angle: 40 },
  "Air → water": { n1: 1, n2: 1.33, angle: 45 },
  "Glass → air (TIR)": { n1: 1.5, n2: 1, angle: 50 },
  "Diamond → air": { n1: 2.4, n2: 1, angle: 30 },
};

export function SnellStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ n1, n2, angle }, update] = useShareableNumbers({ n1: 1, n2: 1.5, angle: 40 });

  // Drag the handle on the incident ray to rotate it about the interface point,
  // which sets the angle of incidence live (refraction / TIR update per Snell's law).
  useCanvasDrag(canvasRef, W, H, {
    pick: (x, y) => {
      const cx = W / 2, cy = H / 2, ai = (angle * Math.PI) / 180;
      const hx = cx - Math.sin(ai) * HR, hy = cy - Math.cos(ai) * HR;
      return Math.hypot(x - hx, y - hy) < 22;
    },
    move: (x, y) => {
      const cx = W / 2, cy = H / 2;
      // angle from the normal (vertical): incident ray sits above-left of the interface
      const deg = (Math.atan2(-(x - cx), -(y - cy)) * 180) / Math.PI;
      update({ angle: Math.max(0, Math.min(89, Math.round(deg))) });
    },
  });

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
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
    // draggable handle on the incident ray — grab it to rotate the ray about the interface point
    const hx = cx - Math.sin(ai) * HR, hy = cy - Math.cos(ai) * HR;
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, 7); ctx.fill();
    ctx.strokeStyle = "#020617"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, 7, 0, 7); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`n₁=${n1}`, 14, cy - 12); ctx.fillText(`n₂=${n2}`, 14, cy + 22);
    ctx.fillText(tir ? "total internal reflection" : `refracted ${(Math.asin(sinT) * 180 / Math.PI).toFixed(1)}°`, cx + 10, tir ? cy - 20 : cy + 40);
    ctx.font = "10px ui-monospace, monospace"; ctx.fillStyle = "#a3e635"; ctx.fillText(`drag to aim · θ₁ = ${angle}°`, hx + 11, hy + 3);
  }, [n1, n2, angle]);

  const critical = n1 > n2 ? (Math.asin(n2 / n1) * 180 / Math.PI).toFixed(1) + "°" : "n/a";

  const sinTexplain = (n1 / n2) * Math.sin(angle * Math.PI / 180);
  const explain =
    sinTexplain > 1
      ? `Past the critical angle (~${critical}) with n₁ greater than n₂, every ray reflects back into the dense medium — total internal reflection, the basis of fiber optics.`
      : n1 === n2
      ? "Equal indices: the ray passes straight through with no bending at all."
      : n2 > n1
      ? "Into a denser, slower medium: the ray bends toward the normal, so the refracted angle is smaller than the incidence angle."
      : "Into a lighter, faster medium: the ray bends away from the normal and will refract ever more steeply until the critical angle triggers total internal reflection.";

  const code = `import numpy as np
n1, n2, angle = ${n1}, ${n2}, ${angle}
ai = np.radians(angle)
sinT = (n1 / n2) * np.sin(ai)
if sinT > 1:
    print("total internal reflection")
else:
    print("refracted angle", np.degrees(np.arcsin(sinT)))`;

  return (
    <StudioChrome title="Snell's Law — Refraction" tagline="n₁ sin θ₁ = n₂ sin θ₂"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Light bends when it crosses between media. Going into a slower medium it bends toward the normal; going the other way past the critical angle it reflects entirely.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Incidence angle" value={angle} min={0} max={89} step={1} onChange={(v) => update({ angle: v })} />
        <Slider label="Index n₁ (top)" value={n1} min={1} max={2.5} step={0.05} onChange={(v) => update({ n1: v })} />
        <Slider label="Index n₂ (bottom)" value={n2} min={1} max={2.5} step={0.05} onChange={(v) => update({ n2: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="n₁ → n₂" value={`${n1} → ${n2}`} /><Stat label="Critical angle" value={critical} /><Stat label="Snell" value="n₁sinθ₁ = n₂sinθ₂" /><Equation tex={`n_1\\sin\\theta_1 = n_2\\sin\\theta_2:\\quad ${n1}\\,\\sin ${angle}^\\circ = ${n2}\\,\\sin\\theta_2,\\quad \\theta_c = \\arcsin\\tfrac{n_2}{n_1} = \\text{${critical}}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
