"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { useShareableNumbers } from "@/lib/studioKit";

// 2D Ising model — Metropolis Monte Carlo. Tune temperature through the
// critical point (~2.27 J/k_B) to watch spontaneous magnetization vanish.
const N = 150;
const TC = 2.27;

const PRESETS: Record<string, { temp: number }> = {
  "Cold (ordered)": { temp: 1.0 },
  "Just below Tc": { temp: 2.2 },
  "Near Tc": { temp: 2.27 },
  "Hot (disordered)": { temp: 3.5 },
};

export function IsingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spins = useRef<Int8Array>(new Int8Array(N * N));
  const [{ temp }, update] = useShareableNumbers({ temp: 2.2 });
  const tempRef = useRef(temp); tempRef.current = temp;
  const [mag, setMag] = useState(0);
  const magTick = useRef(0);

  const reset = () => { for (let i = 0; i < N * N; i++) spins.current[i] = Math.random() < 0.5 ? 1 : -1; };
  useEffect(() => { reset(); }, []);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(N, N);
    const s = spins.current;
    const beta = 1 / Math.max(0.05, tempRef.current);
    for (let k = 0; k < N * N * steps; k++) {
      const x = (Math.random() * N) | 0, y = (Math.random() * N) | 0, i = y * N + x;
      const nb = s[((y - 1 + N) % N) * N + x] + s[((y + 1) % N) * N + x] + s[y * N + (x - 1 + N) % N] + s[y * N + (x + 1) % N];
      const dE = 2 * s[i] * nb;
      if (dE <= 0 || Math.random() < Math.exp(-beta * dE)) s[i] = -s[i] as -1 | 1;
    }
    let m = 0;
    for (let i = 0; i < N * N; i++) { const up = s[i] > 0; m += s[i]; const c = up ? 210 : 40; img.data[i * 4] = up ? 34 : 15; img.data[i * 4 + 1] = up ? 211 : 23; img.data[i * 4 + 2] = c; img.data[i * 4 + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    if (magTick.current++ % 10 === 0) setMag(Math.abs(m) / (N * N));
  };

  const t = useTransport(frame);

  const explain =
    temp < TC - 0.35
      ? `Well below T_c (${TC}): the Metropolis rule rejects most spin flips, so spins lock into large aligned domains. This is spontaneous magnetization — order emerges with no external field.`
      : temp > TC + 0.35
      ? `Well above T_c (${TC}): thermal noise overwhelms the neighbor coupling. Spins flip freely, domains dissolve into salt-and-pepper, and the net magnetization averages to zero.`
      : `Right at the critical point (T_c ≈ ${TC}): order and disorder are in balance. Correlated clusters appear at every length scale — the hallmark critical fluctuations of a second-order phase transition.`;

  const code = `import numpy as np
N, T, sweeps = ${N}, ${temp}, 200
beta = 1.0 / max(0.05, T)
s = np.random.choice([-1, 1], size=(N, N)).astype(np.int8)
for _ in range(sweeps):                     # Metropolis Monte Carlo
    for _ in range(N * N):
        x, y = np.random.randint(N), np.random.randint(N)
        nb = s[(y-1)%N, x] + s[(y+1)%N, x] + s[y, (x-1)%N] + s[y, (x+1)%N]
        dE = 2 * s[y, x] * nb
        if dE <= 0 or np.random.rand() < np.exp(-beta * dE):
            s[y, x] = -s[y, x]
print("magnetization", abs(s.sum()) / (N * N))`;

  return (
    <StudioChrome title="Ising Model Studio" tagline="statistical mechanics · Metropolis Monte Carlo"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">Below the critical temperature (~2.27) domains align; above it, thermal noise wins. A live phase transition.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Temperature (J/k_B)" value={temp} min={0.5} max={4} step={0.05} onChange={(v) => update({ temp: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Lattice" value={`${N}×${N}`} /><Stat label="Magnetization" value={mag.toFixed(3)} /><Stat label="T_critical" value="≈ 2.27" /><Stat label="Phase" value={temp < TC ? "ordered" : "disordered"} /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} />
    </StudioChrome>
  );
}
