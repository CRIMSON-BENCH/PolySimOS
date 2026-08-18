"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;

const PRESETS: Record<string, { ecc: number; a: number }> = {
  "Circular (e=0)": { ecc: 0, a: 140 },
  "Earth-like (e≈0.017)": { ecc: 0.02, a: 160 },
  "Comet (high e)": { ecc: 0.96, a: 120 },
  "Elongated ellipse": { ecc: 0.8, a: 150 },
};

export function KeplerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ ecc, a }, update] = useShareableNumbers({ ecc: 0.6, a: 140 });
  const eccRef = useRef(ecc); eccRef.current = ecc;
  const st = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const trail = useRef<[number, number][]>([]);

  const reset = () => {
    const GM = 4000; const rp = a * (1 - ecc);
    st.current = { x: rp, y: 0, vx: 0, vy: Math.sqrt((GM / a) * (1 + ecc) / (1 - ecc)) };
    trail.current = [];
  };
  useEffect(() => { reset(); /* eslint-disable-next-line */ }, [ecc, a]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H); const GM = 4000, cx = W / 2, cy = H / 2;
    const s = st.current;
    for (let n = 0; n < steps; n++) {
      for (let i = 0; i < 4; i++) { const r = Math.hypot(s.x, s.y) || 1; const f = -GM / (r * r * r); s.vx += f * s.x * 0.02; s.vy += f * s.y * 0.02; s.x += s.vx * 0.02; s.y += s.vy * 0.02; }
      trail.current.push([cx + s.x, cy + s.y]); if (trail.current.length > 1200) trail.current.shift();
    }
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(34,211,238,0.5)"; ctx.lineWidth = 1; ctx.beginPath(); trail.current.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke();
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill(); // star at focus
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(cx + s.x, cy + s.y, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(eccRef.current < 0.01 ? "circle" : eccRef.current < 1 ? "ellipse" : "hyperbola", 16, 22);
  };

  const t = useTransport(frame);

  const explain =
    ecc < 0.01
      ? `At e=0 the orbit is a perfect circle: the planet holds a constant distance from the star and moves at constant speed. Its period still scales as a^(3/2) (Kepler's third law), so a=${a} fixes the year length.`
      : ecc < 1
      ? `At e=${ecc.toFixed(2)} the orbit is an ellipse with the star at one focus. The planet sweeps equal areas in equal times, so it runs fastest at perihelion and slowest at aphelion. A higher e means a more elongated ellipse. The period grows as a^(3/2) (Kepler's third law), so a=${a} sets the year length.`
      : `At e=${ecc.toFixed(2)} (>1) the path is an open hyperbola: the body swings past the star once and escapes, so there is no closed period — Kepler's third law applies only to bound e<1 orbits.`;

  const code = `import numpy as np
import matplotlib.pyplot as plt

e = ${ecc}          # eccentricity
a = ${a}            # semi-major axis

# Solve Kepler's equation  M = E - e*sin(E)  for E via Newton iteration
M = np.linspace(0, 2*np.pi, 400)   # mean anomaly
E = M.copy()                        # initial guess
for _ in range(50):
    E -= (E - e*np.sin(E) - M) / (1 - e*np.cos(E))

# true anomaly + radius, then Cartesian orbit
theta = 2*np.arctan2(np.sqrt(1+e)*np.sin(E/2), np.sqrt(1-e)*np.cos(E/2))
r = a*(1 - e*np.cos(E))
x, y = r*np.cos(theta), r*np.sin(theta)

plt.plot(x, y); plt.plot(0, 0, 'y*', ms=15)  # star at focus
plt.axis('equal'); plt.show()`;

  return (
    <StudioChrome title="Kepler Orbit Studio" tagline="two-body gravity · conic-section orbits"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">Set the eccentricity to trace Kepler{"'"}s orbits — a circle, ellipse, or (past e=1) an escape hyperbola. The star sits at the focus.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Eccentricity e" value={ecc} min={0} max={1.2} step={0.02} onChange={(v) => update({ ecc: v })} />
        <Slider label="Semi-major axis" value={a} min={80} max={200} step={5} onChange={(v) => update({ a: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Eccentricity" value={ecc.toFixed(2)} /><Stat label="Orbit" value={ecc < 0.01 ? "circular" : ecc < 1 ? "elliptical" : "hyperbolic"} /><Stat label="Law" value="Kepler / 1-r²" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
