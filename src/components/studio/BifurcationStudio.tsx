"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 460;

export function BifurcationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rMin, setRMin] = useState(2.5);
  const [rMax, setRMax] = useState(4);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const img = ctx.getImageData(0, 0, W, H);
    for (let px = 0; px < W; px++) {
      const r = rMin + (px / W) * (rMax - rMin); let x = 0.5;
      for (let i = 0; i < 120; i++) x = r * x * (1 - x); // settle
      for (let i = 0; i < 160; i++) { x = r * x * (1 - x); const py = Math.floor((1 - x) * H); if (py >= 0 && py < H) { const idx = (py * W + px) * 4; img.data[idx] = 34; img.data[idx + 1] = 211; img.data[idx + 2] = 238; img.data[idx + 3] = 255; } }
    }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`logistic map · r from ${rMin} to ${rMax}`, 12, 20); ctx.fillText("period-doubling route to chaos →", W - 220, H - 12);
  }, [rMin, rMax]);

  return (
    <StudioChrome title="Bifurcation Diagram" tagline="logistic map · route to chaos"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">The logistic map xₙ₊₁ = r·xₙ(1−xₙ) doubles its period again and again as r grows, then dissolves into chaos near r ≈ 3.57 — with windows of order inside.</p>
        <Slider label="r min" value={rMin} min={2.5} max={3.8} step={0.05} onChange={setRMin} />
        <Slider label="r max" value={rMax} min={3.4} max={4} step={0.02} onChange={setRMax} />
      </div>}
      inspector={<div><Stat label="Map" value="r·x(1−x)" /><Stat label="Chaos onset" value="r ≈ 3.57" /><Stat label="Feigenbaum δ" value="4.669" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
