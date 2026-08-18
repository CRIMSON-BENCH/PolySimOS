"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { angle: number }> = {
  "Aligned (0°)": { angle: 0 },
  "Coin flip (90°)": { angle: 90 },
  "Anti-aligned (180°)": { angle: 180 },
  "Mostly up (45°)": { angle: 45 },
};

// Sequential Stern-Gerlach: prepared spin-up, measured along angle theta.
export function SternGerlachStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ angle }, update] = useShareableNumbers({ angle: 60 });
  const angleRef = useRef(angle); angleRef.current = angle;
  const counts = useRef({ up: 0, down: 0 });
  const [, force] = useState(0);
  const seedRef = useRef(11);

  const pUp = Math.cos(angle * Math.PI / 360) ** 2; // cos^2(theta/2)
  const pUpRef = useRef(pUp); pUpRef.current = pUp;

  const reset = () => { counts.current = { up: 0, down: 0 }; seedRef.current = 11; };
  useEffect(reset, [angle]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let s = seedRef.current; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; seedRef.current = s; return s / 4294967296; };
    for (let k = 0; k < 5 * steps; k++) { if (rnd() < pUpRef.current) counts.current.up++; else counts.current.down++; }
    force((n) => n + 1);
    const W = 520, H = 300; const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // source beam
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, H / 2); ctx.lineTo(200, H / 2); ctx.stroke();
    ctx.fillStyle = "#bef264"; ctx.font = "11px sans-serif"; ctx.fillText("spin-up source", 24, H / 2 - 10);
    // magnet
    ctx.fillStyle = "#334155"; ctx.fillRect(200, H / 2 - 40, 40, 80); ctx.fillStyle = "#94a3b8"; ctx.fillText(`analyzer ${angleRef.current}°`, 195, H / 2 + 58);
    // two output beams sized by probability
    const tot = counts.current.up + counts.current.down || 1; const fUp = counts.current.up / tot;
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2 + fUp * 14; ctx.beginPath(); ctx.moveTo(240, H / 2); ctx.lineTo(480, H / 2 - 60); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2 + (1 - fUp) * 14; ctx.beginPath(); ctx.moveTo(240, H / 2); ctx.lineTo(480, H / 2 + 60); ctx.stroke();
    ctx.fillStyle = "#67e8f9"; ctx.fillText(`+ : ${(fUp * 100).toFixed(0)}%`, 485, H / 2 - 58); ctx.fillStyle = "#f9a8d4"; ctx.fillText(`− : ${((1 - fUp) * 100).toFixed(0)}%`, 485, H / 2 + 62);
  };

  const tr = useTransport(frame);

  const tot = counts.current.up + counts.current.down || 1;

  const explain =
    angle === 0
      ? "The analyzer is aligned with the prepared spin, so every atom comes out up — a perfectly predictable measurement."
      : angle === 180
      ? "The analyzer is anti-aligned, so cos²(θ/2) = 0: every atom is flipped to down."
      : Math.abs(angle - 90) < 1e-9
      ? "At 90° the two outcomes are equally likely — the measurement is a perfect quantum coin flip, cos²(45°) = 0.5."
      : pUp > 0.5
      ? `Tilted by ${angle}°, the analyzer still favors up: theory predicts P(up) = cos²(θ/2) ≈ ${pUp.toFixed(2)}, and the tally converges there.`
      : `Tilted past 90°, down becomes the more likely outcome: P(up) = cos²(θ/2) ≈ ${pUp.toFixed(2)}.`;

  const code = `import numpy as np
theta = np.radians(${angle})
p_up = np.cos(theta / 2) ** 2
draws = (np.random.random(10000) < p_up)
print("P(up) theory", p_up, "measured", draws.mean())`;

  return (
    <StudioChrome title="Stern-Gerlach Experiment" tagline="spin measurement & projection"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Analyzer angle θ (°)" value={angle} min={0} max={180} step={5} onChange={(v) => update({ angle: v })} />
        <div className="mt-3"><TransportBar playing={tr.playing} onToggle={tr.toggle} onStep={tr.step} onReset={() => { reset(); tr.step(); }} speed={tr.speed} onSpeed={tr.setSpeed} /></div>
        <p className="mt-3 text-xs text-slate-500">Atoms prepared spin-up are measured along an axis tilted by θ. Quantum mechanics says each atom randomly comes out up or down, with probability cos²(θ/2) for up — never a fraction. At 90° it is a perfect coin flip; at 180° it always flips. The running tally converges to the Born-rule probability.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="P(up) theory" value={pUp.toFixed(3)} /><Stat label="Measured up" value={`${(counts.current.up / tot * 100).toFixed(1)}%`} /><Stat label="Atoms" value={tot.toLocaleString()} /><Equation tex={`P(\\uparrow)=\\cos^2\\tfrac{\\theta}{2}=${pUp.toFixed(3)},\\quad P(\\downarrow)=\\sin^2\\tfrac{\\theta}{2}=${(1 - pUp).toFixed(3)},\\quad \\theta=${angle}^\\circ`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
