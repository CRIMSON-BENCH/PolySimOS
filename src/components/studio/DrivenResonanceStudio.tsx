"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { f0: number; damp: number; drive: number }> = {
  "Driven at resonance": { f0: 1.0, damp: 0.1, drive: 1.0 },
  "High-Q (light damping)": { f0: 1.0, damp: 0.03, drive: 1.0 },
  "Heavily damped": { f0: 1.0, damp: 0.6, drive: 1.0 },
  "Off-resonance drive": { f0: 1.0, damp: 0.15, drive: 2.5 },
};

export function DrivenResonanceStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ f0, damp, drive }, update] = useShareableNumbers({ f0: 1.0, damp: 0.15, drive: 1.0 });

  const w0 = 2 * Math.PI * f0, gamma = 2 * damp * w0;
  const amp = (wd: number) => 1 / Math.sqrt(Math.pow(w0 * w0 - wd * wd, 2) + Math.pow(gamma * wd, 2));
  const A = amp(2 * Math.PI * drive), Q = 1 / (2 * damp);

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const fmax = f0 * 3; let peak = 0; for (let i = 0; i <= pw; i++) peak = Math.max(peak, amp(2 * Math.PI * fmax * i / pw));
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const a = amp(2 * Math.PI * fmax * i / pw) / peak; const x = ox + i, y = oy - a * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    const dx = ox + (drive / fmax) * pw; ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(dx, oy); ctx.lineTo(dx, oy - (A / peak) * ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("amplitude vs drive frequency (resonance curve)", ox + 6, oy - ph + 12); ctx.fillText("frequency →", ox + pw - 70, oy + 18);
  }, [f0, damp, drive]);

  const onResonance = Math.abs(drive - f0) < 0.06;
  const explain =
    onResonance && damp <= 0.05
      ? `Driving right at f₀ with very light damping: the response amplitude runs away to a tall, narrow peak — this high Q of ${Q.toFixed(0)} is exactly the regime that shatters a wine glass.`
      : onResonance
      ? `Driving at the natural frequency f₀, so you sit on the resonance peak; the damping ratio ζ caps the height at a quality factor Q of ${Q.toFixed(1)}.`
      : drive > f0 * 1.6
      ? `Driving well above f₀: the mass can’t keep up with the force, so the response stays small — far above resonance amplitude falls off steeply.`
      : `Off-resonance drive (${drive.toFixed(2)} Hz vs f₀ = ${f0.toFixed(2)} Hz): amplitude is well below the peak. Move the drive toward f₀ to climb the resonance curve.`;

  const code = `import numpy as np
f0, zeta, drive = ${f0}, ${damp}, ${drive}
w0 = 2*np.pi*f0; gamma = 2*zeta*w0
def amp(fd):
    wd = 2*np.pi*fd
    return 1/np.sqrt((w0**2 - wd**2)**2 + (gamma*wd)**2)
print("amplitude", amp(drive), "Q", 1/(2*zeta))`;

  return (
    <StudioChrome title="Driven Resonance" tagline="amplitude near the natural frequency"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Natural frequency f₀ (Hz)" value={f0} min={0.3} max={3} step={0.1} onChange={(v) => update({ f0: v })} />
        <Slider label="Damping ratio ζ" value={damp} min={0.02} max={0.7} step={0.01} onChange={(v) => update({ damp: v })} />
        <Slider label="Drive frequency (Hz)" value={drive} min={0.05} max={6} step={0.05} onChange={(v) => update({ drive: v })} />
        <p className="mt-3 text-xs text-slate-500">Push a swing at its natural frequency and the amplitude blows up — resonance. Less damping → a taller, sharper peak (higher Q). This is why bridges, buildings, and wine glasses each have a frequency you must avoid.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Response amplitude" value={A.toExponential(2)} />
        <Stat label="Quality factor Q" value={Q.toFixed(1)} />
        <Stat label="At resonance?" value={onResonance ? "yes ≈ peak" : "no"} />
        <Equation tex={`A(\\omega)=\\frac{F_0}{\\sqrt{(\\omega_0^2-\\omega^2)^2+(\\gamma\\omega)^2}},\\quad \\omega=2\\pi(${drive.toFixed(2)}),\\ \\zeta=${damp.toFixed(2)},\\ A=${A.toExponential(2)}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
