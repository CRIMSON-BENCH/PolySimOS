"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, PALETTE, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;
const DB_MIN = 0, DB_MAX = 18;                // Eb/N0 axis range (dB)
const LOG_FLOOR = -6;                          // BER axis: 1e-6 .. 1e0
const SIM_DBS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]; // where Monte-Carlo dots land

// --- Q-function via a self-contained erfc (Numerical-Recipes erfcc, err < 1.2e-7) ---
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + z / 2);
  const ans =
    t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
      t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? ans : 2 - ans;
}
const Q = (x: number) => 0.5 * erfc(x / Math.SQRT2);

// Approximate square-M-QAM BER (Gray-coded), Eb/N0 = g (linear).
const qamBER = (M: number) => {
  const k = Math.log2(M);
  return (g: number) => (4 / k) * (1 - 1 / Math.sqrt(M)) * Q(Math.sqrt((3 * k) / (M - 1) * g));
};

type Scheme = { name: string; color: string; bits: number; theory: (g: number) => number; kind: "bpsk" | "qam" | "bfsk"; M?: number };
const SCHEMES: Scheme[] = [
  { name: "BPSK/QPSK", color: PALETTE.series[0], bits: 1, kind: "bpsk", theory: (g) => Q(Math.sqrt(2 * g)) },
  { name: "16-QAM", color: PALETTE.series[1], bits: 4, kind: "qam", M: 16, theory: qamBER(16) },
  { name: "64-QAM", color: PALETTE.series[2], bits: 6, kind: "qam", M: 64, theory: qamBER(64) },
  { name: "BFSK", color: PALETTE.series[3], bits: 1, kind: "bfsk", theory: (g) => Q(Math.sqrt(g)) },
];
const byName = (n: string) => SCHEMES.find((s) => s.name === n)!;

// Standard normal sample (Box-Muller).
function gauss(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const gray = (x: number) => x ^ (x >> 1);
const popcount = (x: number) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };

// --- Monte-Carlo BER estimators (transmit random bits, add AWGN, detect, count errors) ---
function simBPSK(g: number, nBits: number): number {
  const sigma = Math.sqrt(1 / (2 * g)); // Eb = 1, N0 = 1/g, var = N0/2
  let err = 0;
  for (let i = 0; i < nBits; i++) {
    const s = Math.random() < 0.5 ? 1 : -1;
    const r = s + sigma * gauss();
    if ((r >= 0 ? 1 : -1) !== s) err++;
  }
  return err / nBits;
}
function simBFSK(g: number, nBits: number): number {
  const sigma = Math.sqrt(1 / (2 * g)); // coherent orthogonal, Eb = 1
  let err = 0;
  for (let i = 0; i < nBits; i++) {
    const rSent = 1 + sigma * gauss();  // correct tone
    const rOther = 0 + sigma * gauss(); // silent tone
    if (rOther > rSent) err++;
  }
  return err / nBits;
}
function simQAM(M: number, g: number, nBits: number): number {
  const L = Math.sqrt(M);                 // levels per I/Q dimension
  const bitsPerDim = Math.log2(L);
  const k = Math.log2(M);
  const Es = (2 * (M - 1)) / 3;           // avg symbol energy for {±1,±3,…} constellation
  const N0 = Es / k / g;                  // Eb = Es/k, Eb/N0 = g
  const sigma = Math.sqrt(N0 / 2);
  const nDims = Math.max(1, Math.floor(nBits / bitsPerDim)); // I and Q share identical stats
  let err = 0;
  for (let i = 0; i < nDims; i++) {
    const j = Math.floor(Math.random() * L);
    const coord = 2 * j - (L - 1);
    const r = coord + sigma * gauss();
    let jhat = Math.round((r + (L - 1)) / 2);
    if (jhat < 0) jhat = 0; else if (jhat > L - 1) jhat = L - 1;
    err += popcount(gray(j) ^ gray(jhat));
  }
  return err / (nDims * bitsPerDim);
}
function simulate(s: Scheme, g: number, nBits: number): number {
  if (s.kind === "bpsk") return simBPSK(g, nBits);
  if (s.kind === "bfsk") return simBFSK(g, nBits);
  return simQAM(s.M!, g, nBits);
}

// Eb/N0 (dB) required to reach a target BER on a theoretical curve (for coding-gain readout).
function requiredDb(theory: (g: number) => number, target: number): number | null {
  for (let db = DB_MIN; db <= 40; db += 0.1) {
    if (theory(10 ** (db / 10)) <= target) return db;
  }
  return null;
}

const PRESETS: Record<string, { schemes: string[]; marker: number }> = {
  "All schemes": { schemes: ["BPSK/QPSK", "16-QAM", "64-QAM", "BFSK"], marker: 10 },
  "QAM family": { schemes: ["16-QAM", "64-QAM"], marker: 14 },
  "BPSK vs 64-QAM": { schemes: ["BPSK/QPSK", "64-QAM"], marker: 12 },
  "FSK vs PSK": { schemes: ["BPSK/QPSK", "BFSK"], marker: 8 },
};

