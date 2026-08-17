"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Elliptic curve point addition over the reals: y^2 = x^3 + ax + b.
export function EllipticCurveStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(-1);
  const [b, setB] = useState(1);
  const [px, setPx] = useState(-1);
  const [qx, setQx] = useState(0.5);

  const yOf = (x: number) => { const v = x * x * x + a * x + b; return v >= 0 ? Math.sqrt(v) : NaN; };
  const Py = yOf(px), Qy = yOf(qx);
  // slope of line PQ (or tangent if same)
  let m: number; if (Math.abs(px - qx) < 1e-6) m = (3 * px * px + a) / (2 * Py); else m = (Qy - Py) / (qx - px);
  const rx = m * m - px - qx; const ry = -(Py + m * (rx - px));

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 420, H = 380; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
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

  return (
    <StudioChrome title="Elliptic Curve Addition" tagline="the geometry behind ECC"
      controls={<div>
        <Slider label="Curve parameter a" value={a} min={-2} max={2} step={0.1} onChange={setA} />
        <Slider label="Curve parameter b" value={b} min={0.2} max={3} step={0.1} onChange={setB} />
        <Slider label="Point P (x)" value={px} min={-2} max={3} step={0.1} onChange={setPx} />
        <Slider label="Point Q (x)" value={qx} min={-2} max={3} step={0.1} onChange={setQx} />
        <p className="mt-3 text-xs text-slate-500">On an elliptic curve y² = x³ + ax + b, you &quot;add&quot; two points with a geometric rule: draw the line through P and Q, find where it meets the curve again, and reflect that point over the x-axis. Repeating this addition is easy, but reversing it — the elliptic-curve discrete log — is brutally hard, which is what makes ECC secure with far smaller keys than RSA.</p>
      </div>}
      inspector={<div><Stat label="Slope" value={isFinite(m) ? m.toFixed(2) : "∞"} /><Stat label="P+Q (x)" value={isNaN(rx) ? "—" : rx.toFixed(2)} /><Stat label="P+Q (y)" value={isNaN(ry) ? "—" : ry.toFixed(2)} /></div>}
    ><canvas ref={canvasRef} width={420} height={380} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
