"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

// Logical canvas size (CSS scales it up to fill the stage). Two NxN panels sit side by side.
const N = 200;              // procedural test image is N x N grayscale
const SIZE = 210;           // on-canvas display size of each panel
const PAD = 12, GAP = 18, LABEL = 26;
const W = PAD + SIZE + GAP + SIZE + PAD;   // 462
const H = LABEL + SIZE + PAD;              // 248

type Method = "sobel" | "prewitt" | "canny";
type Stage = "blur" | "gradient" | "nms" | "final";

// ---------- procedural test image (no external assets) ----------
// Deterministic PRNG so the image is stable across re-renders.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeImage(): Float32Array {
  const rand = mulberry32(1337);
  const img = new Float32Array(N * N);
  const cx = 68, cy = 72, cr = 32;         // filled circle (curved edges)
  const rx0 = 112, rx1 = 172, ry0 = 38, ry1 = 104; // rectangle (orthogonal edges)
  const bx0 = 36, bx1 = 180, by0 = 150, by1 = 176;  // long horizontal bar
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let v = 28 + 14 * (x / N);           // faint background gradient
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= cr * cr) v = 205;
      if (x >= rx0 && x <= rx1 && y >= ry0 && y <= ry1) v = 135;
      if (x >= bx0 && x <= bx1 && y >= by0 && y <= by1) v = 185;
      v += (rand() - 0.5) * 16;            // sensor-like noise
      img[y * N + x] = Math.max(0, Math.min(255, v));
    }
  }
  return img;
}

// ---------- image-processing primitives (real math, TS) ----------
const clampIdx = (v: number) => (v < 0 ? 0 : v >= N ? N - 1 : v);

// Separable Gaussian blur (used by the Canny pipeline).
function gaussianBlur(src: Float32Array, sigma: number): Float32Array {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float32Array(2 * r + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) { const w = Math.exp(-(i * i) / (2 * sigma * sigma)); k[i + r] = w; sum += w; }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const tmp = new Float32Array(N * N);
  const out = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += k[i + r] * src[y * N + clampIdx(x + i)];
      tmp[y * N + x] = s;
    }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += k[i + r] * tmp[clampIdx(y + i) * N + x];
      out[y * N + x] = s;
    }
  return out;
}

// 3x3 gradient convolution -> magnitude and direction.
function gradients(src: Float32Array, gxk: number[], gyk: number[]) {
  const mag = new Float32Array(N * N);
  const dir = new Float32Array(N * N);
  let maxMag = 1e-6;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let sx = 0, sy = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const v = src[clampIdx(y + dy) * N + clampIdx(x + dx)];
          const ki = (dy + 1) * 3 + (dx + 1);
          sx += v * gxk[ki];
          sy += v * gyk[ki];
        }
      const m = Math.hypot(sx, sy);
      const idx = y * N + x;
      mag[idx] = m;
      dir[idx] = Math.atan2(sy, sx);
      if (m > maxMag) maxMag = m;
    }
  return { mag, dir, maxMag };
}

// Non-maximum suppression: thin edges to 1px by keeping only local maxima
// along the gradient direction (quantized to 0/45/90/135 degrees).
function nonMaxSuppression(mag: Float32Array, dir: Float32Array): Float32Array {
  const out = new Float32Array(N * N);
  for (let y = 1; y < N - 1; y++)
    for (let x = 1; x < N - 1; x++) {
      const idx = y * N + x;
      let ang = (dir[idx] * 180) / Math.PI;
      if (ang < 0) ang += 180;
      let a: number, b: number;
      if (ang < 22.5 || ang >= 157.5) { a = mag[idx - 1]; b = mag[idx + 1]; }
      else if (ang < 67.5) { a = mag[idx - N + 1]; b = mag[idx + N - 1]; }
      else if (ang < 112.5) { a = mag[idx - N]; b = mag[idx + N]; }
      else { a = mag[idx - N - 1]; b = mag[idx + N + 1]; }
      out[idx] = mag[idx] >= a && mag[idx] >= b ? mag[idx] : 0;
    }
  return out;
}

