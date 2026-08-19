"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, PALETTE } from "@/lib/studioKit";

const W = 760, H = 500;
const SIZE = 200;                // image is SIZE×SIZE grayscale
const N = SIZE * SIZE;

type Preset = "Low contrast" | "Dark" | "Bright / washed-out" | "Bimodal";
type Method = "Equalize" | "Stretch" | "Gamma";

// A deterministic synthetic "scene" in [0,1]: radial rings + diagonal gradient + fine
// texture + a bright disk and a dark box, giving a structured, non-trivial histogram.
function baseScene(): Float32Array {
  const b = new Float32Array(N);
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const nx = px / (SIZE - 1), ny = py / (SIZE - 1);
      const dx = nx - 0.5, dy = ny - 0.5;
      const r = Math.sqrt(dx * dx + dy * dy);
      let v = 0.5 + 0.32 * Math.cos(r * 6.2);
      v = 0.6 * v + 0.4 * (0.5 * nx + 0.5 * (1 - ny));
      v += 0.07 * Math.sin(nx * 40) * Math.sin(ny * 40);
      if ((nx - 0.7) * (nx - 0.7) + (ny - 0.3) * (ny - 0.3) < 0.018) v += 0.3;
      if (nx > 0.14 && nx < 0.34 && ny > 0.6 && ny < 0.86) v -= 0.3;
      b[py * SIZE + px] = Math.max(0, Math.min(1, v));
    }
  }
  return b;
}

// Map the base scene into a low-dynamic-range image so equalization has a dramatic effect.
function makeImage(base: Float32Array, preset: Preset): Uint8Array {
  const out = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const v = base[i];
    let m: number;
    if (preset === "Low contrast") m = 0.42 + 0.16 * v;          // ~107..148
    else if (preset === "Dark") m = 0.02 + 0.28 * v;             // ~5..77
    else if (preset === "Bright / washed-out") m = 0.68 + 0.30 * v; // ~173..250
    else m = v < 0.5 ? 0.18 + 0.14 * (v / 0.5) : 0.66 + 0.14 * ((v - 0.5) / 0.5); // bimodal
    out[i] = Math.max(0, Math.min(255, Math.round(m * 255)));
  }
  return out;
}

function histogram(img: Uint8Array): Float64Array {
  const h = new Float64Array(256);
  for (let i = 0; i < N; i++) h[img[i]]++;
  return h;
}

function stats(img: Uint8Array) {
  let sum = 0, min = 255, max = 0;
  for (let i = 0; i < N; i++) { const v = img[i]; sum += v; if (v < min) min = v; if (v > max) max = v; }
  const mean = sum / N;
  let s2 = 0;
  for (let i = 0; i < N; i++) { const d = img[i] - mean; s2 += d * d; }
  return { mean, std: Math.sqrt(s2 / N), min, max, range: max - min };
}

// 256-entry look-up table (transfer function) r -> s for the chosen method.
function buildLUT(hist: Float64Array, method: Method, gamma: number, sMin: number, sMax: number): Uint8Array {
  const lut = new Uint8Array(256);
  if (method === "Equalize") {
    const cdf = new Float64Array(256);
    let acc = 0;
    for (let i = 0; i < 256; i++) { acc += hist[i]; cdf[i] = acc; }
    let cdfMin = 0;
    for (let i = 0; i < 256; i++) if (cdf[i] > 0) { cdfMin = cdf[i]; break; }
    const denom = N - cdfMin || 1;
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.max(0, Math.min(255, Math.round(((cdf[i] - cdfMin) / denom) * 255)));
    }
  } else if (method === "Stretch") {
    const span = sMax - sMin || 1;
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.max(0, Math.min(255, Math.round(((i - sMin) / span) * 255)));
    }
  } else {
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.max(0, Math.min(255, Math.round(255 * Math.pow(i / 255, gamma))));
    }
  }
  return lut;
}

