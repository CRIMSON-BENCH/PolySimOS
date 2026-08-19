"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, PALETTE, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;
const N_SYM = 100;      // number of transmitted symbols
const SPAN = 6;         // raised-cosine filter half-length, in symbols

type Shape = "nrz" | "rc";

// Gaussian sample (Box–Muller).
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Raised-cosine impulse response tap at normalised time x = t/T (T = symbol period).
// h(x) = sinc(x) * cos(πβx) / (1 - (2βx)^2), with the removable singularity at
// x = ±1/(2β) filled by its limit (π/4)·sinc(x).
function rcTap(x: number, beta: number): number {
  const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
  if (beta <= 0) return sinc; // β=0 → ideal sinc (Nyquist brick-wall)
  const denom = 1 - (2 * beta * x) * (2 * beta * x);
  const ratio = Math.abs(denom) < 1e-6 ? Math.PI / 4 : Math.cos(Math.PI * beta * x) / denom;
  return sinc * ratio;
}

const PRESETS: Record<string, { shape: Shape; beta: number; noise: number; jitter: number; sps: number }> = {
  "Open eye (RC β=1)": { shape: "rc", beta: 1, noise: 0.03, jitter: 0, sps: 32 },
  "Textbook RC (β=0.35)": { shape: "rc", beta: 0.35, noise: 0.05, jitter: 0.03, sps: 32 },
  "Noise + jitter (closing)": { shape: "rc", beta: 0.35, noise: 0.2, jitter: 0.22, sps: 32 },
  "Rectangular NRZ": { shape: "nrz", beta: 0.35, noise: 0.05, jitter: 0.05, sps: 32 },
};

