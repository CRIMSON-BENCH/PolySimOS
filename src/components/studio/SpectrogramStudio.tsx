"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, PALETTE } from "@/lib/studioKit";

const W = 760, H = 480;

// Fixed acquisition constants (shared with the exported Python).
const FS = 4000;          // sample rate, Hz  → Nyquist 2000 Hz
const DUR = 1.0;          // seconds
const LEN = Math.round(FS * DUR); // samples

const FFT_SIZES = [64, 128, 256, 512, 1024] as const;
const WINDOWS = ["hann", "hamming", "rect"] as const;
type WinType = (typeof WINDOWS)[number];

// ---- Signal synthesis -----------------------------------------------------
// Deterministic PRNG so noise-bearing presets are reproducible frame to frame.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rnd: () => number) {
  // Box–Muller
  const u = Math.max(1e-12, rnd()), v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const SIGNALS: Record<string, (i: number, rnd: () => number) => number> = {
  Chirp: (i) => {
    const t = i / FS, f0 = 100, f1 = 1800, k = (f1 - f0) / DUR;
    return Math.sin(2 * Math.PI * (f0 * t + 0.5 * k * t * t));
  },
  "Two-tone": (i) => {
    const t = i / FS;
    return 0.7 * Math.sin(2 * Math.PI * 300 * t) + 0.7 * Math.sin(2 * Math.PI * 900 * t);
  },
  "Frequency hops": (i) => {
    const t = i / FS, freqs = [200, 700, 1300, 500];
    const f = freqs[Math.min(freqs.length - 1, Math.floor(t / (DUR / freqs.length)))];
    return Math.sin(2 * Math.PI * f * t);
  },
  "AM signal": (i) => {
    const t = i / FS;
    return (1 + 0.8 * Math.sin(2 * Math.PI * 6 * t)) * Math.sin(2 * Math.PI * 1000 * t);
  },
  "Chirp + noise": (i, rnd) => {
    const t = i / FS, f0 = 100, f1 = 1800, k = (f1 - f0) / DUR;
    return Math.sin(2 * Math.PI * (f0 * t + 0.5 * k * t * t)) + 0.5 * gauss(rnd);
  },
};

// Python that reproduces each preset's samples (used in the exported snippet).
const SIGNAL_PY: Record<string, string> = {
  Chirp: "x = signal.chirp(t, f0=100, f1=1800, t1=1.0, method='linear')",
  "Two-tone": "x = 0.7*np.sin(2*np.pi*300*t) + 0.7*np.sin(2*np.pi*900*t)",
  "Frequency hops":
    "freqs = np.array([200, 700, 1300, 500])\nseg = np.minimum(3, (t / (1.0/4)).astype(int))\nx = np.sin(2*np.pi*freqs[seg]*t)",
  "AM signal": "x = (1 + 0.8*np.sin(2*np.pi*6*t)) * np.sin(2*np.pi*1000*t)",
  "Chirp + noise":
    "x = signal.chirp(t, f0=100, f1=1800, t1=1.0, method='linear')\nx += 0.5*np.random.default_rng(1).standard_normal(t.size)",
};

// ---- Radix-2 iterative FFT (in-place, decimation-in-time) ------------------
function fft(re: Float64Array, im: Float64Array) {
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
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cwr = 1, cwi = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half;
        const tr = re[b] * cwr - im[b] * cwi;
        const ti = re[b] * cwi + im[b] * cwr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const ncwr = cwr * wr - cwi * wi;
        cwi = cwr * wi + cwi * wr;
        cwr = ncwr;
      }
    }
  }
}

function windowCoeffs(n: number, type: WinType): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (type === "rect") w[i] = 1;
    else if (type === "hamming") w[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1));
    else w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)); // hann
  }
  return w;
}