// Render a grayscale array onto an offscreen canvas so it can be drawImage'd (respects the
// hi-DPI transform, unlike putImageData which writes raw device pixels).
function grayCanvas(img: Uint8Array): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = SIZE; off.height = SIZE;
  const octx = off.getContext("2d")!;
  const id = octx.createImageData(SIZE, SIZE);
  for (let i = 0; i < N; i++) { const g = img[i]; id.data[i * 4] = g; id.data[i * 4 + 1] = g; id.data[i * 4 + 2] = g; id.data[i * 4 + 3] = 255; }
  octx.putImageData(id, 0, 0);
  return off;
}

export function HistogramEqualizationStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preset, setPreset] = useState<Preset>("Low contrast");
  const [method, setMethod] = useState<Method>("Equalize");
  const [gamma, setGamma] = useState(0.5);

  const base = useMemo(() => baseScene(), []);

  const model = useMemo(() => {
    const orig = makeImage(base, preset);
    const histO = histogram(orig);
    const so = stats(orig);
    const lut = buildLUT(histO, method, gamma, so.min, so.max);
    const proc = new Uint8Array(N);
    for (let i = 0; i < N; i++) proc[i] = lut[orig[i]];
    const histP = histogram(proc);
    const sp = stats(proc);
    // normalized CDF of the ORIGINAL for the transfer overlay
    const cdf = new Float64Array(256);
    let acc = 0;
    for (let i = 0; i < 256; i++) { acc += histO[i]; cdf[i] = acc / N; }
    return { orig, proc, histO, histP, so, sp, lut, cdf };
  }, [base, preset, method, gamma]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;

    const label = (t: string, x: number, y: number) => {
      ctx.fillStyle = PALETTE.text;
      ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(t, x, y);
    };

    // ---- images ----
    const IMG = 200, iy = 42;
    label("Original", 24, 32);
    label("Processed", 248, 32);
    ctx.drawImage(grayCanvas(model.orig), 24, iy, IMG, IMG);
    ctx.drawImage(grayCanvas(model.proc), 248, iy, IMG, IMG);
    ctx.strokeStyle = PALETTE.axis; ctx.lineWidth = 1;
    ctx.strokeRect(24, iy, IMG, IMG);
    ctx.strokeRect(248, iy, IMG, IMG);

    // ---- transfer curve / CDF panel ----
    const tx = 492, ty = 42, tw = 244, th = 200;
    label("Transfer curve  •  CDF", tx, 32);
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = PALETTE.axis; ctx.lineWidth = 1;
    ctx.strokeRect(tx, ty, tw, th);
    // diagonal reference (identity)
    ctx.strokeStyle = PALETTE.grid; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(tx, ty + th); ctx.lineTo(tx + tw, ty); ctx.stroke();
    ctx.setLineDash([]);
    // original CDF (faint accent)
    ctx.strokeStyle = "rgba(163,230,53,0.45)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 256; i++) {
      const x = tx + (i / 255) * tw, y = ty + th - model.cdf[i] * th;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    // transfer LUT (primary)
    ctx.strokeStyle = PALETTE.primary; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 256; i++) {
      const x = tx + (i / 255) * tw, y = ty + th - (model.lut[i] / 255) * th;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = PALETTE.text; ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText("input r →", tx + tw - 58, ty + th - 6);

    // ---- histograms ----
    const drawHist = (hist: Float64Array, hx: number, hy: number, hw: number, hh: number, title: string, color: string) => {
      label(title, hx, hy - 10);
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(hx, hy, hw, hh);
      ctx.strokeStyle = PALETTE.axis; ctx.lineWidth = 1;
      ctx.strokeRect(hx, hy, hw, hh);
      let maxC = 0;
      for (let i = 0; i < 256; i++) if (hist[i] > maxC) maxC = hist[i];
      maxC = maxC || 1;
      ctx.fillStyle = color;
      const bw = hw / 256;
      for (let i = 0; i < 256; i++) {
        const bh = (hist[i] / maxC) * (hh - 4);
        ctx.fillRect(hx + i * bw, hy + hh - bh, Math.max(bw, 1), bh);
      }
    };
    const hy = 292, hh = 188;
    drawHist(model.histO, 24, hy, 344, hh, "Original histogram", "#64748b");
    drawHist(model.histP, 392, hy, 344, hh, "Processed histogram", PALETTE.primary);
  }, [model]);

  const explain =
    method === "Equalize"
      ? `Equalization remaps intensities so the cumulative histogram becomes roughly linear, spreading the ${model.so.range}-level input across nearly the full 0–255 range (std ${model.so.std.toFixed(1)} → ${model.sp.std.toFixed(1)}). Contrast jumps because rarely-used levels are compressed and crowded levels are pulled apart — which also amplifies any noise in flat regions.`
      : method === "Stretch"
      ? `Contrast stretching is a linear min–max map: the input's [${model.so.min}, ${model.so.max}] band is rescaled to [0, 255]. It restores the full range without reshaping the histogram, so relative spacing between levels is preserved (std ${model.so.std.toFixed(1)} → ${model.sp.std.toFixed(1)}).`
      : `Gamma ${gamma.toFixed(2)} applies s = 255·(r/255)^γ. γ<1 brightens shadows and expands dark-tone contrast; γ>1 darkens and expands highlights. Unlike equalization it is a fixed curve, independent of the image's own histogram.`;

  const pyLut =
    method === "Equalize"
      ? `cdf = hist.cumsum()
cdf_min = cdf[cdf > 0].min()
lut = np.round((cdf - cdf_min) / (img.size - cdf_min) * 255).astype(np.uint8)`
      : method === "Stretch"
      ? `lo, hi = img.min(), img.max()
lut = np.clip(np.round((np.arange(256) - lo) / max(hi - lo, 1) * 255), 0, 255).astype(np.uint8)`
      : `gamma = ${gamma}
lut = np.round(255 * (np.arange(256) / 255) ** gamma).astype(np.uint8)`;

  const code = `import numpy as np

# img: HxW uint8 grayscale (0-255).  Preset used here: "${preset}", method: "${method}"
hist, _ = np.histogram(img.flatten(), bins=256, range=(0, 256))

# transfer function (look-up table) r -> s
${pyLut}

out = lut[img]                       # apply the mapping
# (equalization shortcut: out = cv2.equalizeHist(img))
print("mean/std before", img.mean(), img.std())
print("mean/std after ", out.mean(), out.std())
print("range before", img.min(), img.max(), "-> after", out.min(), out.max())`;

  return (
    <StudioChrome title="Histogram Equalization Studio" tagline="contrast enhancement from the intensity CDF"
      controls={<div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Method</p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {(["Equalize", "Stretch", "Gamma"] as Method[]).map((m) => (
            <button key={m} onClick={() => setMethod(m)}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${method === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>
          ))}
        </div>
        <p className="mb-3 text-xs text-slate-500">Enhance a low-contrast image. Equalize spreads the intensity CDF across the full range; stretch is a linear min–max; gamma is a fixed tone curve.</p>
        <Presets
          presets={(["Low contrast", "Dark", "Bright / washed-out", "Bimodal"] as Preset[]).map((label) => ({ label }))}
          onApply={(label) => setPreset(label as Preset)}
        />
        <Slider label="Gamma (γ, Gamma mode)" value={gamma} min={0.2} max={3} step={0.05} onChange={setGamma} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Input preset" value={preset} />
        <Stat label="Method" value={method} />
        <Stat label="Mean (before → after)" value={`${model.so.mean.toFixed(0)} → ${model.sp.mean.toFixed(0)}`} />
        <Stat label="Std (before → after)" value={`${model.so.std.toFixed(1)} → ${model.sp.std.toFixed(1)}`} />
        <Stat label="Range before" value={`${model.so.min}–${model.so.max} (${model.so.range})`} />
        <Stat label="Range after" value={`${model.sp.min}–${model.sp.max} (${model.sp.range})`} />
        <Equation tex={`s_k = (L-1)\\sum_{j=0}^{k} p_r(r_j)`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
