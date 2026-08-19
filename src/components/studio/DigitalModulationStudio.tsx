"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

// ── Canvas geometry ────────────────────────────────────────────────────────
const WF_W = 760, WF_H = 170;   // time-domain waveform (top)
const CN_W = 430, CN_H = 400;   // I/Q constellation (bottom)

// bits per symbol for each scheme
const SCHEMES = ["BASK", "BFSK", "BPSK", "QPSK", "16-QAM"] as const;
type Scheme = (typeof SCHEMES)[number];
const BITS: Record<Scheme, number> = { BASK: 1, BFSK: 1, BPSK: 1, QPSK: 2, "16-QAM": 4 };

// Ideal (pre-normalization) I/Q coordinates for symbol index `idx` under `scheme`.
// Bit labels are the binary digits of `idx`; Gray mapping keeps nearest-neighbour
// symbol errors down to a single bit flip (so popcount(tx ^ rx) = bit errors).
function idealCoord(scheme: Scheme, idx: number): { I: number; Q: number } {
  switch (scheme) {
    case "BASK": return idx ? { I: 1, Q: 0 } : { I: 0, Q: 0 };       // on–off keying
    case "BFSK": return idx ? { I: 0, Q: 1 } : { I: 1, Q: 0 };       // orthogonal tones
    case "BPSK": return idx ? { I: 1, Q: 0 } : { I: -1, Q: 0 };      // antipodal
    case "QPSK": return { I: idx & 1 ? 1 : -1, Q: (idx >> 1) & 1 ? 1 : -1 };
    case "16-QAM": {
      const L = [-3, -1, 3, 1]; // 2-bit Gray → amplitude level
      return { I: L[idx & 3], Q: L[(idx >> 2) & 3] };
    }
  }
}

// Build the full, energy-normalized constellation (unit average symbol energy).
function buildConstellation(scheme: Scheme) {
  const k = BITS[scheme];
  const M = 1 << k;
  const raw: { I: number; Q: number }[] = [];
  for (let i = 0; i < M; i++) raw.push(idealCoord(scheme, i));
  const avgE = raw.reduce((s, p) => s + p.I * p.I + p.Q * p.Q, 0) / M;
  const g = 1 / Math.sqrt(avgE || 1);
  return { k, M, pts: raw.map((p) => ({ I: p.I * g, Q: p.Q * g })) };
}

// Standard normal sample (Box–Muller).
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Gaussian Q-function via erfc (Abramowitz–Stegun 7.1.26).
function qfunc(x: number): number {
  const z = x / Math.SQRT2, t = 1 / (1 + 0.3275911 * Math.abs(z));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  const erf = z >= 0 ? y : -y;
  return 0.5 * (1 - erf);
}

const PRESETS: Record<string, { ebno: number }> = {
  "Crystal clear (20 dB)": { ebno: 20 },
  "Typical link (10 dB)": { ebno: 10 },
  "Marginal (6 dB)": { ebno: 6 },
  "Breaking up (2 dB)": { ebno: 2 },
};

