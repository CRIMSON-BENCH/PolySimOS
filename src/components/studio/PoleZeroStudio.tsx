"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { poleR: number; poleAng: number; zeroAng: number }> = {
  "Sharp resonance": { poleR: 0.96, poleAng: 45, zeroAng: 150 },
  "Gentle peak": { poleR: 0.6, poleAng: 45, zeroAng: 120 },
  "Deep notch": { poleR: 0.85, poleAng: 90, zeroAng: 85 },
  "Low-freq boost": { poleR: 0.92, poleAng: 20, zeroAng: 160 },
};

export function PoleZeroStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ poleR, poleAng, zeroAng }, update] = useShareableNumbers({ poleR: 0.85, poleAng: 45, zeroAng: 120 });
  const pa = poleAng * Math.PI / 180, za = zeroAng * Math.PI / 180;
  // H(z) with conjugate pole pair at poleR e^±ja and zeros on unit circle at ±za
  const resp = (w: number) => { const ejw = [Math.cos(w), Math.sin(w)]; const distTo = (r: number, a: number) => Math.hypot(ejw[0] - r * Math.cos(a), ejw[1] - r * Math.sin(a)) * Math.hypot(ejw[0] - r * Math.cos(-a), ejw[1] - r * Math.sin(-a)); return distTo(1, za) / (distTo(poleR, pa) + 1e-6); };

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // z-plane (left)
    const cx = 130, cy = H / 2, R = 90; ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(cx - R - 20, cy); ctx.lineTo(cx + R + 20, cy); ctx.moveTo(cx, cy - R - 20); ctx.lineTo(cx, cy + R + 20); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; [pa, -pa].forEach(a => { const x = cx + poleR * R * Math.cos(a), y = cy - poleR * R * Math.sin(a); ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke(); });
    ctx.strokeStyle = "#a3e635"; [za, -za].forEach(a => { const x = cx + R * Math.cos(a), y = cy - R * Math.sin(a); ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif"; ctx.fillText("z-plane · × pole ○ zero", 60, 30);
    // frequency response (right)
    const ox = 280, oy = H - 40, pw = 210, ph = H - 80; ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    let mx = 0; for (let i = 0; i <= pw; i++) mx = Math.max(mx, resp(Math.PI * i / pw));
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const m = resp(Math.PI * i / pw) / mx; const y = oy - m * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.fillText("|H(e^jω)| — poles peak, zeros notch", ox, 30);
  }, [poleR, poleAng, zeroAng]);

  const explain =
    poleR >= 0.95
      ? `A pole radius of ${poleR.toFixed(2)} sits right against the unit circle, so the filter rings with a tall, narrow resonance near ${poleAng}° — nudge it past 1 and the filter goes unstable.`
      : poleR <= 0.5
      ? `With the pole well inside the circle (r=${poleR.toFixed(2)}) the peak at ${poleAng}° is broad and gentle — a mild, well-damped response.`
      : Math.abs(poleAng - zeroAng) < 20
      ? `The zero at ${zeroAng}° sits close to the pole at ${poleAng}°, so the notch partly cancels the peak, giving a narrow band-shaping response.`
      : `A pole at r=${poleR.toFixed(2)}, ${poleAng}° gives a resonant peak while the zero at ${zeroAng}° carves a separate notch — a classic two-feature filter.`;

  const code = `import numpy as np
poleR, poleAng, zeroAng = ${poleR}, ${poleAng}, ${zeroAng}
pa, za = np.radians(poleAng), np.radians(zeroAng)
w = np.linspace(0, np.pi, 512)
ejw = np.exp(1j*w)
poles = [poleR*np.exp(1j*pa), poleR*np.exp(-1j*pa)]
zeros = [np.exp(1j*za), np.exp(-1j*za)]
num = np.abs((ejw-zeros[0])*(ejw-zeros[1]))
den = np.abs((ejw-poles[0])*(ejw-poles[1]))
H = num/den
print("peak gain", H.max(), "stable", poleR < 1)`;

  return (
    <StudioChrome title="Pole–Zero & Frequency Response" tagline="poles peak, zeros notch"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Pole radius" value={poleR} min={0.2} max={0.98} step={0.02} onChange={(v) => update({ poleR: v })} />
        <Slider label="Pole angle (°)" value={poleAng} min={5} max={175} step={5} onChange={(v) => update({ poleAng: v })} />
        <Slider label="Zero angle (°)" value={zeroAng} min={5} max={175} step={5} onChange={(v) => update({ zeroAng: v })} />
        <p className="mt-3 text-xs text-slate-500">A digital filter is defined by its poles and zeros in the z-plane. A pole near the unit circle creates a resonant peak at its angle; a zero on the circle carves a notch. Move them and watch the frequency response reshape. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Pole radius" value={poleR.toFixed(2)} />
        <Stat label="Resonance at" value={`${poleAng}° (ω)`} />
        <Stat label="Stability" value={poleR < 1 ? "stable ✓" : "unstable ⚠"} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
