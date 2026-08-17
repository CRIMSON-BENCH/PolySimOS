"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";

const W = 560, H = 480;
type C = [number, number];
const cmul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cadd = (a: C, b: C): C => [a[0] + b[0], a[1] + b[1]];
const cdiv = (a: C, b: C): C => { const d = b[0] * b[0] + b[1] * b[1] || 1e-9; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cexp = (a: C): C => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
const csin = (a: C): C => [Math.sin(a[0]) * Math.cosh(a[1]), Math.cos(a[0]) * Math.sinh(a[1])];

const FUNCS: Record<string, (z: C) => C> = {
  "z^2": (z) => cmul(z, z),
  "z^3 - 1": (z) => cadd(cmul(cmul(z, z), z), [-1, 0]),
  "1/z": (z) => cdiv([1, 0], z),
  "(z^2-1)/(z^2+1)": (z) => cdiv(cadd(cmul(z, z), [-1, 0]), cadd(cmul(z, z), [1, 0])),
  "sin(z)": (z) => csin(z),
  "exp(z)": (z) => cexp(z),
  "z + 1/z": (z) => cadd(z, cdiv([1, 0], z)),
};

export function ComplexStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fn, setFn] = useState("z^2");

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const img = ctx.createImageData(W, H); const f = FUNCS[fn];
    const span = 4;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const zr = (px / W - 0.5) * span * 2, zi = (0.5 - py / H) * span * 2 * (H / W);
      const w = f([zr, zi]); const arg = Math.atan2(w[1], w[0]); const mag = Math.hypot(w[0], w[1]);
      const hue = ((arg / (2 * Math.PI)) + 1) % 1; const light = 1 - 1 / (1 + mag * 0.6); // brightness by magnitude
      const [r, g, b] = hsl(hue * 360, 0.9, 0.15 + light * 0.6);
      const i = (py * W + px) * 4; img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [fn]);

  return (
    <StudioChrome title="Complex Function Visualizer" tagline="domain coloring · f(z) on the complex plane"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Domain coloring maps each complex output to a color: hue = phase (argument), brightness = magnitude. Zeros are dark, poles are bright.</p>
        <div className="flex flex-wrap gap-1.5">{Object.keys(FUNCS).map((k) => <button key={k} onClick={() => setFn(k)} className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold ${fn === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
      </div>}
      inspector={<div><Stat label="Function" value={fn} /><Stat label="Hue" value="arg f(z)" /><Stat label="Brightness" value="|f(z)|" /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto max-h-[460px] rounded-lg" /></StudioChrome>
  );
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))))); };
  return [f(0), f(8), f(4)];
}
