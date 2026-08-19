"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 560;
const N = 512; // signal length (power of two → clean periodized decomposition)

// ── Orthonormal wavelet filters (pywt dec_lo). High-pass derived by the QMF relation,
// so analysis and synthesis (the adjoint) roundtrip to machine precision. ──
const HAAR = [Math.SQRT1_2, Math.SQRT1_2];
const DB4 = [
  -0.010597401784997278, 0.032883011666982945, 0.030841381835986965, -0.18703481171888114,
  -0.02798376941698385, 0.6308807679295904, 0.7148465705525415, 0.23037781330885523,
];
function qmfHigh(h: number[]): number[] {
  const L = h.length, g = new Array<number>(L);
  for (let k = 0; k < L; k++) g[k] = (k % 2 === 0 ? 1 : -1) * h[L - 1 - k];
  return g;
}
const FILTERS: Record<string, { h: number[]; g: number[]; py: string }> = {
  Haar: { h: HAAR, g: qmfHigh(HAAR), py: "haar" },
  db4: { h: DB4, g: qmfHigh(DB4), py: "db4" },
};

// ── One decomposition level: circular filter + downsample by 2 (Mallat pyramid). ──
function dwtStep(x: Float64Array, h: number[], g: number[]): [Float64Array, Float64Array] {
  const M = x.length, half = M >> 1, L = h.length;
  const cA = new Float64Array(half), cD = new Float64Array(half);
  for (let n = 0; n < half; n++) {
    let a = 0, d = 0;
    for (let k = 0; k < L; k++) { const v = x[(2 * n + k) % M]; a += h[k] * v; d += g[k] * v; }
    cA[n] = a; cD[n] = d;
  }
  return [cA, cD];
}
// Inverse level = adjoint of the analysis operator (exact inverse for orthonormal filters).
function idwtStep(cA: Float64Array, cD: Float64Array, h: number[], g: number[]): Float64Array {
  const half = cA.length, M = half << 1, L = h.length;
  const x = new Float64Array(M);
  for (let n = 0; n < half; n++)
    for (let k = 0; k < L; k++) { const idx = (2 * n + k) % M; x[idx] += h[k] * cA[n] + g[k] * cD[n]; }
  return x;
}
function wavedec(sig: Float64Array, h: number[], g: number[], levels: number) {
  let a = sig; const details: Float64Array[] = []; // details[0] = finest (level 1)
  for (let l = 0; l < levels; l++) { if (a.length < 2) break; const [cA, cD] = dwtStep(a, h, g); details.push(cD); a = cA; }
  return { approx: a, details };
}
function waverec(approx: Float64Array, details: Float64Array[], h: number[], g: number[]): Float64Array {
  let a = approx;
  for (let l = details.length - 1; l >= 0; l--) a = idwtStep(a, details[l], h, g);
  return a;
}
function thresholdArr(arr: Float64Array, t: number, soft: boolean): Float64Array {
  const out = new Float64Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    const x = arr[i], ax = Math.abs(x);
    out[i] = soft ? Math.sign(x) * Math.max(ax - t, 0) : (ax > t ? x : 0);
  }
  return out;
}
function relErr(a: Float64Array, b: Float64Array): number {
  let n = 0, d = 0;
  for (let i = 0; i < a.length; i++) { n += (a[i] - b[i]) ** 2; d += b[i] ** 2; }
  return Math.sqrt(n / (d || 1));
}

