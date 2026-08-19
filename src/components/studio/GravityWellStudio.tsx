"use client";

import { useEffect, useRef, useState } from "react";
import { project } from "@/lib/engines/threeD";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, useCanvasDrag } from "@/lib/studioKit";

const W = 760, H = 480;

const PRESETS: Record<string, { mass: number }> = {
  "Red dwarf": { mass: 25 },
  "Sun-like": { mass: 60 },
  "Blue giant": { mass: 90 },
  "Black hole": { mass: 120 },
};

export function GravityWellStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const cam = useRef({ yaw: 0.6, pitch: -0.6 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [{ mass }, update] = useShareableNumbers({ mass: 60 });
  const body = useRef({ x: 90, z: 0, vx: 0, vz: 1.4 });
  // Central-mass position in logical plane coordinates (draggable). Ref mirrors it for the rAF loop.
  const [center, setCenter] = useState({ x: 0, z: 0 });
  const centerRef = useRef(center); centerRef.current = center;
  const massDrag = useRef(false); // true while the star itself is being dragged (blocks camera orbit)

  // Drag the central star on the canvas to reposition it: hit-test its projected marker, then
  // inverse-project the pointer onto the well-bottom plane so the mass follows the cursor.
  useCanvasDrag(canvasRef, W, H, {
    pick: (px, py) => {
      const c = cam.current, cc = centerRef.current;
      const y0 = -mass * 120 / 18; // well-bottom height at the mass (depth at r=0)
      const p = project({ x: cc.x, y: y0, z: cc.z }, c.yaw, c.pitch, 620, W, H);
      const hit = Math.hypot(p.sx2 - px, p.sy2 - py) < 20;
      massDrag.current = hit;
      return hit;
    },
    move: (px, py) => {
      const c = cam.current;
      const y0 = -mass * 120 / 18;
      const cyaw = Math.cos(c.yaw), syaw = Math.sin(c.yaw);
      const cpit = Math.cos(c.pitch), spit = Math.sin(c.pitch);
      const fov = 500, camDist = 620;
      const u = px - W / 2, v = py - H / 2;
      // Solve project() backwards for the constant-height (y=y0) plane the star rests on.
      const s = (fov - (cpit * v) / spit) / (y0 / spit + camDist);
      const z1 = (v + y0 * cpit * s) / (spit * s);
      const x1 = u / s;
      const x = Math.max(-110, Math.min(110, x1 * cyaw + z1 * syaw));
      const z = Math.max(-110, Math.min(110, -x1 * syaw + z1 * cyaw));
      centerRef.current = { x, z };
      setCenter({ x, z });
    },
    up: () => { massDrag.current = false; },
  });

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, W, H);
    const onDown = (e: PointerEvent) => { if (massDrag.current) return; drag.current = { x: e.clientX, y: e.clientY }; };
    const onMove = (e: PointerEvent) => { if (!drag.current || massDrag.current) return; cam.current.yaw += (e.clientX - drag.current.x) * 0.01; cam.current.pitch = Math.max(-1.3, Math.min(-0.1, cam.current.pitch + (e.clientY - drag.current.y) * 0.01)); drag.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => (drag.current = null);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
    const depth = (r: number) => -mass * 120 / (r + 18);
    const loop = () => {
      const c = cam.current, cc = centerRef.current;
      // orbit body under 1/r^2 in the plane, about the (draggable) central mass
      const b = body.current; const dx = b.x - cc.x, dz = b.z - cc.z; const r = Math.hypot(dx, dz) || 1; const f = -mass * 0.9 / (r * r * r);
      b.vx += f * dx; b.vz += f * dz; b.x += b.vx; b.z += b.vz;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const G = 26, span = 260, sc = 1;
      const pr = (x: number, z: number) => project({ x: x * sc, y: depth(Math.hypot(x - cc.x, z - cc.z)), z: z * sc }, c.yaw, c.pitch, 620, W, H);
      ctx.lineWidth = 1;
      for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) {
        const x = -span / 2 + (span * i) / G, z = -span / 2 + (span * j) / G;
        const p = pr(x, z); const t = Math.min(1, -depth(Math.hypot(x - cc.x, z - cc.z)) / (mass * 6));
        ctx.strokeStyle = `hsla(${210 - t * 60},70%,${30 + t * 30}%,0.6)`;
        if (i < G) { const q = pr(x + span / G, z); ctx.beginPath(); ctx.moveTo(p.sx2, p.sy2); ctx.lineTo(q.sx2, q.sy2); ctx.stroke(); }
        if (j < G) { const q = pr(x, z + span / G); ctx.beginPath(); ctx.moveTo(p.sx2, p.sy2); ctx.lineTo(q.sx2, q.sy2); ctx.stroke(); }
      }
      const bp = pr(b.x, b.z); ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(bp.sx2, bp.sy2, 6, 0, 7); ctx.fill();
      const cp = pr(cc.x, cc.z); ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(cp.sx2, cp.sy2, 8, 0, 7); ctx.fill();
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("drag the star to move the mass · drag empty space to orbit the view", 12, 22);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [mass]);

  const explain =
    mass < 40
      ? `A light central mass (${mass}) makes a shallow well — spacetime is only gently curved, so an orbiting body barely deflects and can easily coast off toward infinity.`
      : mass > 90
      ? `A heavy central mass (${mass}) digs a deep, steep well — the same sideways velocity now whips into a tight, fast orbit, the way strong gravity bends nearby trajectories sharply.`
      : `At mass ${mass} the well is moderately curved; the body traces a near-stable ellipse because its sideways motion balances the inward pull (∝ M/r²).`;

  const code = `import numpy as np
mass = ${mass}
x, z, vx, vz = 90.0, 0.0, 0.0, 1.4
for _ in range(2000):
    r = np.hypot(x, z) or 1.0
    f = -mass * 0.9 / r**3
    vx += f * x; vz += f * z
    x += vx; z += vz
print("final position", x, z)`;

  return (
    <StudioChrome title="Gravity Well Studio" tagline="curved spacetime · rubber-sheet analogy"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">The classic rubber-sheet picture of gravity: mass warps the grid, and a body orbits in the curved surface. Drag the star to move the mass and reshape the well; drag empty space to orbit the view.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Central mass" value={mass} min={20} max={120} step={5} onChange={(v) => update({ mass: v })} />
        <button onClick={() => (body.current = { x: 90, z: 0, vx: 0, vz: 1.4 })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset orbit</button>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Central mass" value={String(mass)} /><Stat label="Well depth" value="∝ M/r" /><Stat label="View" value="3D orbit" /><Equation tex={`\\Phi = -\\frac{GM}{r} = -\\frac{${mass}\\,G}{r}, \\quad F = \\frac{GMm}{r^2}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" /></StudioChrome>
  );
}
