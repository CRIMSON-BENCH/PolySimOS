"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

const N = 128; // power of two so the radix-2 FFT is exact

// ─── Real radix-2 iterative FFT (Cooley–Tukey), in-place on separate re/im arrays ───
function fft1d(re: Float64Array, im: Float64Array, inverse: boolean) {
  const n = re.length;
  // bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wlenRe = Math.cos(ang), wlenIm = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let wRe = 1, wIm = 0;
      for (let j = 0; j < half; j++) {
        const a = i + j, b = i + j + half;
        const vRe = re[b] * wRe - im[b] * wIm;
        const vIm = re[b] * wIm + im[b] * wRe;
        re[b] = re[a] - vRe; im[b] = im[a] - vIm;
        re[a] += vRe; im[a] += vIm;
        const nwRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nwRe;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

// 2D FFT: transform every row, then every column. Inverse pass divides by N per 1D
// call, i.e. by N² overall — the correct normalization for a 2D IFFT.
function fft2d(re: Float64Array, im: Float64Array, inverse: boolean) {
  const lineRe = new Float64Array(N), lineIm = new Float64Array(N);
  for (let y = 0; y < N; y++) {
    const o = y * N;
    for (let x = 0; x < N; x++) { lineRe[x] = re[o + x]; lineIm[x] = im[o + x]; }
    fft1d(lineRe, lineIm, inverse);
    for (let x = 0; x < N; x++) { re[o + x] = lineRe[x]; im[o + x] = lineIm[x]; }
  }
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) { lineRe[y] = re[y * N + x]; lineIm[y] = im[y * N + x]; }
    fft1d(lineRe, lineIm, inverse);
    for (let y = 0; y < N; y++) { re[y * N + x] = lineRe[y]; im[y * N + x] = lineIm[y]; }
  }
}

// ─── Procedural grayscale test images, values in [0, 1] ───
const IMAGES: Record<string, () => Float64Array> = {
  stripes: () => {
    const d = new Float64Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
      d[y * N + x] = 0.5 + 0.5 * Math.sin((2 * Math.PI * 8 * x) / N);
    return d;
  },
  checkerboard: () => {
    const d = new Float64Array(N * N), s = 16;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
      d[y * N + x] = ((Math.floor(x / s) + Math.floor(y / s)) & 1) ? 0.92 : 0.08;
    return d;
  },
  circle: () => {
    const d = new Float64Array(N * N), r = 34, c = N / 2;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dist = Math.hypot(x - c, y - c);
      d[y * N + x] = 0.5 * (1 - Math.tanh((dist - r) * 0.6)); // soft-edged disk
    }
    return d;
  },
  shapes: () => {
    const d = new Float64Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let v = 0.15 + 0.5 * (x / N); // horizontal gradient background
      if (x > 18 && x < 54 && y > 20 && y < 60) v = 0.95; // bright square
      if (Math.hypot(x - 90, y - 82) < 22) v = 0.05; // dark disk
      d[y * N + x] = Math.max(0, Math.min(1, v));
    }
    return d;
  },
};

const IMAGE_PY: Record<string, string> = {
  stripes: "0.5 + 0.5*np.sin(2*np.pi*8*X/N)",
  checkerboard: "np.where(((X//16 + Y//16) % 2) == 1, 0.92, 0.08)",
  circle: "0.5*(1 - np.tanh((np.hypot(X-N/2, Y-N/2) - 34)*0.6))",
  shapes: "np.clip(0.15 + 0.5*(X/N), 0, 1)  # plus a bright square + dark disk (see docs)",
};

const PRESETS: Record<string, { filter: string; cutoff: number; band: number }> = {
  "Low-pass blur": { filter: "low", cutoff: 14, band: 12 },
  "High-pass edges": { filter: "high", cutoff: 12, band: 12 },
  "Band-pass ring": { filter: "band", cutoff: 28, band: 10 },
};

