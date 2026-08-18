"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

const KERNELS: Record<string, number[]> = {
  Identity: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  "Box blur": [1, 1, 1, 1, 1, 1, 1, 1, 1].map((v) => v / 9),
  "Gaussian blur": [1, 2, 1, 2, 4, 2, 1, 2, 1].map((v) => v / 16),
  Sharpen: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  "Edge detect": [-1, -1, -1, -1, 8, -1, -1, -1, -1],
  "Sobel X": [-1, 0, 1, -2, 0, 2, -1, 0, 1],
  Emboss: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
};

// Shareable numeric scenarios. sigma = smoothing spread, width = kernel taps.
const PRESETS: Record<string, { sigma: number; width: number }> = {
  "Light smoothing": { sigma: 1.0, width: 3 },
  "Heavy blur": { sigma: 2.4, width: 5 },
  "Edge-emphasis": { sigma: 0.4, width: 3 },
  "Identity/narrow": { sigma: 0.1, width: 1 },
};
// Each preset also selects the kernel the canvas actually renders.
const PRESET_KERNEL: Record<string, string> = {
  "Light smoothing": "Gaussian blur",
  "Heavy blur": "Box blur",
  "Edge-emphasis": "Edge detect",
  "Identity/narrow": "Identity",
};

export function ConvolutionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kernel, setKernel] = useState("Edge detect");
  const [{ sigma, width }, update] = useShareableNumbers({ sigma: 0.4, width: 3 });
  const src = useRef<ImageData | null>(null);

  useEffect(() => {
    const W = 260, H = 260; const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d")!;
    // synthetic scene: gradient + shapes + text-like bars
    const grad = g.createLinearGradient(0, 0, W, H); grad.addColorStop(0, "#1e293b"); grad.addColorStop(1, "#64748b"); g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.fillStyle = "#f8fafc"; g.beginPath(); g.arc(90, 90, 45, 0, 7); g.fill();
    g.fillStyle = "#22d3ee"; g.fillRect(140, 140, 90, 90);
    g.fillStyle = "#f472b6"; g.beginPath(); g.moveTo(60, 230); g.lineTo(120, 150); g.lineTo(180, 230); g.fill();
    g.strokeStyle = "#fbbf24"; g.lineWidth = 6; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(180 + i * 3, 20); g.lineTo(240, 40 + i * 14); g.stroke(); }
    src.current = g.getImageData(0, 0, W, H);
  }, []);

  useEffect(() => {
    if (!src.current) return; const W = 260, H = 260; const k = KERNELS[kernel]; const s = src.current.data;
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!; const out = ctx.createImageData(W, H); const d = out.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let r = 0, gg = 0, b = 0; for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) {
        const px = Math.min(W - 1, Math.max(0, x + kx)), py = Math.min(H - 1, Math.max(0, y + ky)); const idx = (py * W + px) * 4; const w = k[(ky + 1) * 3 + (kx + 1)];
        r += s[idx] * w; gg += s[idx + 1] * w; b += s[idx + 2] * w; }
      const o = (y * W + x) * 4; d[o] = Math.min(255, Math.max(0, r)); d[o + 1] = Math.min(255, Math.max(0, gg)); d[o + 2] = Math.min(255, Math.max(0, b)); d[o + 3] = 255;
    }
    ctx.putImageData(src.current, 0, 0); ctx.putImageData(out, W + 20, 0);
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px sans-serif"; ctx.fillText("input", 4, H + 16); ctx.fillText("output", W + 24, H + 16);
  }, [kernel]);

  const sum = KERNELS[kernel].reduce((a, b) => a + b, 0);
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : Number(v.toFixed(3)).toString());
  const km = KERNELS[kernel];
  const row = (a: number) => km.slice(a, a + 3).map(fmt).join(", ");

  const explain =
    kernel === "Identity"
      ? `This identity kernel copies the input straight through — a sanity check that the ${width}-tap window is doing nothing.`
      : sigma <= 0.5
      ? `Convolution slides the ${width}-tap kernel over the image; each output pixel is a weighted sum of its 3×3 neighbors. At sigma ≈ ${sigma.toFixed(1)} the weights stay tightly concentrated, so edges and fine detail survive and high-frequency structure is preserved.`
      : sigma >= 1.6
      ? `Convolution slides the ${width}-tap kernel over the image; each output pixel is a weighted sum of its 3×3 neighbors. At sigma ≈ ${sigma.toFixed(1)} the weights spread across the window, so the image blurs and high frequencies are suppressed.`
      : `Convolution slides the ${width}-tap kernel over the image; each output pixel is a weighted sum of its 3×3 neighbors. At sigma ≈ ${sigma.toFixed(1)} the "${kernel}" kernel gives a moderate response — some smoothing while structure is still kept.`;

  const code = `import numpy as np
from scipy.ndimage import convolve

# "${kernel}" kernel  (sigma=${sigma}, width=${width})
kernel = np.array([[${row(0)}],
                   [${row(3)}],
                   [${row(6)}]], dtype=float)

# each output pixel = weighted sum of its 3x3 neighborhood
out = convolve(img.astype(float), kernel, mode="nearest")
out = np.clip(out, 0, 255).astype(np.uint8)`;

  return (
    <StudioChrome title="Image Convolution / Kernels" tagline="the operation inside every CNN"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(l) => { update(PRESETS[l]); setKernel(PRESET_KERNEL[l]); }}
        />
        <div className="mb-3 grid grid-cols-2 gap-2">{Object.keys(KERNELS).map((k) => <button key={k} onClick={() => setKernel(k)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${kernel === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{k}</button>)}</div>
        <Slider label="Smoothing sigma" value={sigma} min={0.1} max={3} step={0.1} onChange={(v) => update({ sigma: v })} />
        <Slider label="Kernel width (taps)" value={width} min={1} max={9} step={2} onChange={(v) => update({ width: v })} />
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-3"><div className="mb-1 text-xs text-slate-500">3×3 kernel</div><div className="grid grid-cols-3 gap-1 font-mono text-xs text-cyan-300">{KERNELS[kernel].map((v, i) => <div key={i} className="rounded bg-slate-800 py-1 text-center">{v.toFixed(2).replace(/\.00$/, "")}</div>)}</div></div>
        <p className="mt-3 text-xs text-slate-500">Each output pixel is a weighted sum of its 3×3 neighborhood. Slide this kernel over an image and you get blur, sharpening, or edge maps — the exact operation a convolutional neural network learns.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Kernel" value={kernel} />
        <Stat label="Window" value="3×3" />
        <Stat label="Smoothing sigma" value={sigma.toFixed(1)} />
        <Stat label="Sum" value={sum.toFixed(2)} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={280} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