// Viridis-style perceptual colormap (5 anchor stops), t in [0,1].
const VIR = [
  [68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37],
];
function viridis(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  const s = t * 4, i = Math.min(3, Math.floor(s)), f = s - i;
  const a = VIR[i], b = VIR[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

const DB_RANGE = 80; // dynamic range shown below the peak

export function SpectrogramStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preset, setPreset] = useState("Chirp");
  const [winType, setWinType] = useState<WinType>("hann");
  const [{ fftSize, overlap }, update] = useShareableNumbers({ fftSize: 256, overlap: 50 });
  const N = FFT_SIZES.includes(fftSize as (typeof FFT_SIZES)[number]) ? fftSize : 256;
  const hop = Math.max(1, Math.round(N * (1 - overlap / 100)));

  // Raw signal.
  const sig = useMemo(() => {
    const gen = SIGNALS[preset] ?? SIGNALS.Chirp;
    const rnd = mulberry32(1);
    const x = new Float64Array(LEN);
    for (let i = 0; i < LEN; i++) x[i] = gen(i, rnd);
    return x;
  }, [preset]);

  // Short-time Fourier transform → magnitude in dB.
  const stft = useMemo(() => {
    const win = windowCoeffs(N, winType);
    const bins = N >> 1; // real signal → keep 0..N/2-1
    const frames = Math.max(1, Math.floor((LEN - N) / hop) + 1);
    const db = new Float32Array(frames * bins);
    const re = new Float64Array(N), im = new Float64Array(N);
    let maxDb = -Infinity;
    for (let m = 0; m < frames; m++) {
      const start = m * hop;
      for (let n = 0; n < N; n++) { re[n] = sig[start + n] * win[n]; im[n] = 0; }
      fft(re, im);
      for (let k = 0; k < bins; k++) {
        const mag = Math.hypot(re[k], im[k]) / N;
        const d = 20 * Math.log10(mag + 1e-9);
        db[m * bins + k] = d;
        if (d > maxDb) maxDb = d;
      }
    }
    return { db, frames, bins, maxDb };
  }, [sig, N, hop, winType]);

  // Draw: waveform strip on top, spectrogram heatmap below, animated time cursor.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { db, frames, bins, maxDb } = stft;
    const floor = maxDb - DB_RANGE;

    // Offscreen heatmap at native (frames × bins) resolution, then scaled up.
    const off = document.createElement("canvas");
    off.width = frames; off.height = bins;
    const octx = off.getContext("2d")!;
    const img = octx.createImageData(frames, bins);
    for (let m = 0; m < frames; m++) {
      for (let k = 0; k < bins; k++) {
        const t = (db[m * bins + k] - floor) / (maxDb - floor || 1);
        const [r, g, b] = viridis(t);
        const y = bins - 1 - k; // low freq at bottom
        const p = (y * frames + m) * 4;
        img.data[p] = r; img.data[p + 1] = g; img.data[p + 2] = b; img.data[p + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);

    // Layout regions.
    const PADL = 46, PADR = 12;
    const plotX = PADL, plotW = W - PADL - PADR;
    const waveY = 10, waveH = 78, waveMid = waveY + waveH / 2;
    const specY = 116, specH = H - specY - 24, specW = plotW;

    let maxAbs = 1e-9;
    for (let i = 0; i < sig.length; i++) maxAbs = Math.max(maxAbs, Math.abs(sig[i]));

    const draw = (cursor: number) => {
      const ctx = hidpi(canvas, W, H);
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, W, H);

      // --- Waveform strip (min/max envelope) ---
      ctx.strokeStyle = PALETTE.axis;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(plotX, waveMid); ctx.lineTo(plotX + plotW, waveMid); ctx.stroke();
      ctx.strokeStyle = PALETTE.primary;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let px = 0; px < plotW; px++) {
        const i0 = Math.floor((px / plotW) * LEN);
        const i1 = Math.max(i0 + 1, Math.floor(((px + 1) / plotW) * LEN));
        let lo = Infinity, hi = -Infinity;
        for (let i = i0; i < i1 && i < LEN; i++) { const v = sig[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
        const x = plotX + px;
        const yHi = waveMid - (hi / maxAbs) * (waveH / 2 - 2);
        const yLo = waveMid - (lo / maxAbs) * (waveH / 2 - 2);
        ctx.moveTo(x, yHi); ctx.lineTo(x, yLo);
      }
      ctx.stroke();
      ctx.fillStyle = PALETTE.text;
      ctx.font = "10px ui-monospace, monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText("signal x(t)", plotX + 4, waveY + 8);

      // --- Spectrogram heatmap ---
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, frames, bins, plotX, specY, specW, specH);
      ctx.strokeStyle = PALETTE.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(plotX + 0.5, specY + 0.5, specW - 1, specH - 1);

      // Frequency axis labels (0 .. Nyquist), 0 at bottom.
      ctx.fillStyle = PALETTE.text;
      ctx.textAlign = "right";
      const nyq = FS / 2;
      for (let f = 0; f <= nyq; f += nyq / 4) {
        const y = specY + specH * (1 - f / nyq);
        ctx.fillText(`${Math.round(f)}`, plotX - 6, y);
      }
      ctx.save();
      ctx.translate(12, specY + specH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("frequency (Hz)", 0, 0);
      ctx.restore();

      // Time axis labels.
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let s = 0; s <= 4; s++) {
        const frac = s / 4;
        ctx.fillText(`${(DUR * frac).toFixed(2)}s`, plotX + specW * frac, specY + specH + 6);
      }

      // Animated time cursor across both strips.
      const cx = plotX + specW * cursor;
      ctx.strokeStyle = PALETTE.accent;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, waveY); ctx.lineTo(cx, waveY + waveH);
      ctx.moveTo(cx, specY); ctx.lineTo(cx, specY + specH);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    let t = 0;
    draw(0);
    const id = setInterval(() => { t = (t + 1) % 200; draw(t / 200); }, 45);
    return () => clearInterval(id);
  }, [stft, sig]);

  const df = FS / N;
  const timeRes = (N / FS) * 1000; // ms

  const explain =
    N >= 512
      ? `A ${N}-point window gives fine frequency resolution (Δf = ${df.toFixed(1)} Hz) but spans ${timeRes.toFixed(0)} ms, so rapid changes (like the chirp sweeping or a hop) smear across time.`
      : N <= 128
      ? `A ${N}-point window localizes events tightly in time (${timeRes.toFixed(0)} ms per frame) but its coarse Δf = ${df.toFixed(1)} Hz blurs nearby tones together.`
      : `A ${N}-point window balances the two: Δf = ${df.toFixed(1)} Hz in frequency against ${timeRes.toFixed(0)} ms in time. Widen it for sharper tones, narrow it to pin down fast transients — you cannot sharpen both at once.`;

  const noverlap = N - hop;
  const winPy = winType === "rect" ? "boxcar" : winType;
  const code = `import numpy as np
from scipy import signal
import matplotlib.pyplot as plt

fs = ${FS}
t = np.arange(0, ${DUR}, 1/fs)
${SIGNAL_PY[preset]}

f, tt, Sxx = signal.spectrogram(
    x, fs, window='${winPy}', nperseg=${N},
    noverlap=${noverlap}, mode='magnitude')

plt.pcolormesh(tt, f, 20*np.log10(Sxx + 1e-9), shading='gouraud')
plt.ylabel('Frequency (Hz)'); plt.xlabel('Time (s)')
plt.title('Spectrogram — ${preset}'); plt.colorbar(label='dB')
plt.show()`;

  return (
    <StudioChrome title="Spectrogram Studio" tagline="STFT time–frequency analysis"
      controls={<div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Signal</p>
        <Presets
          presets={Object.keys(SIGNALS).map((label) => ({ label }))}
          onApply={(label) => setPreset(label)}
        />
        <p className="mb-3 text-xs text-slate-500">A real short-time Fourier transform: the signal is sliced into overlapping windows, each Fourier-transformed, and stacked into a time–frequency heatmap.</p>

        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Window size (FFT)</p>
        <div className="mb-3 grid grid-cols-5 gap-1.5">{FFT_SIZES.map((s) => <button key={s} onClick={() => update({ fftSize: s })} className={`rounded-lg px-1 py-1 text-xs font-semibold ${N === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>)}</div>

        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Window type</p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">{WINDOWS.map((w) => <button key={w} onClick={() => setWinType(w)} className={`rounded-lg px-1 py-1 text-xs font-semibold capitalize ${winType === w ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{w}</button>)}</div>

        <Slider label="Overlap %" value={overlap} min={0} max={90} step={5} onChange={(v) => update({ overlap: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Sample rate" value={`${FS} Hz`} />
        <Stat label="Window size" value={`${N} pts`} />
        <Stat label="Hop" value={`${hop} pts`} />
        <Stat label="Freq res Δf" value={`${df.toFixed(1)} Hz`} />
        <Stat label="Time res" value={`${timeRes.toFixed(1)} ms`} />
        <Stat label="Frames" value={`${stft.frames}`} />
        <Equation tex={`X(m,k)=\\sum_{n=0}^{N-1} x(n)\\,w(n-mH)\\,e^{-j2\\pi kn/N}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
