"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 420;
const N = 200; // procedural test image is N×N grayscale

type Kernel = { k: number[][]; sum: number; bias: number; blurable: boolean };

// 3×3 kernel bank. `bias` is added before clamping so signed (zero-sum) results stay visible.
const KERNELS: Record<string, Kernel> = {
  Identity: { k: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], sum: 1, bias: 0, blurable: false },
  "Box blur": { k: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]], sum: 1, bias: 0, blurable: true },
  "Gaussian blur": { k: [[1 / 16, 2 / 16, 1 / 16], [2 / 16, 4 / 16, 2 / 16], [1 / 16, 2 / 16, 1 / 16]], sum: 1, bias: 0, blurable: true },
  Sharpen: { k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], sum: 1, bias: 0, blurable: false },
  "Edge (Laplacian)": { k: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]], sum: 0, bias: 128, blurable: false },
  Emboss: { k: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], sum: 1, bias: 128, blurable: false },
  "Sobel-X": { k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], sum: 0, bias: 128, blurable: false },
  "Sobel-Y": { k: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], sum: 0, bias: 128, blurable: false },
};

const PRESETS: Record<string, { kernel: string; blend: number; passes: number }> = {
  "Heavy blur": { kernel: "Gaussian blur", blend: 1, passes: 4 },
  "Crisp sharpen": { kernel: "Sharpen", blend: 1, passes: 1 },
  "Edge detect": { kernel: "Edge (Laplacian)", blend: 1, passes: 1 },
  "Emboss art": { kernel: "Emboss", blend: 1, passes: 1 },
  "Subtle blur": { kernel: "Box blur", blend: 0.5, passes: 1 },
};

// Deterministic procedural grayscale test image: gradient + circle + rectangle + fine texture + noise.
function makeImage(): Float32Array {
  const img = new Float32Array(N * N);
  let seed = 1337;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const cx = 0.36 * N, cy = 0.42 * N, r = 0.22 * N;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let v = 45 + 120 * (x / N); // horizontal gradient
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy < r * r) v = 205; // bright circle
      if (x > 0.58 * N && x < 0.9 * N && y > 0.55 * N && y < 0.85 * N) v = 70; // dark rectangle
      v += 22 * Math.sin(x / 3.0) * Math.sin(y / 3.0); // fine high-frequency texture
      v += (rnd() - 0.5) * 28; // speckle noise
      img[y * N + x] = Math.max(0, Math.min(255, v));
    }
  }
  return img;
}

// True 2D convolution (flip kernel) with clamped (replicate) edges — matches scipy.ndimage.convolve.
function convolveOnce(src: Float32Array, k: number[][]): Float32Array {
  const out = new Float32Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let s = 0;
      for (let ki = 0; ki < 3; ki++) {
        for (let kj = 0; kj < 3; kj++) {
          let sy = y - (ki - 1), sx = x - (kj - 1);
          if (sy < 0) sy = 0; else if (sy >= N) sy = N - 1;
          if (sx < 0) sx = 0; else if (sx >= N) sx = N - 1;
          s += k[ki][kj] * src[sy * N + sx];
        }
      }
      out[y * N + x] = s;
    }
  }
  return out;
}

function putGray(ctx: CanvasRenderingContext2D, data: Float32Array, bias: number) {
  const im = ctx.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    let v = data[i] + bias;
    v = v < 0 ? 0 : v > 255 ? 255 : v;
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
    im.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
}