export function EyeDiagramStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shape, setShape] = useState<Shape>("rc");
  const [{ beta, noise, jitter, sps: spsRaw }, update] = useShareableNumbers({ beta: 0.35, noise: 0.05, jitter: 0.03, sps: 32 });
  const sps = Math.max(8, Math.round(spsRaw));

  // Build the received waveform and slice it into clock-aligned 2-symbol eye traces.
  const sim = useMemo(() => {
    const Nsig = N_SYM * sps;
    const rx = new Float32Array(Nsig);
    // Random 2-PAM / NRZ symbols: ±1.
    const sym = new Float32Array(N_SYM);
    for (let k = 0; k < N_SYM; k++) sym[k] = Math.random() < 0.5 ? -1 : 1;

    if (shape === "rc") {
      // Pulse-shape by summing a raised-cosine pulse per symbol (impulse train ⊛ h).
      // The RC pulse is the combined transmit + bandlimited-channel Nyquist response.
      const taps = 2 * SPAN * sps + 1;
      const h = new Float32Array(taps);
      for (let m = 0; m < taps; m++) h[m] = rcTap((m - SPAN * sps) / sps, beta);
      for (let k = 0; k < N_SYM; k++) {
        const base = k * sps, s = sym[k];
        for (let m = 0; m < taps; m++) {
          const n = base + (m - SPAN * sps);
          if (n >= 0 && n < Nsig) rx[n] += s * h[m];
        }
      }
    } else {
      // Rectangular NRZ: hold each symbol level for one symbol period, centred on k·sps.
      for (let k = 0; k < N_SYM; k++) {
        const c = k * sps, s = sym[k];
        for (let n = c - (sps >> 1); n < c + (sps - (sps >> 1)); n++) if (n >= 0 && n < Nsig) rx[n] = s;
      }
      // Bandlimited channel: symmetric moving average rounds the edges → intersymbol interference.
      const La = Math.max(1, Math.round(0.25 * sps)) | 1, half = La >> 1;
      const src = rx.slice();
      for (let n = 0; n < Nsig; n++) {
        let acc = 0, cnt = 0;
        for (let j = -half; j <= half; j++) { const i = n + j; if (i >= 0 && i < Nsig) { acc += src[i]; cnt++; } }
        rx[n] = acc / cnt;
      }
    }

    // Additive Gaussian noise.
    if (noise > 0) for (let n = 0; n < Nsig; n++) rx[n] += noise * randn();

    // Extract eye traces: 2-symbol windows centred on each symbol clock, with timing jitter.
    const L = 2 * sps + 1, c = sps; // center index c = ideal sampling instant
    const traces: Float32Array[] = [];
    for (let k = 3; k < N_SYM - 3; k++) {
      const shift = jitter > 0 ? Math.round(jitter * sps * randn()) : 0;
      const start = k * sps - sps + shift;
      if (start < 0 || start + L > Nsig) continue;
      const seg = new Float32Array(L);
      for (let i = 0; i < L; i++) seg[i] = rx[start + i];
      traces.push(seg);
    }

    // --- Metrics at the ideal sampling instant (index c) ---
    let posMin = Infinity, negMax = -Infinity;
    for (const t of traces) {
      const v = t[c];
      if (v > 0) posMin = Math.min(posMin, v);
      else negMax = Math.max(negMax, v);
    }
    const eyeHeight = (isFinite(posMin) && isFinite(negMax)) ? posMin - negMax : 0;

    // Eye width: inner zero crossings bounding the central opening.
    let leftMax = 0, rightMin = L - 1;
    for (const t of traces) {
      for (let i = 0; i < L - 1; i++) {
        if (t[i] === 0 || (t[i] < 0) !== (t[i + 1] < 0)) {
          const cross = t[i] === t[i + 1] ? i : i + t[i] / (t[i] - t[i + 1]);
          if (cross < c) leftMax = Math.max(leftMax, cross);
          else if (cross > c) rightMin = Math.min(rightMin, cross);
        }
      }
    }
    const eyeWidth = Math.max(0, rightMin - leftMax) / sps; // as a fraction of the symbol period

    // Estimated SNR margin: half the vertical opening relative to the noise floor.
    const A = eyeHeight / 2;
    const nStd = noise > 0 ? noise : 1e-6;
    const snr = A > 0 ? Math.min(60, 20 * Math.log10(A / nStd)) : -20;

    return { traces, L, c, eyeHeight, eyeWidth, snr };
  }, [shape, beta, noise, jitter, sps]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    const { traces, L, c, eyeHeight, eyeWidth } = sim;
    const padX = 46, padTop = 20, padBot = 30;
    const ampMax = 1.6;
    const x = (o: number) => padX + (o / (L - 1)) * (W - 2 * padX);
    const y = (v: number) => (padTop + (H - padTop - padBot) / 2) - v * ((H - padTop - padBot) / 2) / ampMax;

    // Background.
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);

    // Gridlines at ±1, 0.
    ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1;
    for (const lv of [1, 0, -1]) {
      ctx.beginPath(); ctx.moveTo(padX, y(lv)); ctx.lineTo(W - padX, y(lv)); ctx.stroke();
    }
    ctx.fillStyle = PALETTE.text; ctx.font = "11px ui-monospace, monospace";
    ctx.fillText("+1", 8, y(1) + 4); ctx.fillText(" 0", 10, y(0) + 4); ctx.fillText("−1", 8, y(-1) + 4);

    // Overlaid eye traces (transparency builds the classic density plot).
    ctx.strokeStyle = "rgba(34,211,238,0.22)"; ctx.lineWidth = 1;
    for (const t of traces) {
      ctx.beginPath();
      for (let i = 0; i < L; i++) i ? ctx.lineTo(x(i), y(t[i])) : ctx.moveTo(x(i), y(t[i]));
      ctx.stroke();
    }

    // Ideal sampling instant.
    ctx.strokeStyle = PALETTE.accent; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(x(c), padTop); ctx.lineTo(x(c), H - padBot); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PALETTE.accent; ctx.fillText("ideal sample", x(c) - 30, H - padBot + 18);

    // Eye height marker (vertical opening at the sampling instant).
    if (eyeHeight > 0) {
      const yTop = y(negMax(sim)), yBot = y(posMinNeg(sim));
      ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2;
      const hx = x(c) + 14;
      ctx.beginPath(); ctx.moveTo(hx, yTop); ctx.lineTo(hx, yBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx - 4, yTop); ctx.lineTo(hx + 4, yTop); ctx.moveTo(hx - 4, yBot); ctx.lineTo(hx + 4, yBot); ctx.stroke();
      ctx.fillStyle = "#f472b6"; ctx.fillText("h", hx + 7, (yTop + yBot) / 2 + 4);
    }

    // Eye width marker (horizontal opening at the decision threshold).
    if (eyeWidth > 0) {
      const wl = x(c - (eyeWidth * sps) / 2), wr = x(c + (eyeWidth * sps) / 2), wy = y(0) - 0;
      ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(wl, wy); ctx.lineTo(wr, wy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wl, wy - 4); ctx.lineTo(wl, wy + 4); ctx.moveTo(wr, wy - 4); ctx.lineTo(wr, wy + 4); ctx.stroke();
      ctx.fillStyle = "#f59e0b"; ctx.fillText("w", (wl + wr) / 2 - 3, wy - 8);
    }
  }, [sim]);

  const shapeName = shape === "rc" ? "raised-cosine" : "rectangular NRZ";
  const explain =
    sim.eyeHeight <= 0.05
      ? `The eye is essentially closed: at the ideal sampling instant the +1 and −1 traces overlap, so any decision threshold makes errors. Reduce noise/jitter or raise the roll-off β to reopen it.`
      : `A wide-open eye means easy, low-error detection — the +1 and −1 levels are cleanly separated at the sampling instant. Here the eye height is ${sim.eyeHeight.toFixed(2)} (of a possible 2) and the eye width is ${(sim.eyeWidth * 100).toFixed(0)}% of the symbol period. ISI, noise, and timing jitter all close the eye; raised-cosine shaping trades bandwidth (larger β) for less ISI, and a higher β widens the eye.`;

  const code = `import numpy as np
import matplotlib.pyplot as plt

sps   = ${sps}          # samples per symbol
beta  = ${beta}        # raised-cosine roll-off
noise = ${noise}
shape = "${shape}"    # "rc" (raised-cosine) or "nrz"
nsym, span = ${N_SYM}, ${SPAN}

sym = np.where(np.random.rand(nsym) < 0.5, -1.0, 1.0)   # 2-PAM / NRZ
imp = np.zeros(nsym * sps); imp[::sps] = sym            # impulse train

if shape == "rc":
    t = np.arange(-span*sps, span*sps + 1) / sps
    sinc  = np.sinc(t)
    denom = 1 - (2*beta*t)**2
    ratio = np.divide(np.cos(np.pi*beta*t), denom,
                      out=np.full_like(t, np.pi/4), where=np.abs(denom) > 1e-6)
    h  = sinc * ratio                                   # raised-cosine pulse
    rx = np.convolve(imp, h, mode="same")
else:
    box = np.ones(sps)
    rx  = np.convolve(imp, box, mode="same")            # rectangular NRZ
    La  = max(1, round(0.25*sps)) | 1                   # bandlimited channel
    rx  = np.convolve(rx, np.ones(La)/La, mode="same")

rx += noise * np.random.randn(len(rx))                  # additive noise

# Eye diagram: overlay 2-symbol windows aligned to the symbol clock.
plt.style.use("dark_background")
L = 2*sps
for k in range(3, nsym - 3):
    seg = rx[k*sps - sps : k*sps + sps + 1]
    plt.plot(np.arange(len(seg)), seg, color="cyan", alpha=0.15)
plt.axvline(sps, color="yellow", ls="--")               # ideal sampling instant
plt.title("Eye diagram"); plt.xlabel("sample"); plt.ylabel("amplitude")
plt.show()`;

  return (
    <StudioChrome title="Eye Diagram Studio" tagline="digital comms signal integrity"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          {(["rc", "nrz"] as Shape[]).map((s) => (
            <button key={s} onClick={() => setShape(s)}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${shape === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>
              {s === "rc" ? "Raised-cosine" : "NRZ (rect)"}
            </button>
          ))}
        </div>
        <p className="mb-3 text-xs text-slate-500">Overlay many received traces aligned to the symbol clock. A wide-open eye = easy detection; ISI, noise, and jitter close it.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => { const p = PRESETS[label]; setShape(p.shape); update({ beta: p.beta, noise: p.noise, jitter: p.jitter, sps: p.sps }); }}
        />
        <Slider label="Roll-off β" value={beta} min={0} max={1} step={0.05} onChange={(v) => update({ beta: v })} />
        <Slider label="Noise σ" value={noise} min={0} max={0.4} step={0.01} onChange={(v) => update({ noise: v })} />
        <Slider label="Timing jitter" value={jitter} min={0} max={0.3} step={0.01} onChange={(v) => update({ jitter: v })} />
        <Slider label="Samples / symbol" value={sps} min={8} max={64} step={4} onChange={(v) => update({ sps: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Pulse shape" value={shapeName} />
        <Stat label="Eye height" value={`${sim.eyeHeight.toFixed(2)} / 2`} />
        <Stat label="Eye width" value={`${(sim.eyeWidth * 100).toFixed(0)}% of T`} />
        <Stat label="SNR margin" value={`${sim.snr.toFixed(1)} dB`} />
        <Stat label="Roll-off β" value={shape === "rc" ? beta.toFixed(2) : "—"} />
        <Equation tex={`H(f)=\\begin{cases}T & |f|\\le\\frac{1-\\beta}{2T}\\\\ \\frac{T}{2}\\!\\left[1+\\cos\\frac{\\pi T}{\\beta}\\!\\left(|f|-\\frac{1-\\beta}{2T}\\right)\\right] & \\frac{1-\\beta}{2T}<|f|\\le\\frac{1+\\beta}{2T}\\\\ 0 & \\text{otherwise}\\end{cases}`} label="Raised-cosine spectrum" />
        <Equation tex={`p(kT)=\\begin{cases}1 & k=0\\\\ 0 & k\\neq 0\\end{cases}\\quad\\text{(zero-ISI Nyquist condition)}`} label="Nyquist ISI-free criterion" />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}

// Helpers for the eye-height bracket: the inner edges of the two level clusters at the sample instant.
function posMinNeg(sim: { traces: Float32Array[]; c: number }): number {
  let posMin = Infinity;
  for (const t of sim.traces) { const v = t[sim.c]; if (v > 0) posMin = Math.min(posMin, v); }
  return isFinite(posMin) ? posMin : 0;
}
function negMax(sim: { traces: Float32Array[]; c: number }): number {
  let m = -Infinity;
  for (const t of sim.traces) { const v = t[sim.c]; if (v <= 0) m = Math.max(m, v); }
  return isFinite(m) ? m : 0;
}
