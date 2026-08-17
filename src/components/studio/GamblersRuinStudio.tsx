"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function GamblersRuinStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stake, setStake] = useState(20);
  const [target, setTarget] = useState(50);
  const [pWin, setPWin] = useState(0.49);
  const [seed, setSeed] = useState(1);
  const [ruined, setRuined] = useState(0);

  // theoretical ruin probability
  const q = 1 - pWin; const ruinTheory = pWin === 0.5 ? 1 - stake / target : (Math.pow(q / pWin, stake) - Math.pow(q / pWin, target)) / (1 - Math.pow(q / pWin, target));

  useEffect(() => {
    const W = 520, H = 300; let s = seed * 8951 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const ctx = canvasRef.current!.getContext("2d")!; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, oy = H - 20, ph = H - 40; const Y = (v: number) => oy - (v / target) * ph;
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox, Y(target)); ctx.lineTo(W, Y(target)); ctx.stroke(); ctx.setLineDash([]);
    let ruinCount = 0; const TRIALS = 30;
    for (let t = 0; t < TRIALS; t++) { let money = stake; ctx.strokeStyle = `hsla(${190 + t * 5},70%,55%,0.5)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox, Y(money)); let step = 0;
      while (money > 0 && money < target && step < 2000) { money += rnd() < pWin ? 1 : -1; step++; ctx.lineTo(ox + (step / 2000) * (W - ox), Y(money)); } ctx.stroke(); if (money <= 0) ruinCount++; }
    setRuined(ruinCount);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`${TRIALS} gamblers — reach $${target} or go broke`, ox + 4, 16);
  }, [stake, target, pWin, seed]);

  return (
    <StudioChrome title="Gambler's Ruin" tagline="the house always wins in the end"
      controls={<div>
        <Slider label="Starting stake ($)" value={stake} min={5} max={90} step={5} onChange={setStake} />
        <Slider label="Target ($)" value={target} min={stake + 10} max={200} step={10} onChange={setTarget} />
        <Slider label="Win probability" value={pWin} min={0.4} max={0.6} step={0.01} onChange={setPWin} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">Re-run gamblers</button>
        <p className="mt-3 text-xs text-slate-500">A gambler betting against a rich casino faces gambler&apos;s ruin: even a nearly fair game (49% odds) almost always ends in bankruptcy before hitting a big target, because the house has effectively unlimited funds. The tiny edge compounds relentlessly over many bets — which is exactly how casinos stay in business.</p>
      </div>}
      inspector={<div><Stat label="P(ruin) theory" value={`${(ruinTheory * 100).toFixed(1)}%`} /><Stat label="Ruined (this run)" value={`${ruined} / 30`} /><Stat label="Edge per bet" value={`${((pWin - 0.5) * 100).toFixed(0)}%`} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