export function ImageConvolutionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ blend, passes }, update] = useShareableNumbers({ blend: 1, passes: 1 });
  const [kernelName, setKernelName] = useState("Edge (Laplacian)");

  // Load a shared ?kernel= on mount.
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("kernel");
      if (p && KERNELS[p]) setKernelName(p);
    } catch { /* ignore */ }
  }, []);

  const selectKernel = (n: string) => {
    if (!KERNELS[n]) return;
    setKernelName(n);
    try {
      const p = new URLSearchParams(window.location.search);
      p.set("kernel", n);
      window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
    } catch { /* ignore */ }
  };

  const original = useMemo(() => makeImage(), []);
  const kernel = KERNELS[kernelName];
  const nPasses = kernel.blurable ? Math.max(1, Math.round(passes)) : 1;

  const filtered = useMemo(() => {
    let cur = original;
    for (let p = 0; p < nPasses; p++) cur = convolveOnce(cur, kernel.k);
    return cur;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [original, kernelName, nPasses]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);

    const S = 330, y0 = 52, xL = 30, xR = 400;
    const off = document.createElement("canvas"); off.width = N; off.height = N;
    const octx = off.getContext("2d")!;

    // ORIGINAL (left)
    putGray(octx, original, 0);
    ctx.drawImage(off, xL, y0, S, S);

    // FILTERED (right), mixed with original by the strength slider. `bias` is folded in first.
    const mix = new Float32Array(N * N);
    const b = Math.max(0, Math.min(1, blend));
    for (let i = 0; i < N * N; i++) mix[i] = original[i] * (1 - b) + (filtered[i] + kernel.bias) * b;
    putGray(octx, mix, 0);
    ctx.drawImage(off, xR, y0, S, S);

    // frames + labels
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1;
    ctx.strokeRect(xL + 0.5, y0 + 0.5, S, S); ctx.strokeRect(xR + 0.5, y0 + 0.5, S, S);
    ctx.fillStyle = "#94a3b8"; ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("Original", xL, y0 - 14);
    ctx.fillStyle = "#22d3ee";
    ctx.fillText(`Filtered — ${kernelName}${nPasses > 1 ? ` ×${nPasses}` : ""}`, xR, y0 - 14);

    // arrow between panels
    ctx.strokeStyle = "#22d3ee"; ctx.fillStyle = "#22d3ee"; ctx.lineWidth = 2;
    const ay = y0 + S / 2, ax0 = xL + S + 6, ax1 = xR - 6;
    ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(ax1 - 8, ay); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax1, ay); ctx.lineTo(ax1 - 9, ay - 5); ctx.lineTo(ax1 - 9, ay + 5); ctx.closePath(); ctx.fill();
  }, [original, filtered, blend, kernelName, nPasses]);

  const sum = Math.round(kernel.sum * 1000) / 1000;
  const explain =
    kernel.sum === 0
      ? `The ${kernelName} kernel sums to 0, so flat regions cancel to gray and only intensity CHANGES survive — this is why it highlights edges. (Shown with a +128 gray bias so negative responses are visible.)`
      : kernelName === "Emboss"
      ? `Emboss weights opposite corners with opposite signs, so it acts like a directional derivative that turns edges into a raised, lit relief. A +128 bias maps flat areas to neutral gray.`
      : kernel.blurable
      ? `A blur kernel is a weighted average: every weight is positive and they sum to 1, so brightness is preserved while high-frequency texture and noise are smoothed away. Extra passes widen the effective blur radius.`
      : kernelName === "Sharpen"
      ? `Sharpen = identity plus a Laplacian: it boosts the center pixel and subtracts its neighbors, amplifying local contrast. Weights still sum to 1, so overall brightness is preserved.`
      : `The identity kernel leaves every pixel unchanged — a useful baseline. Its single center weight of 1 (sum = 1) reproduces the input exactly.`;

  const kpy = kernel.k.map((row) => "    [" + row.map((v) => (Math.round(v * 10000) / 10000).toString()).join(", ") + "]").join(",\n");
  const code = `import numpy as np
from scipy.ndimage import convolve

# grayscale image as a 2D float array (H x W), values 0..255
# img = ...  # e.g. np.asarray(Image.open("photo.png").convert("L"), float)

K = np.array([
${kpy},
])  # ${kernelName}, sum = ${sum}

out = convolve(img, K, mode="nearest")  # replicate (clamp) edges
${nPasses > 1 ? `for _ in range(${nPasses - 1}):\n    out = convolve(out, K, mode="nearest")\n` : ""}${kernel.bias ? `out = out + ${kernel.bias}  # bias so signed responses are visible\n` : ""}out = np.clip(out, 0, 255).astype(np.uint8)
print("kernel sum:", K.sum(), "output range:", out.min(), out.max())`;

  return (
    <StudioChrome title="Image Convolution Studio" tagline="kernels, filters & edge detection"
      controls={<div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Kernel</p>
        <div className="mb-3 grid grid-cols-2 gap-1.5">{Object.keys(KERNELS).map((s) => <button key={s} onClick={() => selectKernel(s)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${kernelName === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Each kernel slides over the image and replaces every pixel with a weighted sum of its 3×3 neighborhood. Blur averages; edge kernels difference.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => { const p = PRESETS[label]; selectKernel(p.kernel); update({ blend: p.blend, passes: p.passes }); }}
        />
        <Slider label="Strength (original → filtered)" value={blend} min={0} max={1} step={0.05} onChange={(v) => update({ blend: v })} />
        <Slider label={`Blur passes${kernel.blurable ? "" : " (blur only)"}`} value={passes} min={1} max={4} step={1} onChange={(v) => update({ passes: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Kernel" value={kernelName} />
        <Stat label="Sum of weights" value={String(sum)} />
        <Stat label="Passes" value={String(nPasses)} />
        <div className="mt-3 rounded-lg border border-slate-200 bg-white/60 p-2.5 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">3×3 kernel</p>
          <div className="grid grid-cols-3 gap-1">
            {kernel.k.flat().map((v, i) => (
              <div key={i} className={`rounded px-1 py-1 text-center font-mono text-[11px] ${i === 4 ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                {Math.round(v * 1000) / 1000}
              </div>
            ))}
          </div>
        </div>
        <Equation tex={`(I*K)(x,y)=\\sum_{i,j}K(i,j)\\,I(x-i,y-j)`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
