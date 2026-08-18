"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 460;

const PRESETS: Record<string, { rMin: number; rMax: number }> = {
  "Full route": { rMin: 2.5, rMax: 4 },
  "Doubling cascade": { rMin: 3.0, rMax: 3.6 },
  "Chaos onset": { rMin: 3.5, rMax: 3.7 },
  "Period-3 window": { rMin: 3.8, rMax: 3.9 },
};

export function BifurcationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ rMin, rMax }, update] = useShareableNumbers({ rMin: 2.5, rMax: 4 });

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
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

  const explain =
    rMax <= 3.0
      ? "In this window r stays below 3, so every start collapses to a single stable fixed point — no branching yet."
      : rMax < 3.449
      ? "Here r has crossed 3.0: the lone fixed point has split once into a period-2 cycle that alternates between two values."
      : rMax < 3.57
      ? "This span captures the period-doubling cascade — 2, 4, 8, 16 — with each split arriving faster by the Feigenbaum ratio δ ≈ 4.669."
      : rMin > 3.82 && rMax < 3.86
      ? "You are zoomed into the period-3 window near r ≈ 3.83 — an island of order where chaos briefly gives way to a clean 3-cycle."
      : "Past r ≈ 3.57 the branches blur into chaos, yet pale vertical windows remain where periodic order suddenly returns.";

  const code = `import numpy as np
r_min, r_max, W = ${rMin}, ${rMax}, ${W}
for px in range(W):
    r = r_min + (px / W) * (r_max - r_min)
    x = 0.5
    for _ in range(120): x = r * x * (1 - x)   # settle
    for _ in range(160):
        x = r * x * (1 - x)
        # plot point (r, x) to build the bifurcation diagram
        pass`;

  return (
    <StudioChrome title="Bifurcation Diagram" tagline="logistic map · route to chaos"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">The logistic map xₙ₊₁ = r·xₙ(1−xₙ) doubles its period again and again as r grows, then dissolves into chaos near r ≈ 3.57 — with windows of order inside.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="r min" value={rMin} min={2.5} max={3.8} step={0.05} onChange={(v) => update({ rMin: v })} />
        <Slider label="r max" value={rMax} min={3.4} max={4} step={0.02} onChange={(v) => update({ rMax: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Map" value="r·x(1−x)" />
        <Stat label="Chaos onset" value="r ≈ 3.57" />
        <Stat label="Feigenbaum δ" value="4.669" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
