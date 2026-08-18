"use client";

import { useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 640, H = 480;

const PRESETS: Record<string, { r1: number; r2: number }> = {
  "LEO → GEO": { r1: 70, r2: 220 },
  "Low → high": { r1: 80, r2: 200 },
  "Small raise": { r1: 130, r2: 150 },
  "Large transfer": { r1: 60, r2: 230 },
};

export function OrbitalTransferStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ r1, r2 }, update] = useShareableNumbers({ r1: 90, r2: 200 });
  const r1Ref = useRef(r1); r1Ref.current = r1;
  const r2Ref = useRef(r2); r2Ref.current = r2;
  const t = useRef(0);

  const { dv1, dv2, total, tof } = useMemo(() => {
    const mu = 8000; const a = (r1 + r2) / 2;
    const v1 = Math.sqrt(mu / r1), v2 = Math.sqrt(mu / r2);
    const vp = Math.sqrt(mu * (2 / r1 - 1 / a)), va = Math.sqrt(mu * (2 / r2 - 1 / a));
    return { dv1: Math.abs(vp - v1), dv2: Math.abs(v2 - va), total: Math.abs(vp - v1) + Math.abs(v2 - va), tof: Math.PI * Math.sqrt((a * a * a) / mu) };
  }, [r1, r2]);

  const ratio = r2 / r1;
  const explain =
    ratio > 2.6
      ? `A big radius ratio (${r1} → ${r2}, ~${ratio.toFixed(1)}×): the first burn (${dv1.toFixed(2)}) kicks the craft onto a long transfer ellipse and the second (${dv2.toFixed(2)}) circularizes it — high total Δv (${total.toFixed(2)}) and a long half-ellipse coast (${tof.toFixed(1)}).`
      : ratio < 1.35
      ? `A modest raise (${r1} → ${r2}, ~${ratio.toFixed(1)}×): two small burns (${dv1.toFixed(2)} then ${dv2.toFixed(2)}) nudge the orbit up. Small ratio means little total Δv (${total.toFixed(2)}) and a short coast (${tof.toFixed(1)}).`
      : `A moderate transfer (${r1} → ${r2}, ~${ratio.toFixed(1)}×): burn 1 (${dv1.toFixed(2)}) enters the ellipse, burn 2 (${dv2.toFixed(2)}) circularizes. Bigger ratios cost more total Δv (${total.toFixed(2)}) and coast longer (${tof.toFixed(1)}).`;

  const code = `import numpy as np
mu = 8000.0
r1, r2 = ${r1}, ${r2}
a = (r1 + r2) / 2
v1, v2 = np.sqrt(mu/r1), np.sqrt(mu/r2)
vp = np.sqrt(mu*(2/r1 - 1/a))   # transfer-ellipse speed at r1
va = np.sqrt(mu*(2/r2 - 1/a))   # transfer-ellipse speed at r2
dv1 = abs(vp - v1)              # burn 1: enter transfer ellipse
dv2 = abs(v2 - va)              # burn 2: circularize at r2
tof = np.pi * np.sqrt(a**3 / mu)  # half-ellipse coast time
print("dv1", dv1, "dv2", dv2, "total", dv1 + dv2, "tof", tof)`;

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H); const cx = W / 2, cy = H / 2;
    const r1 = r1Ref.current, r2 = r2Ref.current;
    t.current += 0.01 * steps;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(56,189,248,0.6)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r1, 0, 7); ctx.stroke();
    ctx.strokeStyle = "rgba(163,230,53,0.6)"; ctx.beginPath(); ctx.arc(cx, cy, r2, 0, 7); ctx.stroke();
    const a = (r1 + r2) / 2, b = Math.sqrt(r1 * r2), ec = cx - (a - r1);
    ctx.strokeStyle = "rgba(244,114,182,0.85)"; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(ec, cy, a, b, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    const ang = t.current; const sx = cx + Math.cos(ang) * r1, sy = cy + Math.sin(ang) * r1; ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText("Hohmann transfer ellipse (pink) between two circular orbits", 12, 22);
  };

  const tr = useTransport(frame);

  return (
    <StudioChrome title="Orbital Transfer (Hohmann)" tagline="minimum-energy orbit change"
      controls={<div>
        <TransportBar playing={tr.playing} onToggle={tr.toggle} onStep={tr.step} speed={tr.speed} onSpeed={tr.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">The Hohmann transfer is the fuel-cheapest way between two circular orbits: one burn to enter the transfer ellipse, one to circularize. See the two Δv costs.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Inner orbit radius" value={r1} min={60} max={160} step={10} onChange={(v) => update({ r1: v })} />
        <Slider label="Outer orbit radius" value={r2} min={120} max={230} step={10} onChange={(v) => update({ r2: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Δv burn 1" value={dv1.toFixed(2)} /><Stat label="Δv burn 2" value={dv2.toFixed(2)} /><Stat label="Total Δv" value={total.toFixed(2)} /><Stat label="Transfer time" value={tof.toFixed(1)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}