// Double threshold + hysteresis: strong pixels seed edges; weak pixels survive
// only if 8-connected to a strong pixel. Input/thresholds on a 0..255 scale.
function hysteresis(norm: Float32Array, low: number, high: number): Float32Array {
  const label = new Uint8Array(N * N); // 0 none, 1 weak, 2 strong
  const stack: number[] = [];
  for (let i = 0; i < N * N; i++) {
    if (norm[i] >= high) { label[i] = 2; stack.push(i); }
    else if (norm[i] >= low) label[i] = 1;
  }
  while (stack.length) {
    const idx = stack.pop()!;
    const x = idx % N, y = (idx / N) | 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        const ni = ny * N + nx;
        if (label[ni] === 1) { label[ni] = 2; stack.push(ni); }
      }
  }
  const out = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) out[i] = label[i] === 2 ? 255 : 0;
  return out;
}

const KERNELS: Record<Exclude<Method, "canny"> | "sobel", { gx: number[]; gy: number[] }> = {
  sobel: { gx: [-1, 0, 1, -2, 0, 2, -1, 0, 1], gy: [-1, -2, -1, 0, 0, 0, 1, 2, 1] },
  prewitt: { gx: [-1, 0, 1, -1, 0, 1, -1, 0, 1], gy: [-1, -1, -1, 0, 0, 0, 1, 1, 1] },
};

const METHOD_LABEL: Record<Method, string> = { sobel: "Sobel", prewitt: "Prewitt", canny: "Canny" };
const STAGE_LABEL: Record<Stage, string> = { blur: "Blur", gradient: "Gradient", nms: "Thinned (NMS)", final: "Final edges" };

const PRESETS: Record<string, { method: Method; sigma: number; low: number; high: number }> = {
  "Canny — balanced": { method: "canny", sigma: 1.4, low: 20, high: 55 },
  "Canny — sensitive": { method: "canny", sigma: 1.0, low: 8, high: 28 },
  "Canny — clean": { method: "canny", sigma: 2.0, low: 30, high: 80 },
  "Sobel magnitude": { method: "sobel", sigma: 1.4, low: 20, high: 55 },
};