// ── Signal synthesis (clean component + reproducible Gaussian noise). ──
function mulberry32(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(rng: () => number) { let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

const SPIKE_IDX = [80, 200, 350, 440];
const SPIKE_AMP = [1.2, -1.4, 1.0, -1.1];
const PRESETS = ["piecewise", "chirp", "spikes", "noisy"] as const;
type Preset = (typeof PRESETS)[number];
const NOISE: Record<Preset, number> = { piecewise: 0.13, chirp: 0.13, spikes: 0.08, noisy: 0.42 };

function cleanSignal(preset: Preset): Float64Array {
  const s = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / N;
    if (preset === "piecewise") s[i] = t < 0.2 ? 0.2 : t < 0.4 ? 0.8 : t < 0.5 ? 0.3 : t < 0.7 ? 0.9 : t < 0.85 ? 0.1 : 0.5;
    else if (preset === "chirp") s[i] = Math.sin(2 * Math.PI * (5 + 40 * t) * t);
    else if (preset === "spikes") s[i] = 0.5 * Math.sin(2 * Math.PI * 3 * t);
    else s[i] = Math.sin(2 * Math.PI * 2 * t) + 0.5 * Math.sin(2 * Math.PI * 5 * t);
  }
  if (preset === "spikes") SPIKE_IDX.forEach((idx, k) => { s[idx] += SPIKE_AMP[k]; });
  return s;
}
function genSignal(preset: Preset): { clean: Float64Array; noisy: Float64Array } {
  const clean = cleanSignal(preset);
  const noisy = new Float64Array(N);
  const rng = mulberry32(1337);
  const a = NOISE[preset];
  for (let i = 0; i < N; i++) noisy[i] = clean[i] + a * gauss(rng);
  return { clean, noisy };
}
const CLEAN_PY: Record<Preset, string> = {
  piecewise: "sig = np.select([t<0.2, t<0.4, t<0.5, t<0.7, t<0.85, t>=0.85], [0.2, 0.8, 0.3, 0.9, 0.1, 0.5])",
  chirp: "sig = np.sin(2*np.pi*(5 + 40*t)*t)",
  spikes: "sig = 0.5*np.sin(2*np.pi*3*t)\nsig[[80, 200, 350, 440]] += [1.2, -1.4, 1.0, -1.1]",
  noisy: "sig = np.sin(2*np.pi*2*t) + 0.5*np.sin(2*np.pi*5*t)",
};

// Magnitude colormap: bg-navy → cyan → lime → amber.
function magColor(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  const stops = [[6, 12, 30], [34, 211, 238], [163, 230, 53], [245, 158, 11]];
  const seg = x * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(seg)), f = seg - i;
  const A = stops[i], B = stops[i + 1];
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * f)},${Math.round(A[1] + (B[1] - A[1]) * f)},${Math.round(A[2] + (B[2] - A[2]) * f)})`;
}

export function WaveletStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ preset, wavelet, levels, threshold, soft }, update] = useShareableNumbers({
    preset: 3, wavelet: 1, levels: 4, threshold: 0.3, soft: 1,
  });
  const presetName = PRESETS[Math.max(0, Math.min(PRESETS.length - 1, Math.round(preset)))];
  const waveletName = wavelet >= 0.5 ? "db4" : "Haar";
  const isSoft = soft >= 0.5;
  const nLevels = Math.max(1, Math.min(7, Math.round(levels)));

  const result = useMemo(() => {
    const { clean, noisy } = genSignal(presetName);
    const { h, g } = FILTERS[waveletName];
    const { approx, details } = wavedec(noisy, h, g, nLevels);

    // Roundtrip check (no thresholding) — proves the transform is invertible.
    const roundtrip = relErr(waverec(approx, details, h, g), noisy);

    const detailsThr = details.map((d) => thresholdArr(d, threshold, isSoft));
    const denoised = waverec(approx, detailsThr, h, g);

    let total = 0, kept = 0, gmax = 1e-9;
    for (let l = 0; l < details.length; l++) for (let i = 0; i < details[l].length; i++) {
      total++; if (detailsThr[l][i] !== 0) kept++;
      const a = Math.abs(details[l][i]); if (a > gmax) gmax = a;
    }
    const keptPct = total ? (kept / total) * 100 : 100;
    const reconErr = relErr(denoised, clean) * 100; // vs the true underlying (noise-free) signal

    return { clean, noisy, approx, details, detailsThr, denoised, roundtrip, keptPct, reconErr, gmax };
  }, [presetName, waveletName, nLevels, threshold, isSoft]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "middle";

    const { noisy, denoised, details, detailsThr, gmax } = result;

    // ── Panel A: signal, original vs denoised ──
    const sx = 12, sw = W - 24, sy = 26, sh = 130;
    let lo = Infinity, hi = -Infinity;
    for (const arr of [noisy, denoised]) for (const v of arr) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
    const yv = (v: number) => sy + sh - ((v - lo) / (hi - lo)) * sh;
    ctx.fillStyle = "#0b1220"; ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) { const gy = sy + (sh * k) / 4; ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx + sw, gy); ctx.stroke(); }
    const plot = (arr: Float64Array, color: string, lw: number) => {
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
      for (let i = 0; i < arr.length; i++) { const px = sx + (i / (arr.length - 1)) * sw, py = yv(arr[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    };
    plot(noisy, "rgba(34,211,238,0.55)", 1);   // original / noisy input
    plot(denoised, "#a3e635", 1.8);            // denoised reconstruction
    ctx.font = "11px ui-sans-serif, system-ui"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#94a3b8"; ctx.fillText("Signal — original vs denoised reconstruction", sx, sy - 9);
    ctx.fillStyle = "rgba(34,211,238,0.9)"; ctx.fillText("● input", sx + sw - 120, sy - 9);
    ctx.fillStyle = "#a3e635"; ctx.fillText("● denoised", sx + sw - 62, sy - 9);
    ctx.textBaseline = "middle";

    // ── Panel B: scalogram — |detail coeff| across scale & position; killed cells go dark ──
    const gy0 = sy + sh + 34;
    ctx.font = "11px ui-sans-serif, system-ui"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#94a3b8"; ctx.fillText("Wavelet scalogram — detail coefficients by scale & position (dark = thresholded away)", sx, gy0 - 9);
    ctx.textBaseline = "middle";
    const nRows = details.length;
    const rowH = Math.min(46, (H - gy0 - 16) / nRows);
    const labelW = 78, plotX = sx + labelW, plotW = sw - labelW;
    for (let l = 0; l < nRows; l++) {
      const rowY = gy0 + l * rowH;
      const d = details[l], dt = detailsThr[l], len = d.length;
      const cellW = plotW / len;
      for (let i = 0; i < len; i++) {
        const mag = Math.abs(d[i]) / gmax;
        ctx.fillStyle = dt[i] === 0 ? "#0b1220" : magColor(Math.sqrt(mag));
        ctx.fillRect(plotX + i * cellW, rowY + 1, Math.ceil(cellW), rowH - 2);
      }
      ctx.strokeStyle = "#020617"; ctx.lineWidth = 1; ctx.strokeRect(plotX, rowY + 1, plotW, rowH - 2);
      ctx.fillStyle = "#cbd5e1"; ctx.font = "11px ui-sans-serif, system-ui";
      const label = `D${l + 1}${l === 0 ? " (fine)" : l === nRows - 1 ? " (coarse)" : ""}`;
      ctx.fillText(label, sx, rowY + rowH / 2);
      ctx.fillStyle = "#64748b"; ctx.font = "9px ui-sans-serif, system-ui";
      ctx.fillText(`${len} coeffs`, sx, rowY + rowH / 2 + 12);
    }
  }, [result]);

  const { keptPct, reconErr, roundtrip } = result;
  const explain =
    threshold <= 0
      ? `With no threshold, every coefficient is kept, so the inverse transform reproduces the input to machine precision (roundtrip error ${roundtrip.toExponential(1)}). This confirms the DWT is a true, invertible change of basis.`
      : `Thresholding zeroed the small detail coefficients — these mostly encode noise, which spreads thinly across all coefficients, while genuine edges and features concentrate into a few large ones. Keeping just ${keptPct.toFixed(0)}% of the detail coefficients reconstructs the underlying signal with ${reconErr.toFixed(1)}% relative error. Push the threshold too high and you start erasing real structure, not just noise.`;

  const code = `import numpy as np, pywt

