"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { a: number; b: number; px: number; qx: number }> = {
  "Point doubling (P=Q)": { a: -1, b: 1, px: 0.5, qx: 0.5 },
  "Two components": { a: -1.5, b: 0.5, px: -1, qx: 1.5 },
  "Single arch": { a: 1, b: 1, px: 0, qx: 1 },
  "Wide secant": { a: 2, b: 3, px: -1, qx: 2 },
};

// Elliptic curve point addition over the reals: y^2 = x^3 + ax + b.
export function EllipticCurveStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ a, b, px, qx }, update] = useShareableNumbers({ a: -1, b: 1, px: -1, qx: 0.5 });

  const yOf = (x: number) => { const v = x * x * x + a * x + b; return v >= 0 ? Math.sqrt(v) : NaN; };
  const Py = yOf(px), Qy = yOf(qx);
  // slope of line PQ (or tangent if same)
  let m: number; if (Math.abs(px - qx) < 1e-6) m = (3 * px * px + a) / (2 * Py); else m = (Qy - Py) / (qx - px);
  const rx = m * m - px - qx; const ry = -(Py + m * (rx - px));

  useEffect(() => {
    const W = 420, H = 380; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, sc = 55;
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    // curve
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2;
    for (const sign of [1, -1]) { ctx.beginPath(); let started = false; for (let x = -3; x < 3.5; x += 0.02) { const y = yOf(x); if (isNaN(y)) { started = false; continue; } const X = cx + x * sc, Y = cy - sign * y * sc; started ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); started = true; } ctx.stroke(); }
    const pt = (x: number, y: number, col: string, lbl: string) => { if (isNaN(y)) return; const X = cx + x * sc, Y = cy - y * sc; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X, Y, 5, 0, 7); ctx.fill(); ctx.fillStyle = "#e2e8f0"; ctx.font = "11px sans-serif"; ctx.fillText(lbl, X + 6, Y - 4); };
    // line through P,Q
    if (!isNaN(Py) && !isNaN(Qy)) { ctx.strokeStyle = "rgba(163,230,53,0.6)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, cy - (Py + m * ((-cx / sc) - px)) * sc); ctx.lineTo(W, cy - (Py + m * ((cx / sc) - px)) * sc); ctx.stroke();
      // vertical from R' to R
      const X = cx + rx * sc; ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X, cy - ry * sc); ctx.lineTo(X, cy + ry * sc); ctx.stroke(); ctx.setLineDash([]); }
    pt(px, Py, "#f472b6", "P"); pt(qx, Qy, "#fbbf24", "Q"); pt(rx, ry, "#a3e635", "P+Q");
  }, [a, b, px, qx, Py, Qy, m, rx, ry]);

  const explain =
    isNaN(Py) || isNaN(Qy)
      ? "At this x the curve has no real point (x³ + ax + b < 0), so the sum is undefined — slide P or Q to an x where the blue curve exists."
      : Math.abs(px - qx) < 1e-6
      ? "P and Q share an x, so the rule uses the tangent line at P (point doubling) rather than a secant — this is how scalar multiplication builds up nP."
      : "The secant through P and Q meets the curve at a third point; reflecting it across the x-axis gives P+Q. Repeating this is easy, but undoing it (the discrete log) is what secures ECC.";

  const code = `a, b = ${a}, ${b}
px, qx = ${px}, ${qx}
y = lambda x: (x**3 + a*x + b) ** 0.5
Py, Qy = y(px), y(qx)
m = (3*px*px + a)/(2*Py) if abs(px-qx) < 1e-9 else (Qy-Py)/(qx-px)
rx = m*m - px - qx
ry = -(Py + m*(rx - px))
print("P+Q =", (rx, ry))`;

  return (
    <StudioChrome title="Elliptic Curve Addition" tagline="the geometry behind ECC"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Curve parameter a" value={a} min={-2} max={2} step={0.1} onChange={(v) => update({ a: v })} />
        <Slider label="Curve parameter b" value={b} min={0.2} max={3} step={0.1} onChange={(v) => update({ b: v })} />
        <Slider label="Point P (x)" value={px} min={-2} max={3} step={0.1} onChange={(v) => update({ px: v })} />
        <Slider label="Point Q (x)" value={qx} min={-2} max={3} step={0.1} onChange={(v) => update({ qx: v })} />
        <p className="mt-3 text-xs text-slate-500">On an elliptic curve y² = x³ + ax + b, you &quot;add&quot; two points with a geometric rule: draw the line through P and Q, find where it meets the curve again, and reflect that point over the x-axis. Repeating this addition is easy, but reversing it — the elliptic-curve discrete log — is brutally hard, which is what makes ECC secure with far smaller keys than RSA.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Slope" value={isFinite(m) ? m.toFixed(2) : "∞"} /><Stat label="P+Q (x)" value={isNaN(rx) ? "—" : rx.toFixed(2)} /><Stat label="P+Q (y)" value={isNaN(ry) ? "—" : ry.toFixed(2)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={420} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
