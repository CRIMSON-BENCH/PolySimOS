"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers, useCanvasDrag } from "@/lib/studioKit";

const W = 760, H = 480;

interface P { x: number; y: number; px: number; py: number; pin: boolean; }

const PRESETS: Record<string, { gravity: number; wind: number }> = {
  "Still air": { gravity: 0.4, wind: 0 },
  "Breezy": { gravity: 0.4, wind: 0.5 },
  "Gale": { gravity: 0.6, wind: 1 },
  "Zero-G drift": { gravity: 0, wind: 0.3 },
};

export function ClothStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cols = 28, rows = 20, spacing = 16;
  const pts = useRef<P[]>([]);
  const grab = useRef<number | null>(null);       // index of the mass point held by the pointer
  const grabPos = useRef({ x: 0, y: 0 });          // live pointer position (logical coords) the physics loop pins to
  const [{ gravity, wind }, update] = useShareableNumbers({ gravity: 0.4, wind: 0 });
  const gravityRef = useRef(gravity); gravityRef.current = gravity;
  const windRef = useRef(wind); windRef.current = wind;

  const reset = () => {
    const arr: P[] = []; const ox = W / 2 - (cols * spacing) / 2, oy = 40;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const px = ox + x * spacing, py = oy + y * spacing; arr.push({ x: px, y: py, px, py, pin: y === 0 && x % 4 === 0 }); }
    pts.current = arr;
  };
  useEffect(() => { reset(); /* eslint-disable-next-line */ }, []);

  // Direct-canvas grab: pick the nearest mass point on press, then pin it to the pointer every
  // frame (the physics loop reads grab.current + grabPos.current) so the whole sheet follows in
  // real time; release on pointer-up returns the node to the free Verlet simulation.
  useCanvasDrag(canvasRef, W, H, {
    pick: (x, y) => {
      let best = -1, bd = 24 * 24; // grab radius in logical px (spacing is 16)
      pts.current.forEach((p, i) => { const dd = (p.x - x) ** 2 + (p.y - y) ** 2; if (dd < bd) { bd = dd; best = i; } });
      if (best < 0) return false;
      grab.current = best; grabPos.current = { x, y };
      return true;
    },
    move: (x, y) => { grabPos.current = { x, y }; },
    up: () => { grab.current = null; },
  });

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H);
    const idx = (x: number, y: number) => y * cols + x;
    const rest = spacing;
    const arr = pts.current;
    const g = grab.current; // the held node this frame; treated like a pin locked to the pointer
    // advance the Verlet sim `steps` times (speed multiplier), then draw once
    for (let s = 0; s < steps; s++) {
      for (let i = 0; i < arr.length; i++) { const p = arr[i]; if (i === g) { p.x = grabPos.current.x; p.y = grabPos.current.y; p.px = p.x; p.py = p.y; continue; } if (p.pin) continue; const vx = (p.x - p.px) * 0.98 + windRef.current, vy = (p.y - p.py) * 0.98 + gravityRef.current; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy; if (p.y > H) p.y = H; }
      for (let k = 0; k < 3; k++) for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const constrain = (ax: number, ay: number, bx: number, by: number) => { const ai = idx(ax, ay), bi = idx(bx, by); const A = arr[ai], B = arr[bi]; const aFix = A.pin || ai === g, bFix = B.pin || bi === g; const dx = B.x - A.x, dy = B.y - A.y; const dist = Math.hypot(dx, dy) || 1; const diff = (dist - rest) / dist / 2; const ox = dx * diff, oy = dy * diff; if (!aFix) { A.x += ox; A.y += oy; } if (!bFix) { B.x -= ox; B.y -= oy; } };
        if (x < cols - 1) constrain(x, y, x + 1, y); if (y < rows - 1) constrain(x, y, x, y + 1);
      }
    }
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(34,211,238,0.5)"; ctx.lineWidth = 1; ctx.beginPath();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const p = arr[idx(x, y)]; if (x < cols - 1) { const q = arr[idx(x + 1, y)]; ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); } if (y < rows - 1) { const q = arr[idx(x, y + 1)]; ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); } }
    ctx.stroke();
    // highlight the node currently held by the pointer
    if (g !== null && arr[g]) { const p = arr[g]; ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("grab and drag the cloth to tug it around", 12, H - 12);
  };

  const t = useTransport(frame);

  const explain =
    gravity === 0
      ? "With gravity switched off, the sheet keeps whatever momentum it has and drifts — only the distance constraints pull it back toward its rest shape."
      : Math.abs(wind) > 0.6
      ? "Strong wind overpowers the light Verlet damping, so the sheet billows sideways and the free corners flap far from vertical."
      : wind === 0
      ? "No wind, so the cloth hangs straight down from its pinned top row and settles into a smooth catenary once the motion damps out."
      : "Gravity pulls the unpinned nodes down while a gentle wind skews the drape sideways; the distance constraints keep the weave from stretching.";

  const code = `import numpy as np
cols, rows, spacing = ${cols}, ${rows}, ${spacing}
gravity, wind = ${gravity}, ${wind}
p = np.array([[c * spacing, r * spacing] for r in range(rows) for c in range(cols)], float)
pp = p.copy()
pin = np.array([r == 0 and c % 4 == 0 for r in range(rows) for c in range(cols)])
idx = lambda x, y: y * cols + x
for _step in range(300):
    v = (p - pp) * 0.98 + [wind, gravity]
    pp = p.copy()
    p[~pin] += v[~pin]
    for _ in range(3):
        for y in range(rows):
            for x in range(cols):
                for nx, ny in ((x + 1, y), (x, y + 1)):
                    if nx < cols and ny < rows:
                        a, b = idx(x, y), idx(nx, ny)
                        d = p[b] - p[a]; dist = np.hypot(*d) or 1
                        off = d * (dist - spacing) / dist / 2
                        if not pin[a]: p[a] += off
                        if not pin[b]: p[b] -= off
print(p.mean(0))`;

  return (
    <StudioChrome title="Cloth / Spring-Mass Studio" tagline="Verlet integration · constraint relaxation"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">A grid of masses linked by springs, pinned at the top. Grab any node and drag it around — it&apos;s a real Verlet cloth simulation.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Gravity" value={gravity} min={0} max={1.2} step={0.05} onChange={(v) => update({ gravity: v })} />
        <Slider label="Wind" value={wind} min={-1} max={1} step={0.05} onChange={(v) => update({ wind: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Nodes" value={`${cols}×${rows}`} /><Stat label="Integrator" value="Verlet" /><Stat label="Constraints" value="distance (×3/frame)" /><Equation tex={`x' = 2x - x_{prev} + a\\,\\Delta t^2,\\quad |p_i - p_j| = ${spacing}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" /></StudioChrome>
  );
}
