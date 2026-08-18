"use client";

import { useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers, useCanvasDrag } from "@/lib/studioKit";

// Double pendulum — the textbook chaotic system. Exact equations of motion,
// integrated with RK4, with a fading trail of the lower bob.
const W = 760, H = 480;

const PRESETS: Record<string, { m2: number; g: number }> = {
  "Gentle swing": { m2: 8, g: 4 },
  "Equal arms": { m2: 10, g: 9.8 },
  "Top-heavy": { m2: 2, g: 9.8 },
  "High energy (chaos)": { m2: 30, g: 20 },
};

type S = [number, number, number, number]; // th1, th2, w1, w2

function deriv(s: S, m1: number, m2: number, l1: number, l2: number, g: number): S {
  const [t1, t2, w1, w2] = s;
  const d = t1 - t2;
  const den1 = (m1 + m2) * l1 - m2 * l1 * Math.cos(d) * Math.cos(d);
  const den2 = (l2 / l1) * den1;
  const a1 = (m2 * l1 * w1 * w1 * Math.sin(d) * Math.cos(d) + m2 * g * Math.sin(t2) * Math.cos(d) + m2 * l2 * w2 * w2 * Math.sin(d) - (m1 + m2) * g * Math.sin(t1)) / den1;
  const a2 = (-m2 * l2 * w2 * w2 * Math.sin(d) * Math.cos(d) + (m1 + m2) * (g * Math.sin(t1) * Math.cos(d) - l1 * w1 * w1 * Math.sin(d) - g * Math.sin(t2))) / den2;
  return [w1, w2, a1, a2];
}
function rk4(s: S, h: number, p: { m1: number; m2: number; l1: number; l2: number; g: number }): S {
  const f = (x: S) => deriv(x, p.m1, p.m2, p.l1, p.l2, p.g);
  const add = (a: S, b: S, k: number): S => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k, a[3] + b[3] * k];
  const k1 = f(s), k2 = f(add(s, k1, h / 2)), k3 = f(add(s, k2, h / 2)), k4 = f(add(s, k3, h));
  return [
    s[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    s[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    s[2] + (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    s[3] + (h / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
  ];
}

export function DoublePendulumStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<S>([Math.PI / 2, Math.PI / 2, 0, 0]);
  const trail = useRef<[number, number][]>([]);
  const [{ m2, g }, update] = useShareableNumbers({ m2: 10, g: 9.8 });
  const m2Ref = useRef(m2); m2Ref.current = m2;
  const gRef = useRef(g); gRef.current = g;

  const reset = () => { stateRef.current = [Math.PI / 2 + (Math.random() - 0.5) * 0.02, Math.PI / 2, 0, 0]; trail.current = []; };

  const ox = W / 2, oy = H / 2 - 60, l1 = 120, l2 = 120;

  // Render only — reads stateRef.current, never advances it. Shared by the physics
  // tick (after it integrates) and by drag-move (which repositions a bob directly).
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H);
    const [t1, t2] = stateRef.current;
    const x1 = ox + l1 * Math.sin(t1), y1 = oy + l1 * Math.cos(t1);
    const x2 = x1 + l2 * Math.sin(t2), y2 = y1 + l2 * Math.cos(t2);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1.5;
    for (let i = 1; i < trail.current.length; i++) { const a = i / trail.current.length; ctx.strokeStyle = `hsla(${190 - a * 120},90%,60%,${a})`; ctx.beginPath(); ctx.moveTo(...trail.current[i - 1]); ctx.lineTo(...trail.current[i]); ctx.stroke(); }
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(x1, y1, 8, 0, 7); ctx.fill();
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(x2, y2, 6 + m2Ref.current * 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("drag either bob to set a new start", 12, 20);
  };

  const frame = (steps: number) => {
    const p = { m1: 10, m2: m2Ref.current, l1: 1.2, l2: 1.2, g: gRef.current };
    for (let s = 0; s < steps; s++) for (let i = 0; i < 4; i++) stateRef.current = rk4(stateRef.current, 0.02, p);
    const [t1, t2] = stateRef.current;
    const x1 = ox + l1 * Math.sin(t1), y1 = oy + l1 * Math.cos(t1);
    const x2 = x1 + l2 * Math.sin(t2), y2 = y1 + l2 * Math.cos(t2);
    trail.current.push([x2, y2]); if (trail.current.length > 400) trail.current.shift();
    draw();
  };

  const t = useTransport(frame);

  // Grab a bob to pause playback and set a new starting angle by hand; releasing
  // leaves it there (velocities zeroed) until Play is pressed again.
  const dragBob = useRef<0 | 1 | 2>(0);
  useCanvasDrag(canvasRef, W, H, {
    pick: (px, py) => {
      const [th1, th2] = stateRef.current;
      const x1 = ox + l1 * Math.sin(th1), y1 = oy + l1 * Math.cos(th1);
      const x2 = x1 + l2 * Math.sin(th2), y2 = y1 + l2 * Math.cos(th2);
      if (Math.hypot(x2 - px, y2 - py) < 14) { dragBob.current = 2; t.pause(); return true; }
      if (Math.hypot(x1 - px, y1 - py) < 14) { dragBob.current = 1; t.pause(); return true; }
      return false;
    },
    move: (px, py) => {
      if (dragBob.current === 1) {
        const th1 = Math.atan2(px - ox, py - oy);
        stateRef.current = [th1, stateRef.current[1], 0, 0];
      } else if (dragBob.current === 2) {
        const [th1] = stateRef.current;
        const x1 = ox + l1 * Math.sin(th1), y1 = oy + l1 * Math.cos(th1);
        const th2 = Math.atan2(px - x1, py - y1);
        stateRef.current = [th1, th2, 0, 0];
      }
      draw();
    },
    up: () => { dragBob.current = 0; },
  });

  const heavy = m2 >= 20;
  const energetic = g >= 15;
  const explain =
    energetic || heavy
      ? `Both bobs start near 90° (π/2) — far past the small-angle regime — and with lower-bob mass ${m2} and g ${g} the system is strongly driven. Two runs that differ by a hair (0.02 rad, what Reset injects) peel apart exponentially fast: this is sensitive dependence, a positive Lyapunov exponent, deterministic chaos.`
      : g <= 5
      ? `With gentle gravity g ${g} the swing is slow, but the 90° (π/2) start still sits well outside the near-periodic small-angle regime. The motion stays chaotic — tiny differences in the start (0.02 rad) grow without bound — just on a longer timescale.`
      : `Starting both arms at 90° (π/2) with lower-bob mass ${m2} and g ${g} puts the pendulum firmly in its chaotic regime. Unlike a small-angle swing, which would be near-periodic, here trajectories that differ by 0.02 rad diverge exponentially — a positive Lyapunov exponent.`;

  const code = `import numpy as np
m1, m2, l1, l2, g = 10.0, ${m2}, 1.2, 1.2, ${g}

def deriv(s):
    t1, t2, w1, w2 = s
    d = t1 - t2
    den1 = (m1 + m2) * l1 - m2 * l1 * np.cos(d) ** 2
    den2 = (l2 / l1) * den1
    a1 = (m2 * l1 * w1 * w1 * np.sin(d) * np.cos(d) + m2 * g * np.sin(t2) * np.cos(d)
          + m2 * l2 * w2 * w2 * np.sin(d) - (m1 + m2) * g * np.sin(t1)) / den1
    a2 = (-m2 * l2 * w2 * w2 * np.sin(d) * np.cos(d) + (m1 + m2) * (g * np.sin(t1) * np.cos(d)
          - l1 * w1 * w1 * np.sin(d) - g * np.sin(t2))) / den2
    return np.array([w1, w2, a1, a2])

s = np.array([np.pi / 2, np.pi / 2, 0.0, 0.0]); h = 0.02
for _ in range(2000):  # RK4 integration
    k1 = deriv(s); k2 = deriv(s + h / 2 * k1)
    k3 = deriv(s + h / 2 * k2); k4 = deriv(s + h * k3)
    s += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
print("theta1, theta2, w1, w2 =", s)`;

  return (
    <StudioChrome title="Double Pendulum Studio" tagline="chaotic dynamics · RK4"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">Tiny changes in the start explode into totally different motion — deterministic chaos. Drag either bob to set a new starting position; it pauses playback automatically.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Lower bob mass" value={m2} min={2} max={30} step={1} onChange={(v) => update({ m2: v })} />
        <Slider label="Gravity g" value={g} min={2} max={20} step={0.5} onChange={(v) => update({ g: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Integrator" value="RK4" />
        <Stat label="System" value="Chaotic" />
        <Stat label="DOF" value="2" />
        <Stat label="Lower bob mass" value={String(m2)} />
        <Stat label="Gravity g" value={String(g)} />
        <Equation tex={`\\begin{aligned}\\ddot\\theta_1 &= \\frac{-g(2m_1+m_2)\\sin\\theta_1 - m_2 g\\sin(\\theta_1-2\\theta_2) - 2m_2\\sin(\\theta_1-\\theta_2)\\left(\\dot\\theta_2^2 L_2 + \\dot\\theta_1^2 L_1\\cos(\\theta_1-\\theta_2)\\right)}{L_1\\left(2m_1+m_2-m_2\\cos(2\\theta_1-2\\theta_2)\\right)}\\\\[4pt]\\ddot\\theta_2 &= \\frac{2\\sin(\\theta_1-\\theta_2)\\left(\\dot\\theta_1^2 L_1(m_1+m_2)+g(m_1+m_2)\\cos\\theta_1+\\dot\\theta_2^2 L_2 m_2\\cos(\\theta_1-\\theta_2)\\right)}{L_2\\left(2m_1+m_2-m_2\\cos(2\\theta_1-2\\theta_2)\\right)}\\\\[4pt]&\\quad m_1=10,\\ m_2=${m2.toFixed(0)},\\ L_1=L_2=1.2,\\ g=${g.toFixed(1)}\\end{aligned}`} />
        <ExplainResult text={explain} />
      </div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
