"use client";

import { useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers, useCanvasDrag } from "@/lib/studioKit";

// Canvas layout: launch point, velocity-vector scale, and the left-edge spin rail.
const W = 540, H = 320, LAUNCH_X = 30, LAUNCH_Y = 160, VSCALE = 3, SPIN_X = 14, SPIN_TOP = 44, SPIN_BOT = 296;

const PRESETS: Record<string, { spin: number; speed: number }> = {
  "Free-kick curl": { spin: 40, speed: 30 },
  "Curveball break": { spin: -50, speed: 42 },
  "Golf hook": { spin: 34, speed: 45 },
  "Knuckleball (no spin)": { spin: 0, speed: 22 },
};

// Magnus effect: a spinning ball curves.
export function MagnusStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ spin, speed, angle }, update] = useShareableNumbers({ spin: 30, speed: 25, angle: 0 }); // spin rev/s (sign = direction), speed m/s, launch angle deg
  const spinRef = useRef(spin); spinRef.current = spin;
  const speedRef = useRef(speed); speedRef.current = speed;
  const angleRef = useRef(angle); angleRef.current = angle;

  const frame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#0b2818"; ctx.fillRect(0, 0, W, H);
    // pitch lines
    ctx.strokeStyle = "#1a4a2e"; for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    // launch velocity sets initial vx, vy (screen y up = negative); Magnus curves it laterally
    const angRad = (angleRef.current * Math.PI) / 180; const sp = speedRef.current;
    let x = LAUNCH_X, y = LAUNCH_Y, vy = -sp * Math.sin(angRad); const vx = sp * Math.cos(angRad);
    const dt = 0.02; const magnus = spinRef.current * 0.02;
    const trail: [number, number][] = [];
    for (let t = 0; t < 200; t++) { const ay = magnus * vx; vy += ay * dt; x += vx * dt * 8; y += vy * dt * 8; if (x > W - 20 || x < 4 || y < 10 || y > H - 10) break; trail.push([x, y]); }
    // straight (no-spin) reference along the launch direction
    ctx.strokeStyle = "#475569"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(LAUNCH_X, LAUNCH_Y); ctx.lineTo(LAUNCH_X + Math.cos(angRad) * W, LAUNCH_Y - Math.sin(angRad) * W); ctx.stroke(); ctx.setLineDash([]);
    // curved Magnus trajectory
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; ctx.beginPath();
    trail.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    // ball
    if (trail.length) { const [bx, by] = trail[trail.length - 1]; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bx, by, 8, 0, 7); ctx.fill(); }
    // draggable launch-velocity vector (drag its tip to set speed + angle)
    const velTipX = LAUNCH_X + Math.cos(angRad) * sp * VSCALE, velTipY = LAUNCH_Y - Math.sin(angRad) * sp * VSCALE;
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(LAUNCH_X, LAUNCH_Y); ctx.lineTo(velTipX, velTipY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(velTipX, velTipY, 6, 0, 7); ctx.fill();
    ctx.font = "10px sans-serif"; ctx.fillText("drag to aim", velTipX + 9, velTipY + 3);
    // draggable spin knob on the left rail (drag up = topspin, down = backspin)
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(SPIN_X, SPIN_TOP); ctx.lineTo(SPIN_X, SPIN_BOT); ctx.stroke();
    const knobY = SPIN_TOP + ((60 - spinRef.current) / 120) * (SPIN_BOT - SPIN_TOP);
    ctx.fillStyle = spinRef.current === 0 ? "#94a3b8" : spinRef.current > 0 ? "#22d3ee" : "#fb7185";
    ctx.beginPath(); ctx.arc(SPIN_X, knobY, 7, 0, 7); ctx.fill();
    ctx.fillStyle = "#a3e635"; ctx.font = "9px sans-serif"; ctx.fillText("spin", SPIN_X - 6, SPIN_TOP - 6);
    // hint
    ctx.fillStyle = "#a3e635"; ctx.font = "11px sans-serif"; ctx.fillText(`${spinRef.current > 0 ? "topspin/curve" : spinRef.current < 0 ? "backspin/curve" : "no spin"} — dashed = no-spin path · drag ● to aim, knob to spin`, 40, 20);
  };

  const tr = useTransport(frame);

  // Direct-canvas drag: aim the launch-velocity vector, or slide the spin knob — trajectory redraws live.
  const dragMode = useRef<"vel" | "spin" | null>(null);
  useCanvasDrag(canvasRef, W, H, {
    pick: (x, y) => {
      if (x <= 26 && y >= SPIN_TOP - 12 && y <= SPIN_BOT + 12) { dragMode.current = "spin"; return true; }
      if (x >= 30) { dragMode.current = "vel"; return true; }
      return false;
    },
    move: (x, y) => {
      if (dragMode.current === "spin") {
        const t = Math.max(0, Math.min(1, (y - SPIN_TOP) / (SPIN_BOT - SPIN_TOP)));
        const sVal = Math.max(-60, Math.min(60, Math.round((60 - t * 120) / 2) * 2));
        spinRef.current = sVal; update({ spin: sVal });
      } else {
        const dx = x - LAUNCH_X, dy = LAUNCH_Y - y;
        const sp = Math.max(10, Math.min(45, Math.round(Math.hypot(dx, dy) / VSCALE)));
        const ang = Math.max(-60, Math.min(60, Math.round((Math.atan2(dy, Math.max(1, dx)) * 180) / Math.PI)));
        speedRef.current = sp; angleRef.current = ang; update({ speed: sp, angle: ang });
      }
      frame(); // redraw immediately so dragging responds even while paused
    },
    up: () => { dragMode.current = null; },
  });

  const explain =
    spin === 0
      ? "With zero spin there is no Magnus force — the ball tracks the straight dashed reference and any late wobble is aerodynamic, not lift."
      : `Deflection scales with spin times forward speed, so this ${Math.abs(spin)} rev/s at ${speed} m/s ${Math.abs(spin) * speed > 1200 ? "produces a sharp, late-breaking curve" : "produces a gentle, gradual curve"} ${spin > 0 ? "down/right" : "up/left"}.`;

  const code = `import math
spin, speed, angle = ${spin}, ${speed}, ${angle}   # rev/s, m/s, deg
dt = 0.02
a = math.radians(angle)
vx, vy = speed * math.cos(a), -speed * math.sin(a)
magnus, y = spin * 0.02, 0.0
for _ in range(200):
    vy += magnus * vx * dt
    y += vy * dt * 8
print("lateral deflection (px):", round(y, 1))`;

  return (
    <StudioChrome title="Magnus Effect (Ball Spin)" tagline="the curve of a free kick"
      controls={<div>
        <TransportBar playing={tr.playing} onToggle={tr.toggle} onStep={tr.step} onReset={() => update({ spin: 30, speed: 25, angle: 0 })} speed={tr.speed} onSpeed={tr.setSpeed} />
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <p className="mb-2 text-xs text-slate-500">Drag the green vector on the pitch to aim the launch (speed + angle), or slide the spin knob on the left rail — the curved trajectory updates live.</p>
        <Slider label="Spin (rev/s)" value={spin} min={-60} max={60} step={2} onChange={(v) => update({ spin: v })} />
        <Slider label="Ball speed (m/s)" value={speed} min={10} max={45} step={1} onChange={(v) => update({ speed: v })} />
        <Slider label="Launch angle (°)" value={angle} min={-60} max={60} step={1} onChange={(v) => update({ angle: v })} />
        <p className="mt-3 text-xs text-slate-500">A spinning ball drags air around with it, moving faster on one side and slower on the other. The pressure difference pushes the ball sideways — the Magnus force — bending its flight. It is what curves a free kick around a wall, hooks a golf drive, and makes a curveball break. More spin means a sharper curve.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Spin" value={`${Math.abs(spin)} rev/s`} /><Stat label="Direction" value={spin > 0 ? "curves down/right" : spin < 0 ? "curves up/left" : "straight"} /><Stat label="Speed" value={`${speed} m/s`} /><Stat label="Launch angle" value={`${angle}°`} /><Equation tex={`F_M = \\tfrac{1}{2}\\rho\\,C_L A v^2 \\;\\propto\\; \\omega\\,v = ${Math.abs(spin)}\\times${speed} = ${Math.abs(spin) * speed}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
