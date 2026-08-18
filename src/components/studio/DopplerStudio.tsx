"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 420;

// wave speed used by the animation (sim units) — reused as the sound speed c for the physics
const C = 2.2;

const PRESETS: Record<string, { speed: number; freq: number }> = {
  "Ambulance approaching": { speed: 1.5, freq: 700 },
  "Train receding": { speed: 1.2, freq: 380 },
  "Fast jet": { speed: 3.0, freq: 500 },
  "Source at rest": { speed: 0.3, freq: 440 },
};

export function DopplerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [{ speed, freq }, update] = useShareableNumbers({ speed: 1.5, freq: 440 });
  const src = useRef({ x: 120, dir: 1 });
  const waves = useRef<{ x: number; y: number; r: number }[]>([]);
  const t = useRef(0);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H); const cy = H / 2;
    const loop = () => {
      if (running) {
        src.current.x += speed * src.current.dir; if (src.current.x > W - 60) src.current.dir = -1; if (src.current.x < 60) src.current.dir = 1;
        if (t.current % 8 === 0) waves.current.push({ x: src.current.x, y: cy, r: 0 });
        t.current++;
        for (const w of waves.current) w.r += 2.2;
        waves.current = waves.current.filter((w) => w.r < W);
      }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(34,211,238,0.55)"; ctx.lineWidth = 1.2;
      for (const w of waves.current) { ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, 7); ctx.stroke(); }
      ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(src.current.x, cy, 8, 0, 7); ctx.fill();
      const mach = speed / 2.2;
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui";
      ctx.fillText(src.current.dir > 0 ? "→ moving right: waves bunch ahead (higher pitch)" : "← moving left", 14, 24);
      ctx.fillText(mach >= 1 ? "supersonic — shock cone forms" : `Mach ${mach.toFixed(2)}`, 14, H - 14);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, speed]);

  const mach = speed / C;
  const fUp = (freq * C) / (C - speed);
  const fDown = (freq * C) / (C + speed);

  const explain =
    mach >= 1
      ? `Supersonic (Mach ${mach.toFixed(2)}): the source outruns its own sound, so the wavefronts pile up into a Mach cone and arrive together as a shock — a sonic boom rather than a smooth pitch change.`
      : mach > 0.85
      ? `Near the sound speed (Mach ${mach.toFixed(2)}): approaching, the ${freq} Hz tone rises steeply to about ${fUp.toFixed(0)} Hz as the wavefronts bunch tightly toward a forming shock; receding, it falls to about ${fDown.toFixed(0)} Hz.`
      : `Approaching, the ${freq} Hz source is heard higher — about ${fUp.toFixed(0)} Hz; receding, it drops to about ${fDown.toFixed(0)} Hz. The faster the source (Mach ${mach.toFixed(2)}), the wider that split.`;

  const code = `# Doppler shift: observed frequency f' = f * c / (c -/+ v_s)
f = ${freq}       # source frequency (Hz)
c = ${C}       # wave speed (sim units)
v_s = ${speed}     # source speed (sim units)
if v_s < c:
    print("approaching", f * c / (c - v_s))   # toward you -> higher pitch
else:
    print("supersonic: wavefronts pile into a Mach cone (shock)")
print("receding", f * c / (c + v_s))          # away from you -> lower pitch`;

  return (
    <StudioChrome title="Doppler Effect" tagline="moving source · wavefront compression"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button></div>
        <p className="mb-3 text-xs text-slate-500">A moving source squeezes its wavefronts ahead and stretches them behind — higher pitch approaching, lower pitch receding. Push past the wave speed for a sonic boom.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Source speed" value={speed} min={0.3} max={3.5} step={0.1} onChange={(v) => update({ speed: v })} />
        <Slider label="Source frequency (Hz)" value={freq} min={50} max={2000} step={10} onChange={(v) => update({ freq: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Mach number" value={mach.toFixed(2)} />
        <Stat label="Regime" value={mach >= 1 ? "supersonic" : "subsonic"} />
        <Stat label="Source freq" value={`${freq} Hz`} />
        <Stat label="Approaching f'" value={mach >= 1 ? "shock (boom)" : `${fUp.toFixed(0)} Hz`} />
        <Stat label="Receding f'" value={`${fDown.toFixed(0)} Hz`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
