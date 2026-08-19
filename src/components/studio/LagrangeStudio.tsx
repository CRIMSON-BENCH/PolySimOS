"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, useCanvasDrag } from "@/lib/studioKit";

const PRESETS: Record<string, { mu: number }> = {
  "Earth–Moon": { mu: 0.0123 },
  "Stability limit": { mu: 0.0385 },
  "Pluto–Charon": { mu: 0.1 },
  "Equal masses": { mu: 0.5 },
};

// Canvas geometry — shared by the draw effect and the drag handler (logical coords).
const W = 480, H = 420, CX = W / 2, CY = H / 2, SCALE = 130;

// Restricted 3-body: effective potential in rotating frame + L1-L5.
export function LagrangeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ mu }, update] = useShareableNumbers({ mu: 0.15 }); // mass ratio m2/(m1+m2)
  const [showPot, setShowPot] = useState(true);

  // Drag the secondary (blue) mass along the axis to set the mass ratio: it sits at x = 1-mu.
  useCanvasDrag(canvasRef, W, H, {
    pick: (x, y) => Math.hypot(CX + (1 - mu) * SCALE - x, CY - y) < 16,
    move: (x) => { const X = (x - CX) / SCALE; update({ mu: Math.max(0.01, Math.min(0.5, 1 - X)) }); },
  });

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H); const cx = CX, cy = CY, scale = SCALE;
    // positions (rotating frame), primary at -mu, secondary at 1-mu
    const x1 = -mu, x2 = 1 - mu;
    const Omega = (X: number, Y: number) => { const r1 = Math.hypot(X - x1, Y), r2 = Math.hypot(X - x2, Y); return 0.5 * (X * X + Y * Y) + (1 - mu) / (r1 + 1e-6) + mu / (r2 + 1e-6); };
    if (showPot) { const img = ctx.createImageData(W, H);
      for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) { const X = (px - cx) / scale, Y = (py - cy) / scale; let v = Omega(X, Y); v = Math.min(3.5, v); const t = (v - 1.4) / 2.1;
        const idx = (py * W + px) * 4; const band = (Math.sin(v * 24) * 0.5 + 0.5) * 30; img.data[idx] = 11 + t * 40 + band; img.data[idx + 1] = 18 + t * 60; img.data[idx + 2] = 32 + (1 - t) * 90 + band; img.data[idx + 3] = 255; }
      ctx.putImageData(img, 0, 0);
    } else { ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H); }
    // L points (approx). Collinear via series; triangular exact.
    const L1 = x2 - Math.pow(mu / 3, 1 / 3), L2 = x2 + Math.pow(mu / 3, 1 / 3), L3 = -1 - (5 / 12) * mu;
    const pts: [number, number, string][] = [[L1, 0, "L1"], [L2, 0, "L2"], [L3, 0, "L3"], [0.5 - mu, Math.sqrt(3) / 2, "L4"], [0.5 - mu, -Math.sqrt(3) / 2, "L5"]];
    ctx.fillStyle = "#a3e635"; ctx.font = "11px sans-serif";
    pts.forEach(([X, Y, lbl]) => { const px = cx + X * scale, py = cy + Y * scale; ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fillStyle = "#a3e635"; ctx.fill(); ctx.fillStyle = "#e2e8f0"; ctx.fillText(lbl, px + 6, py - 4); });
    // bodies
    ctx.beginPath(); ctx.arc(cx + x1 * scale, cy, 10, 0, 7); ctx.fillStyle = "#fbbf24"; ctx.fill();
    ctx.beginPath(); ctx.arc(cx + x2 * scale, cy, 6, 0, 7); ctx.fillStyle = "#60a5fa"; ctx.fill();
    // hint: the secondary mass is draggable
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("drag the blue secondary mass to change μ", 10, H - 12);
  }, [mu, showPot]);

  const explain =
    mu < 0.0385
      ? `With μ=${mu.toFixed(3)} below the 0.0385 threshold, the triangular points L4 and L5 are genuinely stable — a body nudged there drifts back, which is why Jupiter’s Trojan asteroids collect 60° ahead of and behind the planet.`
      : `At μ=${mu.toFixed(3)} the masses are too comparable: even L4 and L5 turn unstable, so every Lagrange point here needs active station-keeping to hold a spacecraft in place.`;

  const code = `mu = ${mu}
x2 = 1 - mu
L1 = x2 - (mu/3)**(1/3)
L2 = x2 + (mu/3)**(1/3)
L3 = -1 - 5/12*mu
L4 = (0.5 - mu,  3**0.5/2)   # leads by 60 deg
L5 = (0.5 - mu, -3**0.5/2)   # trails by 60 deg
print("L4/L5 stable" if mu < 0.0385 else "L4/L5 unstable")
print(L1, L2, L3, L4, L5)`;

  return (
    <StudioChrome title="Lagrange Points" tagline="restricted three-body problem"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Mass ratio μ" value={mu} min={0.01} max={0.5} step={0.01} onChange={(v) => update({ mu: v })} />
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><input type="checkbox" checked={showPot} onChange={(e) => setShowPot(e.target.checked)} /> Show effective potential</label>
        <p className="mt-3 text-xs text-slate-500">In a two-body system, five points let a small object stay fixed in the rotating frame. L1-L3 sit on the line through the two masses (unstable); L4 and L5 lead and trail the secondary by 60° and are stable for μ below 0.0385 — where Jupiter&apos;s Trojan asteroids live. JWST orbits the Sun-Earth L2.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="μ = m₂/(m₁+m₂)" value={mu.toFixed(3)} /><Stat label="L4/L5 stable?" value={mu < 0.0385 ? "yes" : "no"} /><Stat label="Points" value="5" /><Equation tex={`\\Omega(x,y)=\\tfrac{1}{2}\\left(x^{2}+y^{2}\\right)+\\frac{1-\\mu}{r_{1}}+\\frac{\\mu}{r_{2}},\\quad \\mu=${mu.toFixed(3)}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={480} height={420} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
