"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, useCanvasDrag } from "@/lib/studioKit";

const W = 760, H = 480;
const SLIT_LINE_Y = 158; // y of the on-canvas slit apparatus (drag a slit to change separation d)
const SLIT_SCALE = 3.5; // px per unit of slit separation d, for the draggable markers

const PRESETS: Record<string, { d: number; a: number; lambda: number }> = {
  "Interference-dominated": { d: 70, a: 4, lambda: 20 },
  "Diffraction-dominated": { d: 15, a: 24, lambda: 20 },
  "Red light (wide fringes)": { d: 40, a: 8, lambda: 38 },
  "Blue light (tight fringes)": { d: 40, a: 8, lambda: 10 },
};

export function DoubleSlitStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ d, a, lambda }, update] = useShareableNumbers({ d: 40, a: 8, lambda: 20 });

  // Drag either slit on the canvas to set the slit separation d; the pattern updates live.
  useCanvasDrag(canvasRef, W, H, {
    pick: (_x, y) => Math.abs(y - SLIT_LINE_Y) < 28,
    move: (x) => {
      const nd = Math.round((2 * Math.abs(x - W / 2)) / SLIT_SCALE);
      update({ d: Math.max(15, Math.min(80, nd)) });
    },
  });

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const L = 800; // screen distance
    const intensity = (y: number) => {
      const theta = Math.atan2(y, L);
      const beta = (Math.PI * a * Math.sin(theta)) / lambda;
      const alpha = (Math.PI * d * Math.sin(theta)) / lambda;
      const sinc = beta === 0 ? 1 : Math.sin(beta) / beta;
      return sinc * sinc * Math.cos(alpha) * Math.cos(alpha);
    };
    // fringe band (top) + intensity curve (bottom)
    for (let px = 0; px < W; px++) { const y = (px - W / 2) * 0.6; const I = intensity(y); const c = Math.round(I * 255); ctx.fillStyle = `rgb(${Math.round(c * 0.2)},${Math.round(c * 0.85)},${c})`; ctx.fillRect(px, 0, 1, 140); }
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let px = 0; px < W; px++) { const y = (px - W / 2) * 0.6; const I = intensity(y); const yy = H - 20 - I * (H - 200); px ? ctx.lineTo(px, yy) : ctx.moveTo(px, yy); }
    ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("intensity on screen", 16, 168); ctx.fillText("interference + diffraction envelope", 16, H - 10);

    // draggable slit apparatus: two markers separated by d — drag a slit to change the separation
    const half = (d / 2) * SLIT_SCALE;
    ctx.strokeStyle = "rgba(163,230,53,0.55)"; ctx.lineWidth = 2; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(W / 2 - half, SLIT_LINE_Y); ctx.lineTo(W / 2 + half, SLIT_LINE_Y); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(148,163,184,0.5)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2, SLIT_LINE_Y - 9); ctx.lineTo(W / 2, SLIT_LINE_Y + 9); ctx.stroke();
    ctx.fillStyle = "#a3e635";
    for (const cx of [W / 2 - half, W / 2 + half]) { ctx.beginPath(); ctx.arc(cx, SLIT_LINE_Y, 7, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#a3e635"; ctx.font = "11px system-ui"; ctx.textAlign = "center";
    ctx.fillText("← drag a slit to set separation d →", W / 2, SLIT_LINE_Y - 16); ctx.textAlign = "left";
  }, [d, a, lambda]);

  const fringes = Math.max(1, Math.round((2 * d) / a));
  const explain =
    d <= a
      ? `Slit width a rivals the separation d, so the diffraction envelope is wider than the fringe spacing — the pattern reads as one broad diffraction blob, not clean fringes.`
      : lambda >= 34
      ? `Long wavelength: fringe spacing scales as λ/d, so this red-end light spreads the bright bands far apart — about ${fringes} fringes sit under the central envelope.`
      : lambda <= 12
      ? `Short wavelength: fringe spacing (∝ λ/d) is tight, packing roughly ${fringes} closely-spaced bright bands under the central diffraction envelope.`
      : `Two-slit interference sets the fine fringe spacing (∝ λ/d) while single-slit diffraction sets the envelope (∝ λ/a); here about ${fringes} bright fringes fit under the central peak.`;

  const code = `import numpy as np
d, a, lam, L = ${d}, ${a}, ${lambda}, 800.0
y = np.linspace(-260, 260, 800)
theta = np.arctan2(y, L)
beta = np.pi*a*np.sin(theta)/lam
alpha = np.pi*d*np.sin(theta)/lam
sinc = np.where(beta==0, 1.0, np.sin(beta)/beta)
I = sinc**2 * np.cos(alpha)**2
print("peak intensity", I.max())`;

  return (
    <StudioChrome title="Double-Slit Experiment" tagline="wave interference + diffraction"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">The iconic experiment: two slits create interference fringes, modulated by each slit&apos;s diffraction envelope.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Slit separation d" value={d} min={15} max={80} step={1} onChange={(v) => update({ d: v })} />
        <Slider label="Slit width a" value={a} min={2} max={30} step={1} onChange={(v) => update({ a: v })} />
        <Slider label="Wavelength λ" value={lambda} min={8} max={40} step={1} onChange={(v) => update({ lambda: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Fringe spacing" value={`∝ λ/d`} />
        <Stat label="Envelope" value={`∝ λ/a`} />
        <Stat label="Regime" value={d > a ? "interference-dominated" : "diffraction-dominated"} />
        <Equation tex={`I=I_0\\cos^2\\!\\frac{\\pi d\\sin\\theta}{\\lambda}\\,\\mathrm{sinc}^2\\!\\frac{\\pi a\\sin\\theta}{\\lambda},\\quad \\Delta y=\\frac{\\lambda L}{d}=\\frac{${lambda}\\cdot 800}{${d}}=${((lambda * 800) / d).toFixed(0)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
