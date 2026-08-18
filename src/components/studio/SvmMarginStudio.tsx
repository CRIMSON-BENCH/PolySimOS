"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { angle: number; offset: number }> = {
  "Max margin": { angle: 45, offset: 0 },
  "Rotated 60°": { angle: 60, offset: 0 },
  "Off-center": { angle: 45, offset: 0.4 },
  "Misaligned 90°": { angle: 90, offset: 0 },
};

export function SvmMarginStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ angle, offset }, update] = useShareableNumbers({ angle: 45, offset: 0 });
  const A = angle * Math.PI / 180;
  const classA = [[-1.2, 0.8], [-0.8, 1.4], [-1.5, 0.2], [-0.6, 0.5], [-1.0, 1.0]];
  const classB = [[1.0, -0.6], [1.4, -1.2], [0.7, -0.3], [1.2, -0.9], [0.9, -1.5]];
  // boundary direction (cosA, sinA); signed distance of points; margin = min |dist|
  const nrm = [Math.cos(A), Math.sin(A)];
  const dist = (p: number[]) => p[0] * nrm[0] + p[1] * nrm[1] - offset;
  const margin = Math.min(...classA.map(p => Math.abs(dist(p))), ...classB.map(p => Math.abs(dist(p))));
  const correct = classA.every(p => dist(p) < 0) && classB.every(p => dist(p) > 0);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); const cx = W / 2, cy = H / 2, sc = 80;
    // boundary line perpendicular to nrm through offset*nrm
    const dir = [-Math.sin(A), Math.cos(A)]; const c0 = [offset * nrm[0], offset * nrm[1]];
    const drawLine = (o: number, col: string, dash: boolean) => { ctx.strokeStyle = col; ctx.lineWidth = 2; if (dash) ctx.setLineDash([5, 5]); ctx.beginPath(); const p1 = [c0[0] + o * nrm[0] - dir[0] * 3, c0[1] + o * nrm[1] - dir[1] * 3], p2 = [c0[0] + o * nrm[0] + dir[0] * 3, c0[1] + o * nrm[1] + dir[1] * 3]; ctx.moveTo(cx + p1[0] * sc, cy - p1[1] * sc); ctx.lineTo(cx + p2[0] * sc, cy - p2[1] * sc); ctx.stroke(); ctx.setLineDash([]); };
    drawLine(margin, "#475569", true); drawLine(-margin, "#475569", true); drawLine(0, "#a3e635", false);
    classA.forEach(p => { ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(cx + p[0] * sc, cy - p[1] * sc, 5, 0, Math.PI * 2); ctx.fill(); });
    classB.forEach(p => { ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(cx + p[0] * sc, cy - p[1] * sc, 5, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("maximize the margin between the two classes", 12, 20);
  }, [angle, offset, margin]);

  const explain = !correct
    ? `This orientation misclassifies at least one point, so the margin is meaningless until the two classes are cleanly separated first.`
    : margin > 0.35
    ? `A wide margin of ${margin.toFixed(2)} — the separating street is fat, which is exactly what an SVM optimizes for and what generalizes best to new points.`
    : `The classes are separated but the margin is only ${margin.toFixed(2)} — nudge the angle or offset to widen the street toward the maximum-margin solution.`;

  const code = `import numpy as np
from sklearn.svm import SVC
XA = np.array([[-1.2,0.8],[-0.8,1.4],[-1.5,0.2],[-0.6,0.5],[-1.0,1.0]])
XB = np.array([[1.0,-0.6],[1.4,-1.2],[0.7,-0.3],[1.2,-0.9],[0.9,-1.5]])
X = np.vstack([XA, XB]); y = np.r_[np.zeros(len(XA)), np.ones(len(XB))]
clf = SVC(kernel="linear", C=1e6).fit(X, y)
w = clf.coef_[0]; margin = 2 / np.linalg.norm(w)
print("max margin", margin)`;

  return (
    <StudioChrome title="SVM Maximum Margin" tagline="the widest possible street"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Boundary angle (°)" value={angle} min={0} max={180} step={1} onChange={(v) => update({ angle: v })} />
        <Slider label="Boundary offset" value={offset} min={-1.5} max={1.5} step={0.05} onChange={(v) => update({ offset: v })} />
        <p className="mt-3 text-xs text-slate-500">A support vector machine picks the separating line with the widest margin to the nearest points of each class — the support vectors. A fatter margin generalizes better to new data. Try to hand-tune the line to maximize the dashed gap. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Margin width" value={margin.toFixed(3)} />
        <Stat label="Separates classes?" value={correct ? "yes ✓" : "no — misclassified"} />
        <Equation tex={`\\min_{w,b}\\ \\tfrac{1}{2}\\lVert w\\rVert^{2}\\ \\text{ s.t. }\\ y_i(w\\cdot x_i+b)\\ge 1,\\quad \\text{margin}=\\frac{2}{\\lVert w\\rVert}=${margin.toFixed(3)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