export function DigitalModulationStudio() {
  const wfRef = useRef<HTMLCanvasElement>(null);
  const cnRef = useRef<HTMLCanvasElement>(null);
  const [scheme, setScheme] = useState<Scheme>("QPSK");
  const [{ ebno, nsym }, update] = useShareableNumbers({ ebno: 10, nsym: 600 });
  const [tick, setTick] = useState(0);
  const [stats, setStats] = useState({ ber: 0, ser: 0, bitErr: 0, bits: 0 });

  const constellation = useMemo(() => buildConstellation(scheme), [scheme]);

  // Random transmitted symbol indices — fixed per (scheme, nsym); noise is re-rolled per tick.
  const txIdx = useMemo(() => {
    const n = Math.round(nsym);
    const arr = new Int32Array(n);
    for (let i = 0; i < n; i++) arr[i] = (Math.random() * constellation.M) | 0;
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheme, nsym, constellation.M]);

  // ── Main simulate + draw effect (re-runs on param change and each noise reroll) ──
  useEffect(() => {
    const { k, pts } = constellation;
    const ebnoLin = Math.pow(10, ebno / 10);
    // Es = 1 (normalized) ⇒ Eb = 1/k, N0 = Eb / (Eb/N0), noise variance per dim = N0/2.
    const sigma = Math.sqrt(1 / (2 * k * ebnoLin));

    // Received points + nearest-symbol decision.
    const rx = new Float32Array(txIdx.length * 2);
    let bitErr = 0, symErr = 0;
    for (let s = 0; s < txIdx.length; s++) {
      const idx = txIdx[s];
      const I = pts[idx].I + sigma * randn();
      const Q = pts[idx].Q + sigma * randn();
      rx[s * 2] = I; rx[s * 2 + 1] = Q;
      // nearest ideal point
      let best = 0, bd = Infinity;
      for (let j = 0; j < pts.length; j++) {
        const dx = I - pts[j].I, dy = Q - pts[j].Q, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = j; }
      }
      if (best !== idx) symErr++;
      let x = best ^ idx; while (x) { bitErr += x & 1; x >>= 1; } // Hamming distance = bit errors
    }
    const totalBits = txIdx.length * k;
    setStats({ ber: bitErr / totalBits, ser: symErr / txIdx.length, bitErr, bits: totalBits });

    drawWaveform(wfRef.current!, scheme, txIdx);
    drawConstellation(cnRef.current!, scheme, pts, rx, txIdx, sigma);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheme, ebno, txIdx, tick, constellation]);

  // Re-roll the AWGN noise realization periodically so the cloud stays live.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 900);
    return () => clearInterval(id);
  }, []);

  const k = constellation.k;
  const berTheory =
    scheme === "BPSK" || scheme === "QPSK" ? qfunc(Math.sqrt(2 * Math.pow(10, ebno / 10)))
      : scheme === "16-QAM" ? 0.75 * qfunc(Math.sqrt(0.8 * Math.pow(10, ebno / 10)))
        : qfunc(Math.sqrt(Math.pow(10, ebno / 10))); // BASK/BFSK coherent

  const explain =
    `${scheme} carries ${k} bit${k > 1 ? "s" : ""}/symbol. At Eb/N₀ = ${ebno} dB the noise standard deviation is ${(Math.sqrt(1 / (2 * k * Math.pow(10, ebno / 10)))).toFixed(3)} per axis, so the received cloud has ${stats.ber === 0 ? "no visible" : "some"} overlap with neighbouring decision regions. ` +
    (k >= 4
      ? "Higher-order schemes like 16-QAM pack more bits per symbol, but the points sit closer together, so at the same Eb/N₀ the noise clouds overlap sooner and the error rate climbs. Drop to QPSK or BPSK and the same noise leaves the points cleanly separated."
      : "Its widely-spaced points tolerate a lot of noise before errors appear — the price is only 1 bit per symbol. Switch to 16-QAM at the same Eb/N₀ to see the crowded points start colliding.");

  const code = `import numpy as np
import matplotlib.pyplot as plt

scheme = "${scheme}"      # BASK | BFSK | BPSK | QPSK | 16-QAM
ebno_db = ${ebno}
n_sym   = ${Math.round(nsym)}

# --- ideal constellation (unit average symbol energy) ---
def constellation(scheme):
    if scheme == "BASK": pts = [0+0j, 1+0j]
    elif scheme == "BFSK": pts = [1+0j, 1j]            # orthogonal tones
    elif scheme == "BPSK": pts = [-1+0j, 1+0j]
    elif scheme == "QPSK": pts = [complex(i, q) for q in (-1, 1) for i in (-1, 1)]
    else:  # 16-QAM, Gray-coded levels
        L = [-3, -1, 3, 1]
        pts = [complex(L[b & 3], L[(b >> 2) & 3]) for b in range(16)]
    pts = np.array(pts)
    return pts / np.sqrt(np.mean(np.abs(pts) ** 2))

pts = constellation(scheme)
k = int(np.log2(len(pts)))

# --- transmit random symbols ---
tx = np.random.randint(0, len(pts), n_sym)
sig = pts[tx]

# --- AWGN channel (Es = 1) ---
ebno = 10 ** (ebno_db / 10)
sigma = np.sqrt(1 / (2 * k * ebno))
rx = sig + sigma * (np.random.randn(n_sym) + 1j * np.random.randn(n_sym))

# --- nearest-symbol decision + bit/symbol error count ---
dec = np.argmin(np.abs(rx[:, None] - pts[None, :]), axis=1)
ser = np.mean(dec != tx)
ber = np.mean([bin(a ^ b).count("1") for a, b in zip(tx, dec)]) / k
print(f"{scheme}: SER={ser:.4f}  BER={ber:.4f}")

# --- constellation plot ---
plt.scatter(rx.real, rx.imag, s=4, alpha=0.3)
plt.scatter(pts.real, pts.imag, c="lime", marker="x")
plt.axhline(0, lw=.5); plt.axvline(0, lw=.5)
plt.title(f"{scheme} @ {ebno_db} dB"); plt.axis("equal"); plt.show()`;

  return (
    <StudioChrome title="Digital Modulation Studio" tagline="QAM / PSK constellations over an AWGN channel"
      controls={<div>
        <div className="mb-3 grid grid-cols-3 gap-1.5">{SCHEMES.map((s) => (
          <button key={s} onClick={() => setScheme(s)}
            className={`rounded-lg px-2 py-1 text-xs font-semibold ${scheme === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>
        ))}</div>
        <p className="mb-3 text-xs text-slate-500">Modulate a random bit stream, push it through a Gaussian (AWGN) channel, and decode each symbol to its nearest constellation point. Watch the noise cloud and error rate grow as Eb/N₀ drops.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Eb/N₀ (dB)" value={ebno} min={-2} max={24} step={1} onChange={(v) => update({ ebno: v })} />
        <Slider label="Symbols" value={nsym} min={100} max={2000} step={100} onChange={(v) => update({ nsym: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Scheme" value={scheme} />
        <Stat label="Bits / symbol" value={String(k)} />
        <Stat label="Constellation" value={`${constellation.M} pts`} />
        <Stat label="Eb/N₀" value={`${ebno} dB`} />
        <Stat label="Measured BER" value={stats.ber.toExponential(2)} />
        <Stat label="Measured SER" value={stats.ser.toExponential(2)} />
        <Stat label="Theory BER" value={berTheory.toExponential(2)} />
        <Stat label="Bit errors" value={`${stats.bitErr} / ${stats.bits}`} />
        <Equation tex={`s(t)=I\\cos(2\\pi f_c t)-Q\\sin(2\\pi f_c t)`} label="Passband signal" />
        <Equation tex={scheme === "16-QAM"
          ? `\\text{BER}\\approx\\tfrac{3}{4}\\,Q\\!\\left(\\sqrt{\\tfrac{4}{10}\\tfrac{E_b}{N_0}}\\right)`
          : scheme === "BPSK" || scheme === "QPSK"
            ? `\\text{BER}=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)`
            : `\\text{BER}=Q\\!\\left(\\sqrt{E_b/N_0}\\right)`} label="Bit error rate" />
        <ExplainResult text={explain} />
      </div>}
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Modulated waveform (first symbols)</p>
          <canvas ref={wfRef} width={WF_W} height={WF_H} className="h-auto w-full rounded-lg" />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Received constellation — ideal points ✕, decision boundaries dashed</p>
          <canvas ref={cnRef} width={CN_W} height={CN_H} className="mx-auto h-auto w-full max-w-[440px] rounded-lg" />
        </div>
      </div>
    </StudioChrome>
  );
}

// ── Drawing helpers ─────────────────────────────────────────────────────────

function drawWaveform(canvas: HTMLCanvasElement, scheme: Scheme, txIdx: Int32Array) {
  const ctx = hidpi(canvas, WF_W, WF_H);
  ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, WF_W, WF_H);
  const mid = WF_H / 2, amp = WF_H * 0.36;
  const nShow = Math.min(8, txIdx.length);
  const sps = 60;                 // samples per symbol
  const cyc = 2;                  // carrier cycles per symbol
  const total = nShow * sps;
  const xOf = (i: number) => (i / total) * WF_W;

  // zero axis
  ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(WF_W, mid); ctx.stroke();

  // symbol boundaries + bit labels
  ctx.font = "10px ui-monospace, monospace"; ctx.textAlign = "center";
  for (let s = 0; s <= nShow; s++) {
    const x = xOf(s * sps);
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, WF_H - 8); ctx.stroke();
    if (s < nShow) {
      const k = BITS[scheme];
      const bits = txIdx[s].toString(2).padStart(k, "0");
      ctx.fillStyle = "#64748b"; ctx.fillText(bits, xOf(s * sps + sps / 2), WF_H - 4);
    }
  }

  // waveform
  ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.8; ctx.beginPath();
  for (let i = 0; i <= total; i++) {
    const s = Math.min(nShow - 1, Math.floor(i / sps));
    const u = (i - s * sps) / sps;              // 0..1 within symbol
    const { I, Q } = idealCoord(scheme, txIdx[s]);
    const phase = 2 * Math.PI * cyc * u;
    let val: number;
    if (scheme === "BASK") val = I * Math.cos(phase);
    else if (scheme === "BFSK") val = Math.cos(2 * Math.PI * (txIdx[s] ? cyc * 2 : cyc) * u);
    else val = (I * Math.cos(phase) - Q * Math.sin(phase)) / Math.SQRT2;
    const y = mid - amp * Math.max(-1.4, Math.min(1.4, val));
    i ? ctx.lineTo(xOf(i), y) : ctx.moveTo(xOf(i), y);
  }
  ctx.stroke();
}

function drawConstellation(
  canvas: HTMLCanvasElement, scheme: Scheme,
  pts: { I: number; Q: number }[], rx: Float32Array, txIdx: Int32Array, sigma: number,
) {
  const ctx = hidpi(canvas, CN_W, CN_H);
  ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, CN_W, CN_H);
  const cx = CN_W / 2, cy = CN_H / 2;
  const R = 1.75;                                       // plot half-range (normalized units)
  const sc = (Math.min(CN_W, CN_H) / 2 - 22) / R;
  const px = (I: number) => cx + I * sc;
  const py = (Q: number) => cy - Q * sc;

  // grid + axes
  ctx.strokeStyle = "#0f1e33"; ctx.lineWidth = 1;
  for (let g = -1.5; g <= 1.5; g += 0.5) {
    ctx.beginPath(); ctx.moveTo(px(g), 0); ctx.lineTo(px(g), CN_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, py(g)); ctx.lineTo(CN_W, py(g)); ctx.stroke();
  }
  ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(CN_W, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, CN_H); ctx.stroke();

  // decision boundaries (dashed, hinted)
  ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = "#475569"; ctx.lineWidth = 1;
  const dline = (x1: number, y1: number, x2: number, y2: number) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  if (scheme === "BPSK") dline(cx, 0, cx, CN_H);
  else if (scheme === "QPSK") { dline(cx, 0, cx, CN_H); dline(0, cy, CN_W, cy); }
  else if (scheme === "BASK") { const m = px((pts[0].I + pts[1].I) / 2); dline(m, 0, m, CN_H); }
  else if (scheme === "BFSK") dline(px(-R), py(-R), px(R), py(R)); // perpendicular bisector y=x
  else if (scheme === "16-QAM") {
    const uniq = Array.from(new Set(pts.map((p) => +p.I.toFixed(4)))).sort((a, b) => a - b);
    for (let i = 0; i + 1 < uniq.length; i++) {
      const m = (uniq[i] + uniq[i + 1]) / 2;
      dline(px(m), 0, px(m), CN_H); dline(0, py(m), CN_W, py(m));
    }
  }
  ctx.restore();

  // received cloud (correct = cyan, error = red) — cap drawn points for perf
  const drawN = Math.min(rx.length / 2, 1400);
  for (let s = 0; s < drawN; s++) {
    const I = rx[s * 2], Q = rx[s * 2 + 1];
    let best = 0, bd = Infinity;
    for (let j = 0; j < pts.length; j++) { const dx = I - pts[j].I, dy = Q - pts[j].Q, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = j; } }
    ctx.fillStyle = best === txIdx[s] ? "rgba(34,211,238,0.28)" : "rgba(244,63,94,0.6)";
    ctx.beginPath(); ctx.arc(px(I), py(Q), 1.7, 0, 7); ctx.fill();
  }

  // ideal points (lime ✕ with ring)
  for (const p of pts) {
    const x = px(p.I), y = py(p.Q);
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke();
    // 1σ reference ring around one point to visualize noise scale
    ctx.strokeStyle = "rgba(163,230,53,0.18)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, sigma * sc, 0, 7); ctx.stroke();
  }
}
