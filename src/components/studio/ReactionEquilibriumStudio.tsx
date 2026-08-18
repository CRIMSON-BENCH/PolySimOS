"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { K: number; a0: number; b0: number }> = {
  "Barely reacts": { K: 0.1, a0: 1, b0: 1 },
  "Balanced (K=1)": { K: 1, a0: 1, b0: 1 },
  "Product-favored": { K: 10, a0: 1, b0: 1 },
  "Excess B": { K: 4, a0: 0.5, b0: 2 },
};

export function ReactionEquilibriumStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ K, a0, b0 }, update] = useShareableNumbers({ K: 4, a0: 1, b0: 1 });
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

  const explain =
    K < 1
      ? `K = ${K} favors the reactants, so at equilibrium most of A and B stay unreacted (extent x = ${x.toFixed(2)}).`
      : K > 20
      ? `A large K = ${K} drives the reaction nearly to completion — products C and D dominate (extent x = ${x.toFixed(2)}).`
      : `With K = ${K}, reactants and products coexist; the reaction proceeds to an extent x = ${x.toFixed(2)}.`;

  const code = `import math
K, a0, b0 = ${K}, ${a0}, ${b0}
A = K - 1; B = -K*(a0 + b0); C = K*a0*b0
x = C/-B if abs(A) < 1e-9 else (-B - math.sqrt(max(0, B*B - 4*A*C)))/(2*A)
x = max(0, min(x, min(a0, b0)))
print("extent", round(x, 3), "[A]", round(a0-x, 3), "[B]", round(b0-x, 3))`;

  return (
    <StudioChrome title="Chemical Equilibrium (ICE)" tagline="how far a reaction goes"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Equilibrium constant K" value={K} min={0.01} max={100} step={0.01} onChange={(v) => update({ K: v })} />
        <Slider label="Initial [A] (M)" value={a0} min={0.1} max={2} step={0.1} onChange={(v) => update({ a0: v })} />
        <Slider label="Initial [B] (M)" value={b0} min={0.1} max={2} step={0.1} onChange={(v) => update({ b0: v })} />
        <p className="mt-3 text-xs text-slate-500">For A + B ⇌ C + D, the reaction proceeds until the ratio of products to reactants equals K. A large K means products dominate; a small K means the reaction barely proceeds. The extent x is found by solving the equilibrium expression. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Extent of reaction x" value={x.toFixed(3)} />
        <Stat label="[A], [B] at eq." value={`${aeq.toFixed(3)}, ${beq.toFixed(3)} M`} />
        <Stat label="[C], [D] at eq." value={`${x.toFixed(3)} M`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