export function BERSNRStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ bits, marker }, update] = useShareableNumbers({ bits: 20000, marker: 10 });
  const [active, setActive] = useState<string[]>(["BPSK/QPSK", "16-QAM", "64-QAM", "BFSK"]);
  const [reseed, setReseed] = useState(0);

  const activeKey = [...active].sort().join(",");

  // Monte-Carlo overlay: one BER estimate per scheme at each SIM_DB (re-rolled on reseed).
  const sim = useMemo(() => {
    const out: Record<string, [number, number][]> = {};
    for (const name of active) {
      const s = byName(name);
      out[name] = SIM_DBS.map((db) => [db, simulate(s, 10 ** (db / 10), Math.round(bits))]);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, bits, reseed]);

  // Re-roll the noise every few seconds so the dots visibly shimmer around theory.
  useEffect(() => { const id = setInterval(() => setReseed((r) => r + 1), 2500); return () => clearInterval(id); }, []);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.bg; ctx.fillRect(0, 0, W, H);

    const mL = 56, mR = 16, mT = 18, mB = 40;
    const pW = W - mL - mR, pH = H - mT - mB;
    const xToPx = (db: number) => mL + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * pW;
    const yToPx = (ber: number) => {
      const lb = Math.max(LOG_FLOOR, Math.min(0, Math.log10(ber)));
      return mT + (-lb / -LOG_FLOOR) * pH;
    };

    // Grid + axes
    ctx.font = "11px ui-monospace, monospace";
    ctx.textBaseline = "middle";
    for (let d = 0; d >= LOG_FLOOR; d--) {
      const y = yToPx(10 ** d);
      ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mL, y); ctx.lineTo(W - mR, y); ctx.stroke();
      ctx.fillStyle = PALETTE.text; ctx.textAlign = "right";
      ctx.fillText(`10${d === 0 ? "⁰" : superMinus(d)}`, mL - 6, y);
    }
    ctx.textBaseline = "top"; ctx.textAlign = "center";
    for (let db = DB_MIN; db <= DB_MAX; db += 2) {
      const x = xToPx(db);
      ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, mT); ctx.lineTo(x, mT + pH); ctx.stroke();
      ctx.fillStyle = PALETTE.text; ctx.fillText(String(db), x, mT + pH + 6);
    }
    ctx.fillStyle = PALETTE.text; ctx.textAlign = "center";
    ctx.fillText("Eb/N0  (dB)", mL + pW / 2, mT + pH + 22);
    ctx.save(); ctx.translate(14, mT + pH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("Bit Error Rate", 0, 0); ctx.restore();

    // Axis border
    ctx.strokeStyle = PALETTE.axis; ctx.lineWidth = 1.2;
    ctx.strokeRect(mL, mT, pW, pH);

    // Marker line
    const mx = xToPx(marker);
    ctx.strokeStyle = "#e2e8f0"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx, mT); ctx.lineTo(mx, mT + pH); ctx.stroke();
    ctx.setLineDash([]);

    // Per-scheme: smooth theory curve + Monte-Carlo dots + marker read-off
    for (const name of active) {
      const s = byName(name);
      ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.beginPath();
      let started = false;
      for (let db = DB_MIN; db <= DB_MAX; db += 0.25) {
        const ber = s.theory(10 ** (db / 10));
        if (ber < 10 ** LOG_FLOOR) { started = false; continue; }
        const x = xToPx(db), y = yToPx(ber);
        started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true;
      }
      ctx.stroke();

      // simulated dots
      ctx.fillStyle = s.color;
      for (const [db, ber] of sim[name] ?? []) {
        if (ber <= 0 || ber < 10 ** LOG_FLOOR || db > DB_MAX) continue;
        const x = xToPx(db), y = yToPx(ber);
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
        ctx.strokeStyle = PALETTE.bg; ctx.lineWidth = 1; ctx.stroke();
      }

      // marker dot
      const mb = s.theory(10 ** (marker / 10));
      if (mb >= 10 ** LOG_FLOOR) {
        ctx.fillStyle = s.color; ctx.beginPath();
        ctx.arc(mx, yToPx(mb), 4.5, 0, 7); ctx.fill();
        ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1.4; ctx.stroke();
      }
    }

    // Legend
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = "11px ui-monospace, monospace";
    let ly = mT + 12;
    ctx.fillStyle = "rgba(2,6,23,0.6)"; ctx.fillRect(mL + pW - 118, mT + 4, 112, active.length * 16 + 20);
    ctx.fillStyle = PALETTE.text; ctx.fillText("line=theory · dot=sim", mL + pW - 112, ly); ly += 16;
    for (const name of active) {
      const s = byName(name);
      ctx.strokeStyle = s.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(mL + pW - 112, ly); ctx.lineTo(mL + pW - 92, ly); ctx.stroke();
      ctx.fillStyle = "#cbd5e1"; ctx.fillText(name, mL + pW - 86, ly); ly += 16;
    }
  }, [active, activeKey, sim, marker]);

  const gLin = 10 ** (marker / 10);
  const berBPSK = byName("BPSK/QPSK").theory(gLin);
  const target = 1e-4;
  const reqBPSK = requiredDb(byName("BPSK/QPSK").theory, target);

  const explain = `Each curve is a "waterfall": BER falls steeply once Eb/N0 clears a threshold. BPSK/QPSK is the most robust — its bits are the farthest apart. Packing more bits per symbol (16-QAM, then 64-QAM) crowds the constellation, so those schemes need several extra dB of Eb/N0 to hit the same BER. That is the core rate-vs-reliability trade: higher-order QAM carries more data per hertz but demands a cleaner channel. The dots are a live Monte-Carlo run (${Math.round(bits).toLocaleString()} bits/point) and track the closed-form lines.`;

  const code = `import numpy as np
from scipy.special import erfc

Q = lambda x: 0.5 * erfc(x / np.sqrt(2))
EbN0_dB = np.arange(${DB_MIN}, ${DB_MAX + 1}, 2)
g = 10 ** (EbN0_dB / 10)          # Eb/N0 (linear)
bits = ${Math.round(bits)}

# --- Monte-Carlo BER (transmit bits, add AWGN, detect, count errors) ---
def sim_bpsk(g, n):
    ber = []
    for gi in g:
        s = 2 * np.random.randint(0, 2, n) - 1              # +/-1
        r = s + np.sqrt(1 / (2 * gi)) * np.random.randn(n)  # AWGN, Eb = 1
        ber.append(np.mean((r >= 0) != (s > 0)))
    return np.array(ber)

# --- Theoretical waterfall curves ---
ber_bpsk = Q(np.sqrt(2 * g))                                # BPSK / QPSK
def ber_qam(M, g):
    k = np.log2(M)
    return (4 / k) * (1 - 1 / np.sqrt(M)) * Q(np.sqrt(3 * k / (M - 1) * g))
ber_16  = ber_qam(16, g)
ber_64  = ber_qam(64, g)
ber_fsk = Q(np.sqrt(g))                                     # coherent BFSK

print(np.c_[EbN0_dB, ber_bpsk, sim_bpsk(g, bits), ber_16, ber_64])`;

  const toggle = (name: string) =>
    setActive((a) => (a.includes(name) ? (a.length > 1 ? a.filter((n) => n !== name) : a) : [...a, name]));

  return (
    <StudioChrome title="BER vs SNR Studio" tagline="digital modulation waterfall curves"
      controls={<div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Schemes</p>
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          {SCHEMES.map((s) => (
            <button key={s.name} onClick={() => toggle(s.name)}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold ${active.includes(s.name) ? "bg-slate-800 text-white dark:bg-slate-700" : "border border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400"}`}>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: active.includes(s.name) ? s.color : "transparent", border: `1px solid ${s.color}` }} />
              {s.name}
            </button>
          ))}
        </div>
        <p className="mb-3 text-xs text-slate-500">Log-scale BER (1e-6…1) vs Eb/N0. Lines are the closed-form theory; dots are a live AWGN Monte-Carlo simulation.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => { const p = PRESETS[label]; setActive(p.schemes); update({ marker: p.marker }); }}
        />
        <Slider label="Monte-Carlo bits / point" value={bits} min={2000} max={100000} step={2000} onChange={(v) => update({ bits: v })} />
        <Slider label="Marker Eb/N0 (dB)" value={marker} min={DB_MIN} max={DB_MAX} step={1} onChange={(v) => update({ marker: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Marker" value={`${marker} dB`} />
        {active.map((name) => {
          const ber = byName(name).theory(gLin);
          const req = requiredDb(byName(name).theory, target);
          const gap = req != null && reqBPSK != null ? req - reqBPSK : null;
          return <Stat key={name} label={name} value={`${ber.toExponential(2)}${gap && gap > 0.05 ? `  (+${gap.toFixed(1)} dB)` : ""}`} />;
        })}
        <Equation tex={`P_b^{\\text{BPSK}}=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)=${berBPSK.toExponential(2)}`} />
        <ExplainResult text={explain} />
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">(+dB) = extra Eb/N0 versus BPSK/QPSK to reach BER = 1e-4 (coding-gain gap).</p>
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}

// Superscript "-n" for the 10^-n decade labels.
function superMinus(d: number): string {
  const map: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  return "⁻" + String(Math.abs(d)).split("").map((c) => map[c]).join("");
}
