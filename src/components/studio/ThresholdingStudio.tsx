"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const N = 200; // source image is N×N grayscale
const W = 520, H = 400; // canvas logical size

// Small deterministic PRNG so the scene is stable across renders.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Preset = { grad: number; noise: number; contrast: number };

// Presets differ mainly in the illumination gradient (grad), additive noise, and
// contrast compression — so that a single global threshold succeeds or fails.
const PRESETS: Record<string, Preset> = {
  Bimodal: { grad: 14, noise: 4, contrast: 1.0 },
  "Uneven lighting": { grad: 78, noise: 5, contrast: 1.0 },
  Noisy: { grad: 14, noise: 30, contrast: 1.0 },
  "Low contrast": { grad: 12, noise: 4, contrast: 0.34 },
};

// Build the procedural grayscale scene: bright foreground objects on a darker
// background, plus a diagonal illumination gradient, optional noise, and contrast.
function buildImage(p: Preset): Float32Array {
  const rng = seeded(0x9e3779b1);
  const g = new Float32Array(N * N);
  const bg = 62, fg = 168, mid = 128;
  const inCircle = (x: number, y: number, cx: number, cy: number, r: number) =>
    (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let obj = false;
      if (inCircle(x, y, 58, 60, 34)) obj = true;                    // big disk
      if (inCircle(x, y, 148, 74, 24)) obj = true;                   // small disk
      if (x >= 112 && x <= 172 && y >= 120 && y <= 176) obj = true;  // rectangle
      // triangle in the lower-left
      if (y > 118 && y < 182 && x > 26 && x < 26 + (y - 118) * 0.85) obj = true;
      let v = obj ? fg : bg;
      // diagonal uneven illumination in [-grad, +grad]
      const t = (x / N + y / N) * 0.5;
      v += (t - 0.5) * 2 * p.grad;
      // additive noise (approx-Gaussian via averaged uniforms)
      if (p.noise > 0) {
        const nz = (rng() + rng() + rng() - 1.5) * (p.noise / 0.75);
        v += nz;
      }
      // contrast compression around mid-gray
      v = mid + (v - mid) * p.contrast;
      g[y * N + x] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return g;
}

// 256-bin histogram of the (rounded) image.
function histogram(g: Float32Array): Uint32Array {
  const h = new Uint32Array(256);
  for (let i = 0; i < g.length; i++) h[Math.round(g[i])]++;
  return h;
}

// Otsu's method: pick T maximizing between-class variance σ_b²(T)=w0·w1·(µ0−µ1)².
function otsu(hist: Uint32Array, total: number) {
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];
  let wB = 0, sumB = 0, maxVar = -1, thr = 0;
  const curve = new Float32Array(256); // normalized between-class variance per T
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const w0 = wB / total, w1 = wF / total;
    const between = w0 * w1 * (mB - mF) * (mB - mF);
    curve[t] = between;
    if (between > maxVar) { maxVar = between; thr = t; }
  }
  return { thr, curve, maxVar };
}

// Summed-area table for O(1) box-mean queries (adaptive/local thresholding).
function integralImage(g: Float32Array): Float64Array {
  const I = new Float64Array((N + 1) * (N + 1));
  for (let y = 0; y < N; y++) {
    let rowSum = 0;
    for (let x = 0; x < N; x++) {
      rowSum += g[y * N + x];
      I[(y + 1) * (N + 1) + (x + 1)] = I[y * (N + 1) + (x + 1)] + rowSum;
    }
  }
  return I;
}

