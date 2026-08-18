"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function ReactionEquilibriumStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [K, setK] = useState(4), [a0, setA0] = useState(1), [b0, setB0] = useState(1);
  // A + B <=> C + D, start C=D=0. K = x²/((a0-x)(b0-x)). Solve quadratic.
  const A = K - 1, B = -K * (a0 + b0), Cc = K * a0 * b0;
  let x = Math.abs(A) < 1e-9 ? Cc / -B : (-B - Math.sqrt(Math.max(0, B * B - 4 * A * Cc))) / (2 * A);
  x = Math.max(0, Math.min(x, Math.min(a0, b0)));
  const aeq = a0 - x, beq = b0 - x;

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const bars = [{ n: "A", v: aeq, col: "#22d3ee" }, { n: "B", v: beq, col: "#38bdf8" }, { n: "C", v: x, col: "#f472b6" }, { n: "D", v: x, col: "#fb7185" }];
    const maxv = Math.max(a0, b0, x, 0.01), bw = 90, gap = 30, ox = 60, oy = H - 50;
    bars.forEach((bar, i) => { const h = (bar.v / maxv) * (H - 100); const bx = ox + i * (bw + gap); ctx.fillStyle = bar.col; ctx.fillRect(bx, oy - h, bw, h); ctx.fillStyle = "#e2e8f0"; ctx.font = "12px sans-serif"; ctx.fillText(bar.n, bx + bw / 2 - 4, oy + 18); ctx.fillText(bar.v.toFixed(2), bx + bw / 2 - 12, oy - h - 6); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("equilibrium concentrations · A + B ⇌ C + D", 20, 22);
  }, [K, a0, b0, x, aeq, beq]);

  return (
    <StudioChrome title="Chemical Equilibrium (ICE)" tagline="how far a reaction goes"
      controls={<div>
        <Slider label="Equilibrium constant K" value={K} min={0.01} max={100} step={0.01} onChange={setK} />
        <Slider label="Initial [A] (M)" value={a0} min={0.1} max={2} step={0.1} onChange={setA0} />
        <Slider label="Initial [B] (M)" value={b0} min={0.1} max={2} step={0.1} onChange={setB0} />
        <p className="mt-3 text-xs text-slate-500">For A + B ⇌ C + D, the reaction proceeds until the ratio of products to reactants equals K. A large K means products dominate; a small K means the reaction barely proceeds. The extent x is found by solving the equilibrium expression. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Extent of reaction x" value={x.toFixed(3)} />
        <Stat label="[A], [B] at eq." value={`${aeq.toFixed(3)}, ${beq.toFixed(3)} M`} />
        <Stat label="[C], [D] at eq." value={`${x.toFixed(3)} M`} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
