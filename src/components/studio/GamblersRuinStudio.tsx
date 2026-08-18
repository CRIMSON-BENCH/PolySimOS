"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { stake: number; target: number; pWin: number }> = {
  "Fair coin": { stake: 20, target: 50, pWin: 0.5 },
  "House edge (roulette)": { stake: 20, target: 50, pWin: 0.47 },
  "Long-shot target": { stake: 10, target: 100, pWin: 0.49 },
  "Player advantage": { stake: 40, target: 80, pWin: 0.53 },
};

export function GamblersRuinStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ stake, target, pWin }, update] = useShareableNumbers({ stake: 20, target: 50, pWin: 0.49 });
  const [seed, setSeed] = useState(1);
  const [ruined, setRuined] = useState(0);

  // theoretical ruin probability
  const q = 1 - pWin; const ruinTheory = pWin === 0.5 ? 1 - stake / target : (Math.pow(q / pWin, stake) - Math.pow(q / pWin, target)) / (1 - Math.pow(q / pWin, target));

  useEffect(() => {
    const W = 520, H = 300; let s = seed * 8951 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, oy = H - 20, ph = H - 40; const Y = (v: number) => oy - (v / target) * ph;
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox, Y(target)); ctx.lineTo(W, Y(target)); ctx.stroke(); ctx.setLineDash([]);
    let ruinCount = 0; const TRIALS = 30;
    for (let t = 0; t < TRIALS; t++) { let money = stake; ctx.strokeStyle = `hsla(${190 + t * 5},70%,55%,0.5)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox, Y(money)); let step = 0;
      while (money > 0 && money < target && step < 2000) { money += rnd() < pWin ? 1 : -1; step++; ctx.lineTo(ox + (step / 2000) * (W - ox), Y(money)); } ctx.stroke(); if (money <= 0) ruinCount++; }
    setRuined(ruinCount);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${TRIALS} gamblers — reach $${target} or go broke`, ox + 4, 16);
  }, [stake, target, pWin, seed]);

  const explain = pWin < 0.5
    ? `The house edge (p<0.5) makes ruin nearly certain — P(ruin) rises exponentially with the target, so aiming for $${target} from $${stake} all but guarantees going broke first.`
    : pWin === 0.5
    ? `Even a perfectly fair game ruins you with probability 1 − stake/target = ${(ruinTheory * 100).toFixed(0)}% — a small bankroll relative to the target is what dooms you, no edge required.`
    : "With a genuine edge (p>0.5) ruin is no longer certain, but a small bankroll can still bust from an early losing streak before the advantage compounds.";

  const code = `p = ${pWin}
q = 1 - p
stake, target = ${stake}, ${target}
if p == 0.5:
    ruin = 1 - stake / target
else:
    r = q / p
    ruin = (r**stake - r**target) / (1 - r**target)
print("P(ruin)", ruin)`;

  return (
    <StudioChrome title="Gambler's Ruin" tagline="the house always wins in the end"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Starting stake ($)" value={stake} min={5} max={90} step={5} onChange={(v) => update({ stake: v })} />
        <Slider label="Target ($)" value={target} min={stake + 10} max={200} step={10} onChange={(v) => update({ target: v })} />
        <Slider label="Win probability" value={pWin} min={0.4} max={0.6} step={0.01} onChange={(v) => update({ pWin: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">Re-run gamblers</button>
        <p className="mt-3 text-xs text-slate-500">A gambler betting against a rich casino faces gambler&apos;s ruin: even a nearly fair game (49% odds) almost always ends in bankruptcy before hitting a big target, because the house has effectively unlimited funds. The tiny edge compounds relentlessly over many bets — which is exactly how casinos stay in business.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="P(ruin) theory" value={`${(ruinTheory * 100).toFixed(1)}%`} /><Stat label="Ruined (this run)" value={`${ruined} / 30`} /><Stat label="Edge per bet" value={`${((pWin - 0.5) * 100).toFixed(0)}%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