export function EdgeDetectionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [method, setMethod] = useState<Method>("canny");
  const [stage, setStage] = useState<Stage>("final");
  const [{ sigma, low, high }, update] = useShareableNumbers({ sigma: 1.4, low: 20, high: 55 });

  const original = useMemo(makeImage, []);

  const { edgeData, edgePct, edgeLabel } = useMemo(() => {
    if (method !== "canny") {
      const { mag, maxMag } = gradients(original, KERNELS[method].gx, KERNELS[method].gy);
      const out = new Float32Array(N * N);
      let edges = 0;
      for (let i = 0; i < N * N; i++) {
        const norm = (mag[i] / maxMag) * 255;
        out[i] = norm;
        if (norm > 40) edges++;
      }
      return { edgeData: out, edgePct: (edges / (N * N)) * 100, edgeLabel: `${METHOD_LABEL[method]} magnitude` };
    }
    // Canny pipeline: blur -> Sobel gradients -> NMS -> double threshold + hysteresis.
    const blurred = gaussianBlur(original, sigma);
    const { mag, dir, maxMag } = gradients(blurred, KERNELS.sobel.gx, KERNELS.sobel.gy);
    const gradNorm = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) gradNorm[i] = (mag[i] / maxMag) * 255;
    const supp = nonMaxSuppression(mag, dir);
    const suppNorm = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) suppNorm[i] = (supp[i] / maxMag) * 255;
    const finalEdges = hysteresis(suppNorm, low, Math.max(low + 1, high));
    let edges = 0;
    for (let i = 0; i < N * N; i++) if (finalEdges[i] > 0) edges++;
    const data = stage === "blur" ? blurred : stage === "gradient" ? gradNorm : stage === "nms" ? suppNorm : finalEdges;
    return { edgeData: data, edgePct: (edges / (N * N)) * 100, edgeLabel: `Canny — ${STAGE_LABEL[stage]}` };
  }, [original, method, stage, sigma, low, high]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);

    const panel = (data: Float32Array) => {
      const c = document.createElement("canvas");
      c.width = N; c.height = N;
      const cc = c.getContext("2d")!;
      const im = cc.createImageData(N, N);
      for (let i = 0; i < N * N; i++) {
        const v = data[i] < 0 ? 0 : data[i] > 255 ? 255 : data[i];
        im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255;
      }
      cc.putImageData(im, 0, 0);
      return c;
    };

    const lx = PAD, rx = PAD + SIZE + GAP;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(panel(original), lx, LABEL, SIZE, SIZE);
    ctx.drawImage(panel(edgeData), rx, LABEL, SIZE, SIZE);

    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1;
    ctx.strokeRect(lx + 0.5, LABEL + 0.5, SIZE, SIZE);
    ctx.strokeRect(rx + 0.5, LABEL + 0.5, SIZE, SIZE);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("Original", lx, LABEL / 2);
    ctx.fillText(edgeLabel, rx, LABEL / 2);
  }, [original, edgeData, edgeLabel]);

  const explain =
    method === "canny"
      ? `Canny blurs first (σ=${sigma}) to tame noise, then measures the intensity gradient — its magnitude spikes at brightness jumps, i.e. edges. Non-maximum suppression thins each ridge to a single pixel by keeping only the local maximum across the gradient direction. Double thresholding (low ${low}, high ${high}) then keeps strong edges, and hysteresis rescues weak pixels only where they connect to a strong one — linking faint but real contours while dropping isolated noise.`
      : `${METHOD_LABEL[method]} convolves the image with a pair of ${method === "sobel" ? "weighted" : "uniform"} 3×3 derivative kernels to estimate the horizontal and vertical intensity slopes Gₓ and G_y. Their combined magnitude √(Gₓ²+G_y²) is large exactly where brightness changes sharply, so bright pixels here mark edges. Unlike Canny there is no thinning or thresholding, so edges appear as thick gradient ridges.`;

  const code =
    method === "canny"
      ? `import cv2
import numpy as np

# your image (grayscale, uint8)
img = cv2.imread("image.png", cv2.IMREAD_GRAYSCALE)

# Canny: Gaussian smoothing (via aperture) -> Sobel -> NMS -> hysteresis
blur = cv2.GaussianBlur(img, (0, 0), ${sigma})
edges = cv2.Canny(blur, ${low}, ${Math.max(low + 1, high)})  # low, high thresholds

pct = 100 * np.count_nonzero(edges) / edges.size
print(f"edge pixels: {pct:.1f}%")`
      : `import numpy as np
from scipy import ndimage

# your image (grayscale float)
img = ndimage.imread("image.png", mode="F") if False else np.zeros((200, 200))

gx = ndimage.sobel(img, axis=1)   # horizontal gradient (use .prewitt for Prewitt)
gy = ndimage.sobel(img, axis=0)   # vertical gradient
mag = np.hypot(gx, gy)            # G = sqrt(Gx^2 + Gy^2)
mag *= 255.0 / (mag.max() + 1e-9)

edges = mag > 40
print("edge pixels: %.1f%%" % (100 * edges.mean()))`;

  return (
    <StudioChrome title="Edge Detection Studio" tagline="Sobel / Prewitt / Canny on a test image"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {(["sobel", "prewitt", "canny"] as Method[]).map((m) => (
            <button key={m} onClick={() => setMethod(m)}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${method === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>
              {METHOD_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="mb-3 text-xs text-slate-500">Edge detectors on a procedural grayscale test image. Sobel/Prewitt show gradient magnitude; Canny runs the full pipeline and thins to clean 1-pixel contours.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => { const p = PRESETS[label]; setMethod(p.method); update({ sigma: p.sigma, low: p.low, high: p.high }); }}
        />
        {method === "canny" && (
          <>
            <div className="mb-3">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Stage</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(["blur", "gradient", "nms", "final"] as Stage[]).map((s) => (
                  <button key={s} onClick={() => setStage(s)}
                    className={`rounded-lg px-1.5 py-1 text-[10px] font-semibold ${stage === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>
                    {s === "nms" ? "NMS" : s[0].toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Slider label="Gaussian σ" value={sigma} min={0.5} max={3} step={0.1} onChange={(v) => update({ sigma: v })} />
            <Slider label="Low threshold" value={low} min={0} max={150} step={1} onChange={(v) => update({ low: v })} />
            <Slider label="High threshold" value={high} min={1} max={200} step={1} onChange={(v) => update({ high: v })} />
          </>
        )}
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Method" value={METHOD_LABEL[method]} />
        {method === "canny" && <Stat label="Thresholds" value={`${low} / ${Math.max(low + 1, high)}`} />}
        {method === "canny" && <Stat label="Gaussian σ" value={String(sigma)} />}
        {method === "canny" && <Stat label="Stage" value={STAGE_LABEL[stage]} />}
        <Stat label="Edge pixels" value={`${edgePct.toFixed(1)}%`} />
        <Equation tex={`G=\\sqrt{G_x^2+G_y^2},\\ \\theta=\\operatorname{atan2}(G_y,G_x)`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