export function ThresholdingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preset, setPreset] = useState("Uneven lighting");
  const [method, setMethod] = useState<"global" | "otsu" | "adaptive">("otsu");
  const [{ manualT, win, offset }, update] = useShareableNumbers({ manualT: 110, win: 25, offset: 8 });

  const image = useMemo(() => buildImage(PRESETS[preset]), [preset]);
  const hist = useMemo(() => histogram(image), [image]);
  const { thr: otsuT, curve, maxVar } = useMemo(() => otsu(hist, N * N), [hist]);
  const integral = useMemo(() => integralImage(image), [image]);

  // window size is forced odd
  const winOdd = Math.max(3, Math.round((win - 1) / 2) * 2 + 1);

  // Compute the binary mask + foreground fraction + (for adaptive) the mean local threshold.
  const { mask, fgPct, avgLocalT } = useMemo(() => {
    const m = new Uint8Array(N * N);
    let fg = 0, tSum = 0;
    if (method === "adaptive") {
      const half = (winOdd - 1) / 2;
      const stride = N + 1;
      for (let y = 0; y < N; y++) {
        const y0 = Math.max(0, y - half), y1 = Math.min(N - 1, y + half);
        for (let x = 0; x < N; x++) {
          const x0 = Math.max(0, x - half), x1 = Math.min(N - 1, x + half);
          const area = (x1 - x0 + 1) * (y1 - y0 + 1);
          const sum =
            integral[(y1 + 1) * stride + (x1 + 1)] -
            integral[y0 * stride + (x1 + 1)] -
            integral[(y1 + 1) * stride + x0] +
            integral[y0 * stride + x0];
          const localT = sum / area - offset;
          tSum += localT;
          if (image[y * N + x] > localT) { m[y * N + x] = 1; fg++; }
        }
      }
    } else {
      const T = method === "otsu" ? otsuT : manualT;
      for (let i = 0; i < N * N; i++) {
        if (image[i] > T) { m[i] = 1; fg++; }
      }
      tSum = T * N * N;
    }
    return { mask: m, fgPct: (fg / (N * N)) * 100, avgLocalT: tSum / (N * N) };
  }, [image, integral, method, manualT, winOdd, offset, otsuT]);

  // The threshold value drawn as a line on the histogram.
  const shownT = method === "otsu" ? otsuT : method === "global" ? manualT : avgLocalT;

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;

    // --- original (grayscale) offscreen ---
    const orig = document.createElement("canvas"); orig.width = N; orig.height = N;
    const og = orig.getContext("2d")!; const oi = og.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const v = image[i]; oi.data[i * 4] = v; oi.data[i * 4 + 1] = v; oi.data[i * 4 + 2] = v; oi.data[i * 4 + 3] = 255;
    }
    og.putImageData(oi, 0, 0);

    // --- binary result offscreen (cyan foreground on dark) ---
    const bin = document.createElement("canvas"); bin.width = N; bin.height = N;
    const bg = bin.getContext("2d")!; const bi = bg.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      if (mask[i]) { bi.data[i * 4] = 34; bi.data[i * 4 + 1] = 211; bi.data[i * 4 + 2] = 238; }
      else { bi.data[i * 4] = 15; bi.data[i * 4 + 1] = 23; bi.data[i * 4 + 2] = 42; }
      bi.data[i * 4 + 3] = 255;
    }
    bg.putImageData(bi, 0, 0);

    const S = 200, oy = 26, ox1 = 12, ox2 = 308;
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("Original", ox1, 18);
    ctx.fillText(`Binary — ${method === "otsu" ? "Otsu" : method === "global" ? "Global" : "Adaptive"}`, ox2, 18);
    ctx.drawImage(orig, ox1, oy, S, S);
    ctx.drawImage(bin, ox2, oy, S, S);
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1;
    ctx.strokeRect(ox1, oy, S, S); ctx.strokeRect(ox2, oy, S, S);

    // --- histogram ---
    const hx = 12, hy = 252, hw = 496, hh = 118;
    ctx.fillStyle = "#94a3b8"; ctx.fillText("Histogram + threshold", hx, 246);
    let maxH = 0; for (let i = 0; i < 256; i++) if (hist[i] > maxH) maxH = hist[i];
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(hx, hy + hh); ctx.lineTo(hx + hw, hy + hh); ctx.stroke();
    const tPix = Math.round(shownT);
    for (let i = 0; i < 256; i++) {
      const bh = maxH ? (hist[i] / maxH) * (hh - 4) : 0;
      const x = hx + (i / 255) * hw;
      ctx.strokeStyle = i <= tPix ? "#475569" : "#0e7490";
      ctx.beginPath(); ctx.moveTo(x, hy + hh); ctx.lineTo(x, hy + hh - bh); ctx.stroke();
    }

    // Otsu between-class variance curve
    if (maxVar > 0) {
      ctx.strokeStyle = method === "otsu" ? "#a3e635" : "rgba(163,230,53,0.35)";
      ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < 256; i++) {
        const x = hx + (i / 255) * hw;
        const y = hy + hh - (curve[i] / maxVar) * (hh - 6);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      if (method === "otsu") {
        const px = hx + (otsuT / 255) * hw;
        ctx.fillStyle = "#a3e635"; ctx.beginPath();
        ctx.arc(px, hy + hh - (curve[otsuT] / maxVar) * (hh - 6), 4, 0, 7); ctx.fill();
      }
    }

    // threshold marker line
    const lx = hx + (tPix / 255) * hw;
    ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2;
    if (method === "adaptive") ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(lx, hy - 2); ctx.lineTo(lx, hy + hh); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#fbbf24"; ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(method === "adaptive" ? `mean T≈${Math.round(shownT)}` : `T=${Math.round(shownT)}`, Math.min(lx + 5, hx + hw - 60), hy + 10);
  }, [image, hist, mask, method, shownT, curve, maxVar, otsuT]);

  const explain =
    method === "otsu"
      ? `Otsu scans every candidate threshold and picks T=${otsuT}, the value that maximizes the between-class variance σ_b² (green curve) — equivalently, the split that best separates the two histogram peaks. It needs no manual tuning, but as one global cut it still struggles when lighting is uneven.`
      : method === "adaptive"
      ? `Adaptive thresholding compares each pixel to the mean of its ${winOdd}×${winOdd} neighborhood (minus an offset of ${offset}), so the cutoff tracks the local illumination. This is why it wins under uneven lighting, where any single global T mislabels the dark and bright corners.`
      : `A global threshold cuts the whole image at one value (T=${manualT}). It works when the histogram is cleanly bimodal, but under an illumination gradient no single T is right everywhere — the shaded side loses foreground while the bright side floods with false positives.`;

  const code = `import numpy as np
from skimage.filters import threshold_otsu
import cv2

# img: uint8 grayscale image (0..255), objects brighter than background

# --- Otsu (global, automatic) ---
T = threshold_otsu(img)            # maximizes between-class variance
binary_otsu = (img > T)            # T computed here ≈ ${otsuT}

# --- Global (manual threshold) ---
binary_global = (img > ${manualT})

# --- Adaptive / local mean ---
binary_adaptive = cv2.adaptiveThreshold(
    img, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
    cv2.THRESH_BINARY, blockSize=${winOdd}, C=${offset})

foreground_pct = 100 * binary_${method}.mean()
print("foreground %%:", foreground_pct)`;

  const methods: { id: "global" | "otsu" | "adaptive"; label: string }[] = [
    { id: "global", label: "Global" },
    { id: "otsu", label: "Otsu" },
    { id: "adaptive", label: "Adaptive" },
  ];

  return (
    <StudioChrome title="Image Thresholding" tagline="segmentation: global vs Otsu vs adaptive"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(l) => setPreset(l)}
        />
        <div className="mb-3 grid grid-cols-3 gap-1.5">{methods.map((m) => <button key={m.id} onClick={() => setMethod(m.id)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${method === m.id ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m.label}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Segment bright objects from the background. Otsu finds the optimal cut automatically; adaptive thresholding tracks local lighting where a single global cut fails.</p>
        {method === "global" && (
          <Slider label="Manual threshold" value={manualT} min={0} max={255} step={1} onChange={(v) => update({ manualT: v })} />
        )}
        {method === "adaptive" && (
          <>
            <Slider label="Window size (px)" value={win} min={3} max={51} step={2} onChange={(v) => update({ win: v })} />
            <Slider label="Offset C" value={offset} min={0} max={30} step={1} onChange={(v) => update({ offset: v })} />
          </>
        )}
        {method === "otsu" && (
          <div className="mb-3 rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-400">Otsu computes the threshold automatically — no slider needed. The green curve on the histogram is the between-class variance; its peak is the chosen T.</div>
        )}
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Preset" value={preset} />
        <Stat label="Method" value={method === "otsu" ? "Otsu (auto)" : method === "global" ? "Global" : `Adaptive ${winOdd}×${winOdd}`} />
        <Stat label="Threshold T" value={method === "adaptive" ? `~${Math.round(avgLocalT)} (local)` : String(Math.round(shownT))} />
        <Stat label="Otsu optimal T" value={String(otsuT)} />
        <Stat label="Foreground" value={`${fgPct.toFixed(1)}%`} />
        <Equation tex={`\\sigma_b^2(T)=w_0\\,w_1\\,(\\mu_0-\\mu_1)^2`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="mx-auto h-auto w-full max-w-full rounded-lg" /></StudioChrome>
  );
}
