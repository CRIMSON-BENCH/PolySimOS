"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function OxygenDissociationStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [p50, setP50] = useState(26.6), [hill, setHill] = useState(2.7), [po2, setPo2] = useState(40);
  const sat = (p: number) => Math.pow(p, hill) / (Math.pow(p50, hill) + Math.pow(p, hill)) * 100;
  const s = sat(po2);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 32, pw = W - 65, ph = H - 52, pmax = 100;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const p = pmax * i / pw; const y = oy - (sat(p) / 100) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // markers: tissue (~40) and lung (~100)
    [{ p: 40, l: "tissue", col: "#fb7185" }, { p: 100, l: "lungs", col: "#a3e635" }].forEach(m => { const x = ox + (m.p / pmax) * pw, y = oy - (sat(m.p) / 100) * ph; ctx.fillStyle = m.col; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillText(m.l, x - 12, y - 8); });
    const px = ox + (po2 / pmax) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(px, oy); ctx.lineTo(px, oy - (s / 100) * ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("hemoglobin O₂ saturation vs partial pressure", ox + 6, oy - ph + 12); ctx.fillText("pO₂ (mmHg) →", ox + pw - 100, oy + 18);
  }, [p50, hill, po2, s]);

  return (
    <StudioChrome title="Oxygen–Hemoglobin Dissociation" tagline="how blood loads and unloads O₂"
      controls={<div>
        <Slider label="P50 (mmHg)" value={p50} min={18} max={40} step={0.5} onChange={setP50} />
        <Slider label="Hill coefficient" value={hill} min={1} max={3.5} step={0.1} onChange={setHill} />
        <Slider label="pO₂ (mmHg)" value={po2} min={5} max={100} step={1} onChange={setPo2} />
        <p className="mt-3 text-xs text-slate-500">Hemoglobin&apos;s S-shaped curve lets blood grab oxygen in the lungs and release it in tissues. The cooperative binding (Hill coefficient &gt; 1) makes the curve steep, so a small pressure drop unloads a lot of O₂. A right shift (higher P50) releases even more where it&apos;s needed. Educational tool, not medical advice.</p>
      </div>}
      inspector={<div>
        <Stat label="Saturation here" value={`${s.toFixed(1)}%`} />
        <Stat label="At lungs (100 mmHg)" value={`${sat(100).toFixed(0)}%`} />
        <Stat label="At tissue (40 mmHg)" value={`${sat(40).toFixed(0)}%`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
