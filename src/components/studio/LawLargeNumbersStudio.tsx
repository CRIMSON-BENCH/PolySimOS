"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { pHeads: number }> = {
  "Fair coin": { pHeads: 0.5 },
  "Loaded 0.7": { pHeads: 0.7 },
  "Rare heads": { pHeads: 0.1 },
  "Near-certain": { pHeads: 0.9 },
};

export function LawLargeNumbersStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ pHeads }, update] = useShareableNumbers({ pHeads: 0.5 });
  const pHeadsRef = useRef(pHeads); pHeadsRef.current = pHeads;
  const state = useRef({ heads: 0, n: 0 });
  const hist = useRef<number[]>([]);
  const seedRef = useRef(3);

  const reset = () => { state.current = { heads: 0, n: 0 }; hist.current = []; seedRef.current = 3; };
  useEffect(reset, [pHeads]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let s = seedRef.current; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; seedRef.current = s; return s / 4294967296; };
    for (let k = 0; k < steps; k++) { if (rnd() < pHeadsRef.current) state.current.heads++; state.current.n++; }
    hist.current.push(state.current.heads / state.current.n); if (hist.current.length > 400) hist.current.shift();
    const W = 520, H = 300; const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 30, pw = W - 60, ph = H - 50;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([4, 4]); const ty = oy - pHeadsRef.current * ph; ctx.beginPath(); ctx.moveTo(ox, ty); ctx.lineTo(ox + pw, ty); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5; ctx.beginPath(); hist.current.forEach((v, i) => { const x = ox + (i / 400) * pw; const y = oy - v * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("running proportion of heads", ox + 6, oy - ph + 12); ctx.fillStyle = "#bef264"; ctx.fillText(`true p = ${pHeadsRef.current}`, ox + pw - 70, ty - 4);
  };

  const t = useTransport(frame);

  const obs = state.current.n ? state.current.heads / state.current.n : 0;
  const explain =
    Math.abs(pHeads - 0.5) < 0.06
      ? "With a near-fair coin the running proportion wanders wildly at first, but the law pulls it toward 0.50 as flips pile up — and a streak of tails never makes heads “due.”"
      : `A biased coin obeys the same law: the proportion converges on ${pHeads}, not 0.5. The bias sets the target the average homes in on; the number of flips sets how tightly it locks on.`;
  const code = `import random
p = ${pHeads}
heads = n = 0
for _ in range(10000):
    if random.random() < p: heads += 1
    n += 1
print("observed", heads / n, "target", p)`;
  return (
    <StudioChrome title="Law of Large Numbers" tagline="chance averages out"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { reset(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="True P(heads)" value={pHeads} min={0.1} max={0.9} step={0.05} onChange={(v) => update({ pHeads: v })} />
        <p className="mt-3 text-xs text-slate-500">Flip a coin a few times and the proportion of heads jumps around wildly; flip it thousands of times and it settles onto the true probability. That is the law of large numbers — averages converge even though individual flips stay random. Crucially, it does not mean a run of tails is &quot;due&quot; to reverse; that belief is the gambler&apos;s fallacy.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Flips" value={state.current.n.toLocaleString()} /><Stat label="Observed p" value={obs.toFixed(4)} /><Stat label="Deviation" value={`${((obs - pHeads) * 100).toFixed(2)}%`} /><Equation tex={`\\bar{x}_n \\to \\mu = ${pHeads} \\ \\text{ as } n \\to \\infty \\quad\\left(n = ${state.current.n},\\ |\\bar{x}_n - \\mu| = ${Math.abs(obs - pHeads).toFixed(4)}\\right)`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