// Centered frequency coordinate for index i (0..N-1): 0..N/2 stay, the rest wrap negative.
const freqCoord = (i: number) => (i <= N / 2 ? i : i - N);

function drawGray(canvas: HTMLCanvasElement | null, data: Float64Array) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const g = Math.max(0, Math.min(255, Math.round(data[i] * 255)));
    img.data[i * 4] = g; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = g; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function Panel({ title, canvasRef }: { title: string; canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  return (
    <div className="flex flex-col">
      <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <canvas
        ref={canvasRef}
        width={N}
        height={N}
        className="aspect-square w-full rounded-lg border border-slate-800 bg-black"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

export function ImageFFTStudio() {
  const origRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);
  const reconRef = useRef<HTMLCanvasElement>(null);

  const [preset, setPreset] = useState("shapes");
  const [filter, setFilter] = useState("low");
  const [{ cutoff, band }, update] = useShareableNumbers({ cutoff: 18, band: 12 });

  // Forward transform + display spectrum depend only on the source image.
  const forward = useMemo(() => {
    const image = IMAGES[preset]();
    const re = Float64Array.from(image);
    const im = new Float64Array(N * N);
    fft2d(re, im, false);

    // Centered log-magnitude spectrum (fftshift), normalized to [0,1] for display.
    const spec = new Float64Array(N * N);
    let maxLog = 0;
    const logMag = new Float64Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const m = Math.log1p(Math.hypot(re[i], im[i]));
      logMag[i] = m; if (m > maxLog) maxLog = m;
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const sx = (x + N / 2) % N, sy = (y + N / 2) % N;
      spec[sy * N + sx] = logMag[y * N + x] / (maxLog || 1);
    }
    return { image, re, im, spec };
  }, [preset]);

  // Masking + inverse transform depend on the filter controls.
  const result = useMemo(() => {
    const { re, im } = forward;
    const fr = new Float64Array(re), fi = new Float64Array(im);
    let total = 0, kept = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      const r = Math.hypot(freqCoord(x), freqCoord(y));
      let keep: boolean;
      if (filter === "low") keep = r <= cutoff;
      else if (filter === "high") keep = r >= cutoff;
      else keep = Math.abs(r - cutoff) <= band / 2;
      const p = fr[i] * fr[i] + fi[i] * fi[i];
      total += p;
      if (keep) kept += p; else { fr[i] = 0; fi[i] = 0; }
    }
    fft2d(fr, fi, true); // inverse -> reconstructed real image
    // Autoscale real part to [0,1] for display (high/band-pass produce signed values).
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < N * N; i++) { const v = fr[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const recon = new Float64Array(N * N);
    const span = mx - mn || 1;
    for (let i = 0; i < N * N; i++) recon[i] = (fr[i] - mn) / span;
    return { recon, energy: total ? (kept / total) * 100 : 0 };
  }, [forward, filter, cutoff, band]);

  // Render the three panels.
  useEffect(() => { drawGray(origRef.current, forward.image); }, [forward]);
  useEffect(() => { drawGray(reconRef.current, result.recon); }, [result]);
  useEffect(() => {
    drawGray(specRef.current, forward.spec);
    const ctx = specRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1;
    const c = N / 2;
    ctx.beginPath();
    if (filter === "band") {
      ctx.arc(c, c, Math.max(0.5, cutoff - band / 2), 0, 2 * Math.PI);
      ctx.moveTo(c + cutoff + band / 2, c);
      ctx.arc(c, c, cutoff + band / 2, 0, 2 * Math.PI);
    } else {
      ctx.arc(c, c, cutoff, 0, 2 * Math.PI);
    }
    ctx.stroke();
  }, [forward, filter, cutoff, band]);

  const filterName = filter === "low" ? "Low-pass" : filter === "high" ? "High-pass" : "Band-pass";
  const explain =
    filter === "low"
      ? `Low-pass keeps only frequencies inside radius ${cutoff}px of the DC center — the low frequencies that carry the overall shape and smooth tones. Discarding the high frequencies removes fine detail and edges, so the image blurs. ${result.energy.toFixed(1)}% of the spectral energy survives (most energy lives near DC).`
      : filter === "high"
      ? `High-pass removes everything within radius ${cutoff}px of DC — including the DC term (mean brightness) and low frequencies — leaving only high frequencies. Those encode rapid changes, so what remains is edges and fine texture. Only ${result.energy.toFixed(1)}% of the energy is kept, which is why the result is dark with bright outlines.`
      : `Band-pass keeps a ring of radius ${cutoff}±${(band / 2).toFixed(0)}px around DC, isolating a mid-frequency band. It suppresses both the broad smooth structure (inside) and the finest detail (outside), highlighting features at one characteristic scale. ${result.energy.toFixed(1)}% of the energy remains.`;

  const code = `import numpy as np

N = ${N}
x = np.arange(N)
X, Y = np.meshgrid(x, x)
img = ${IMAGE_PY[preset]}

# forward 2D FFT and centered magnitude spectrum
F   = np.fft.fft2(img)
mag = np.log1p(np.abs(np.fft.fftshift(F)))

# frequency radius from the DC term (unshifted layout)
fx = np.fft.fftfreq(N) * N
U, V = np.meshgrid(fx, fx)
R = np.hypot(U, V)

cutoff, band = ${cutoff}, ${band}
${
  filter === "low"
    ? "mask = R <= cutoff"
    : filter === "high"
    ? "mask = R >= cutoff"
    : "mask = np.abs(R - cutoff) <= band / 2"
}

recon  = np.real(np.fft.ifft2(F * mask))     # inverse transform of masked spectrum
energy = 100 * (np.abs(F)[mask]**2).sum() / (np.abs(F)**2).sum()
print("energy kept: %.1f%%" % energy)`;

  return (
    <StudioChrome
      title="Image FFT Studio"
      tagline="2D Fourier transform & frequency filtering"
      controls={
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Image</p>
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {Object.keys(IMAGES).map((k) => (
              <button
                key={k}
                onClick={() => setPreset(k)}
                className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${preset === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}
              >
                {k}
              </button>
            ))}
          </div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Filter</p>
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {[["low", "Low-pass"], ["high", "High-pass"], ["band", "Band-pass"]].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-lg px-2 py-1 text-xs font-semibold ${filter === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Transform an image into its 2D frequency spectrum, mask frequencies by radius, then invert to see the effect. The cyan ring on the spectrum shows the cutoff.
          </p>
          <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => { setFilter(PRESETS[label].filter); update({ cutoff: PRESETS[label].cutoff, band: PRESETS[label].band }); }} />
          <Slider label="Cutoff radius (px)" value={cutoff} min={1} max={64} step={1} onChange={(v) => update({ cutoff: v })} />
          {filter === "band" && (
            <Slider label="Band width (px)" value={band} min={2} max={40} step={1} onChange={(v) => update({ band: v })} />
          )}
          <ShareBar code={code} />
        </div>
      }
      inspector={
        <div>
          <Stat label="Image size" value={`${N} × ${N}`} />
          <Stat label="Filter" value={filterName} />
          <Stat label="Cutoff" value={`${cutoff} px`} />
          {filter === "band" && <Stat label="Band width" value={`${band} px`} />}
          <Stat label="Energy kept" value={`${result.energy.toFixed(1)}%`} />
          <Equation tex={`F(u,v)=\\sum_{x,y} f(x,y)\\,e^{-2\\pi i(ux/M+vy/N)}`} />
          <ExplainResult text={explain} />
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Panel title="Original" canvasRef={origRef} />
        <Panel title="Log-magnitude spectrum" canvasRef={specRef} />
        <Panel title={`${filterName} reconstruction`} canvasRef={reconRef} />
      </div>
    </StudioChrome>
  );
}
