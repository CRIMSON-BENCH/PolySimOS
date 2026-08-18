"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const N = 160;

// Known Gray-Scott regimes (feed F, kill k). Each pair reliably settles into its named pattern.
const PRESETS: Record<string, { feed: number; kill: number }> = {
  "Spots": { feed: 0.03, kill: 0.062 },
  "Stripes": { feed: 0.022, kill: 0.051 },
  "Maze/coral": { feed: 0.0545, kill: 0.062 },
  "Mitosis": { feed: 0.0367, kill: 0.0649 },
};

export function ReactionDiffusionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ feed, kill }, update] = useShareableNumbers({ feed: 0.0545, kill: 0.062 });
  const feedRef = useRef(feed); feedRef.current = feed;
  const killRef = useRef(kill); killRef.current = kill;
  const [seed, setSeed] = useState(1);
  const [iter, setIter] = useState(0);
  const aRef = useRef<Float32Array>(new Float32Array(N * N).fill(1));
  const bRef = useRef<Float32Array>(new Float32Array(N * N));
  const countRef = useRef(0);

  // Reseed the field whenever feed, kill, or the manual seed changes (matches the original restart-on-change behavior).
  useEffect(() => {
    const a = new Float32Array(N * N).fill(1); const b = new Float32Array(N * N);
    let s = seed * 7 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let k = 0; k < 12; k++) { const cx = (rnd() * N) | 0, cy = (rnd() * N) | 0; for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) { const nx = cx + x, ny = cy + y; if (nx >= 0 && ny >= 0 && nx < N && ny < N) b[ny * N + nx] = 1; } }
    aRef.current = a; bRef.current = b; countRef.current = 0; setIter(0);
  }, [feed, kill, seed]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(N, N);
    let a = aRef.current, b = bRef.current;
    const Da = 1.0, Db = 0.5; const f = feedRef.current, kk = killRef.current;
    for (let step = 0; step < 10 * steps; step++) {
      const na = new Float32Array(N * N), nb = new Float32Array(N * N);
      for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const i = y * N + x;
        const lapA = a[i - 1] + a[i + 1] + a[i - N] + a[i + N] - 4 * a[i];
        const lapB = b[i - 1] + b[i + 1] + b[i - N] + b[i + N] - 4 * b[i];
        const abb = a[i] * b[i] * b[i];
        na[i] = a[i] + (Da * lapA - abb + f * (1 - a[i]));
        nb[i] = b[i] + (Db * lapB + abb - (kk + f) * b[i]);
      }
      a = na; b = nb; countRef.current++;
    }
    aRef.current = a; bRef.current = b;
    for (let i = 0; i < N * N; i++) { const v = Math.max(0, Math.min(1, a[i] - b[i])); const idx = i * 4;
      img.data[idx] = 20 + v * 60; img.data[idx + 1] = 40 + (1 - v) * 180; img.data[idx + 2] = 60 + (1 - v) * 160; img.data[idx + 3] = 255; }
    ctx.putImageData(img, 0, 0); setIter(countRef.current);
  };

  const t = useTransport(frame);

  const explain =
    feed < 0.02
      ? `Low feed (F=${feed}): the substrate is barely replenished, so structures thin out into stripes and drifting waves instead of filling in.`
      : kill > 0.063
      ? `High kill (k=${kill}): the activator is removed quickly, favoring isolated spots that keep splitting like dividing cells (mitosis).`
      : feed > 0.05
      ? `High feed (F=${feed}): abundant substrate lets spots grow and merge into branching maze and coral networks.`
      : `Balanced feed/kill (F=${feed}, k=${kill}): the uniform state is Turing-unstable, so diffusion amplifies tiny fluctuations into steady spot patterns. Push F down or k up and the same balance tips toward stripes or dissolves the structure entirely.`;

  const code = `import numpy as np
N = ${N}
F, k = ${feed}, ${kill}          # feed, kill rates
Du, Dv = 1.0, 0.5                # diffusion rates
U = np.ones((N, N)); V = np.zeros((N, N))
V[N//2-10:N//2+10, N//2-10:N//2+10] = 1.0   # seed a square of V

def lap(Z):
    return (np.roll(Z, 1, 0) + np.roll(Z, -1, 0) +
            np.roll(Z, 1, 1) + np.roll(Z, -1, 1) - 4 * Z)

for _ in range(5000):
    uvv = U * V * V
    U += Du * lap(U) - uvv + F * (1 - U)
    V += Dv * lap(V) + uvv - (k + F) * V

print("U range", U.min(), U.max())`;

  return (
    <StudioChrome title="Reaction-Diffusion (Gray-Scott)" tagline="Turing patterns from chemistry"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Feed rate F" value={feed} min={0.01} max={0.09} step={0.001} onChange={(v) => update({ feed: v })} />
        <Slider label="Kill rate k" value={kill} min={0.03} max={0.07} step={0.001} onChange={(v) => update({ kill: v })} />
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { setSeed((n) => n + 1); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mt-3 text-xs text-slate-500">Two chemicals diffuse and react by the Gray-Scott equations. Different feed and kill rates spontaneously form spots, stripes, and mazes — the mechanism Alan Turing proposed for animal coat patterns.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Feed F" value={feed.toFixed(4)} />
        <Stat label="Kill k" value={kill.toFixed(4)} />
        <Stat label="Steps" value={String(iter)} />
        <Equation tex={`\\frac{\\partial u}{\\partial t}=D_u\\nabla^2 u-uv^2+F(1-u),\\;\\frac{\\partial v}{\\partial t}=D_v\\nabla^2 v+uv^2-(F+k)v\\;\\;(F=${feed.toFixed(4)},\\,k=${kill.toFixed(4)})`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-w-full rounded-lg" style={{ imageRendering: "pixelated", width: 480, height: 480 }} /></StudioChrome>
  );
}
