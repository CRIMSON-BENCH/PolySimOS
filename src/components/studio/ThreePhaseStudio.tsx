"use client";

import { useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { vLine: number; current: number; pf: number }> = {
  "US 480 V motor": { vLine: 480, current: 40, pf: 0.85 },
  "EU 400 V feeder": { vLine: 400, current: 63, pf: 0.9 },
  "Low-PF load": { vLine: 400, current: 100, pf: 0.6 },
  "690 V drive": { vLine: 690, current: 150, pf: 0.95 },
};

// Three-phase power: waveforms, phasors, power.
export function ThreePhaseStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ vLine, current, pf }, update] = useShareableNumbers({ vLine: 400, current: 20, pf: 0.9 });
  const phase = useRef(0);

  const vPhase = vLine / Math.sqrt(3);
  const P = Math.sqrt(3) * vLine * current * pf / 1000; // kW
  const S = Math.sqrt(3) * vLine * current / 1000; // kVA
  const Q = Math.sqrt(Math.max(0, S * S - P * P)); // kVAR
  const phi = Math.acos(pf);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cols = ["#f472b6", "#a3e635", "#22d3ee"];
    phase.current += 0.04 * steps; const t = phase.current; const W = 540, H = 320;
    const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // waveforms (left)
    const ox = 20, mid = H / 2, wv = 300;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, mid); ctx.lineTo(ox + wv, mid); ctx.stroke();
    for (let p = 0; p < 3; p++) { ctx.strokeStyle = cols[p]; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= wv; i++) { const x = (i / wv) * 4 * Math.PI; const v = Math.sin(x - t - p * 2 * Math.PI / 3); const y = mid - v * 70; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke(); }
    // phasors (right)
    const px = 420, py = mid, R = 70;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.arc(px, py, R, 0, 7); ctx.stroke();
    for (let p = 0; p < 3; p++) { const ang = -t - p * 2 * Math.PI / 3; ctx.strokeStyle = cols[p]; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(ang) * R, py + Math.sin(ang) * R); ctx.stroke(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("three-phase voltages (120° apart)", ox, 18); ctx.fillText("phasors", px - 20, py + R + 20);
  };

  const tr = useTransport(frame);

  const explain =
    pf >= 0.98
      ? `At near-unity power factor almost all the ${S.toFixed(1)} kVA does useful work, so reactive burden Q stays low and line losses are minimal.`
      : pf < 0.7
      ? `A low power factor (${pf.toFixed(2)}) means the ${current} A carries mostly reactive current — you draw ${S.toFixed(1)} kVA to deliver only ${P.toFixed(1)} kW, wasting capacity.`
      : `Real power P = √3·V_line·I·cosφ = ${P.toFixed(1)} kW, trailing the ${S.toFixed(1)} kVA apparent power by the angle φ = ${(phi * 180 / Math.PI).toFixed(0)}°.`;

  const code = `import numpy as np
v_line, current, pf = ${vLine}, ${current}, ${pf}
v_phase = v_line / np.sqrt(3)
S = np.sqrt(3) * v_line * current / 1000      # kVA
P = S * pf                                    # kW
Q = np.sqrt(max(0, S**2 - P**2))              # kVAR
print("V_phase", round(v_phase, 1), "P", round(P, 1), "S", round(S, 1), "Q", round(Q, 1))`;

  return (
    <StudioChrome title="Three-Phase Power" tagline="the grid's backbone"
      controls={<div>
        <TransportBar playing={tr.playing} onToggle={tr.toggle} onStep={tr.step} speed={tr.speed} onSpeed={tr.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Line voltage (V)" value={vLine} min={120} max={690} step={10} onChange={(v) => update({ vLine: v })} />
        <Slider label="Line current (A)" value={current} min={1} max={200} step={1} onChange={(v) => update({ current: v })} />
        <Slider label="Power factor" value={pf} min={0.5} max={1} step={0.01} onChange={(v) => update({ pf: v })} />
        <p className="mt-3 text-xs text-slate-500">Three-phase power delivers energy on three conductors carrying sinusoids 120° apart, so total power is constant and motors self-start. Line and phase voltages differ by √3, and real power is P = √3·V_line·I·cosφ. The power factor cosφ measures how much current actually does useful work.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Phase voltage" value={`${vPhase.toFixed(0)} V`} />
        <Stat label="Real power P" value={`${P.toFixed(1)} kW`} />
        <Stat label="Apparent S" value={`${S.toFixed(1)} kVA`} />
        <Stat label="Reactive Q" value={`${Q.toFixed(1)} kVAR`} />
        <Equation tex={`P = \\sqrt{3}\\,V_L I\\cos\\varphi = \\sqrt{3}\\times ${vLine}\\times ${current}\\times ${pf} = ${P.toFixed(1)}\\ \\text{kW}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