# --- signal ---
N = ${N}
t = np.linspace(0, 1, N, endpoint=False)
${CLEAN_PY[presetName]}
rng = np.random.default_rng(1337)
sig = sig + ${NOISE[presetName]}*rng.standard_normal(N)

# --- multi-level DWT (Mallat filter bank) ---
wavelet, levels = "${FILTERS[waveletName].py}", ${nLevels}
coeffs = pywt.wavedec(sig, wavelet, level=levels, mode="periodization")
# coeffs = [cA_n, cD_n, ..., cD_1]

# --- denoise: threshold the DETAIL coefficients, keep the approximation ---
thr = ${threshold}
coeffs[1:] = [pywt.threshold(c, thr, mode="${isSoft ? "soft" : "hard"}") for c in coeffs[1:]]

# --- inverse DWT ---
denoised = pywt.waverec(coeffs, wavelet, mode="periodization")

kept = sum(int(np.count_nonzero(c)) for c in coeffs[1:])
print("relative reconstruction error", np.linalg.norm(denoised - sig) / np.linalg.norm(sig))
print("detail coefficients kept", kept)`;

  return (
    <StudioChrome title="Wavelet Transform Studio" tagline="multiresolution analysis & denoising"
      controls={<div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Signal</p>
        <div className="mb-3 grid grid-cols-2 gap-1.5">{PRESETS.map((s, i) => <button key={s} onClick={() => update({ preset: i })} className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${presetName === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>)}</div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Wavelet</p>
        <div className="mb-3 grid grid-cols-2 gap-1.5">{["Haar", "db4"].map((w) => <button key={w} onClick={() => update({ wavelet: w === "db4" ? 1 : 0 })} className={`rounded-lg px-2 py-1 text-xs font-semibold ${waveletName === w ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{w}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Decompose a signal into scales with a real DWT, then threshold the detail coefficients to denoise it. Watch the scalogram lose its faint noise while the strong edges survive.</p>
        <Presets
          presets={[{ label: "No threshold (roundtrip)", hint: "Keep all coeffs — inverse DWT reproduces the input" }, { label: "Light denoise" }, { label: "Aggressive denoise" }, { label: "Erase structure", hint: "Threshold so high real features vanish" }]}
          onApply={(label) => update({ threshold: label === "No threshold (roundtrip)" ? 0 : label === "Light denoise" ? 0.12 : label === "Aggressive denoise" ? 0.6 : 1.1 })}
        />
        <Slider label="Decomposition levels" value={nLevels} min={1} max={7} step={1} onChange={(v) => update({ levels: v })} />
        <Slider label="Threshold" value={threshold} min={0} max={1.5} step={0.01} onChange={(v) => update({ threshold: v })} />
        <div className="mb-3 grid grid-cols-2 gap-1.5">{["soft", "hard"].map((m) => <button key={m} onClick={() => update({ soft: m === "soft" ? 1 : 0 })} className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${(isSoft ? "soft" : "hard") === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m} threshold</button>)}</div>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Wavelet" value={waveletName} />
        <Stat label="Levels" value={`${nLevels}`} />
        <Stat label="Coeffs kept" value={`${keptPct.toFixed(0)}%`} />
        <Stat label="Recon error" value={`${reconErr.toFixed(1)}%`} />
        <Stat label="Roundtrip" value={roundtrip.toExponential(1)} />
        <Equation tex={`a_{j+1}[k]=\\sum_n h[n-2k]\\,a_j[n],\\;\\; d_{j+1}[k]=\\sum_n g[n-2k]\\,a_j[n]`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
