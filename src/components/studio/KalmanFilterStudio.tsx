"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { measNoise: number; procNoise: number }> = {
  "Clean sensor": { measNoise: 8, procNoise: 1 },
  "Noisy sensor": { measNoise: 55, procNoise: 1 },
  "Erratic target": { measNoise: 30, procNoise: 5 },
  "Balanced": { measNoise: 30, procNoise: 1 },
};

// 1D Kalman filter tracking a moving object from noisy measurements.
export function KalmanFilterStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ measNoise, procNoise }, update] = useShareableNumbers({ measNoise: 30, procNoise: 1 });
  const [seed, setSeed] = useState(1);
  const [rmse, setRmse] = useState({ meas: 0, kf: 0 });

  useEffect(() => {
    let s = seed * 5779 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const N = 200; const R = measNoise * measNoise, Q = procNoise * procNoise;
    let xt = 60; let vt = 1.2; // true state
    let xh = 60, P = 100; // KF estimate + covariance
    const trueA: number[] = [], measA: number[] = [], kfA: number[] = []; let seM = 0, seK = 0;
    for (let k = 0; k < N; k++) {
      vt += gauss() * 0.04; xt += vt + gauss() * procNoise; if (xt < 20 || xt > 240) vt = -vt;
      const z = xt + gauss() * measNoise;
      // predict
      P += Q;
      // update
      const K = P / (P + R); xh = xh + K * (z - xh); P = (1 - K) * P;
      trueA.push(xt); measA.push(z); kfA.push(xh); seM += (z - xt) ** 2; seK += (xh - xt) ** 2;
    }
    setRmse({ meas: Math.sqrt(seM / N), kf: Math.sqrt(seK / N) });
    const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const X = (i: number) => 20 + (i / N) * (W - 40); const Y = (v: number) => H - 20 - (v / 260) * (H - 40);
    ctx.fillStyle = "#64748b"; measA.forEach((v, i) => { ctx.beginPath(); ctx.arc(X(i), Y(v), 1.6, 0, 7); ctx.fill(); });
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath(); trueA.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); kfA.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); ctx.stroke();
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#94a3b8"; ctx.fillText("measurements", 24, 16); ctx.fillStyle = "#a3e635"; ctx.fillText("true", 120, 16); ctx.fillStyle = "#22d3ee"; ctx.fillText("Kalman estimate", 160, 16);
  }, [measNoise, procNoise, seed]);

  const ratio = measNoise / procNoise;
  const explain = ratio > 20
    ? `Measurement noise dwarfs process noise, so the Kalman gain stays small — the filter leans on its motion model and smooths the jitter hard.`
    : ratio < 8
    ? `Process noise rivals the sensor noise, so the gain stays high — the filter trusts each measurement, tracking fast but staying a little jumpy.`
    : `Balanced noise: the gain settles mid-range, blending model and measurement so the estimate is both smooth and responsive.`;

  const code = `import numpy as np
meas_noise, proc_noise = ${measNoise}, ${procNoise}
R, Q = meas_noise**2, proc_noise**2
xh, P = 60.0, 100.0
for z in measurements:      # your noisy sensor stream
    P += Q                  # predict: uncertainty grows
    K = P / (P + R)         # Kalman gain
    xh += K * (z - xh)      # update toward the measurement
    P = (1 - K) * P         # uncertainty shrinks
print("estimate:", xh, " gain:", K)`;

  return (
    <StudioChrome title="Kalman Filter" tagline="optimal state estimation"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Measurement noise" value={measNoise} min={5} max={60} step={1} onChange={(v) => update({ measNoise: v })} />
        <Slider label="Process noise" value={procNoise} min={0.2} max={6} step={0.2} onChange={(v) => update({ procNoise: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New run</button>
        <p className="mt-3 text-xs text-slate-500">The Kalman filter fuses a motion model with noisy measurements to track a hidden state optimally. Each step it predicts, then corrects using the Kalman gain — trusting the measurement more when the model is uncertain, and vice versa. It smooths the jittery sensor (gray) into a clean estimate (cyan) that hugs the truth. The math behind GPS, radar, and spacecraft navigation.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Measurement RMSE" value={rmse.meas.toFixed(1)} /><Stat label="Kalman RMSE" value={rmse.kf.toFixed(1)} /><Stat label="Noise reduction" value={`${(100 * (1 - rmse.kf / rmse.meas)).toFixed(0)}%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
