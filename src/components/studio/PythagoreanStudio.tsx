"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const SPORT: Record<string, { exp: number; games: number }> = { Baseball: { exp: 1.83, games: 162 }, Basketball: { exp: 13.9, games: 82 }, "Am. Football": { exp: 2.37, games: 17 }, Soccer: { exp: 1.35, games: 38 } };

const PRESETS: Record<string, { pf: number; pa: number }> = {
  "Even teams": { pf: 700, pa: 700 },
  Dominant: { pf: 950, pa: 600 },
  Struggling: { pf: 600, pa: 850 },
  "Slight edge": { pf: 780, pa: 720 },
};

export function PythagoreanStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sport, setSport] = useState("Baseball");
  const [{ pf, pa }, update] = useShareableNumbers({ pf: 750, pa: 700 });

  const exp = SPORT[sport].exp; const winPct = Math.pow(pf, exp) / (Math.pow(pf, exp) + Math.pow(pa, exp));
  const wins = winPct * SPORT[sport].games;

  useEffect(() => {
    const W = 500, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const ratio = 0.5 + (i / pw) * 1; const wp = Math.pow(ratio, exp) / (Math.pow(ratio, exp) + 1); const y = oy - wp * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    const ratio = pf / pa; const px = ox + ((ratio - 0.5) / 1) * pw; const py = oy - winPct * ph; ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(Math.max(ox, Math.min(ox + pw, px)), py, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("win % vs scoring ratio", ox + 6, oy - ph + 12); ctx.fillText("points-for / points-against →", ox + pw - 150, oy + 16);
  }, [sport, pf, pa]);

  const explain =
    pf > pa * 1.25
      ? `Outscoring opponents this heavily projects a ${(winPct * 100).toFixed(1)}% clip — roughly ${wins.toFixed(0)} of ${SPORT[sport].games} games in ${sport}.`
      : pa > pf * 1.25
      ? `Being outscored this much projects just ${(winPct * 100).toFixed(1)}% — about ${wins.toFixed(0)} of ${SPORT[sport].games} games; the run differential says regression is unlikely to save this record.`
      : `A near-even scoring ratio lands close to .500 (${(winPct * 100).toFixed(1)}%); with an exponent of ${exp.toFixed(2)}, ${sport} win % swings sharply once the ratio tilts.`;

  const code = `exp = ${exp}   # ${sport}
pf, pa = ${pf}, ${pa}
win_pct = pf**exp / (pf**exp + pa**exp)
wins = win_pct * ${SPORT[sport].games}
print("expected win %", round(win_pct * 100, 1))
print("projected wins", round(wins))`;

  return (
    <StudioChrome title="Pythagorean Expectation" tagline="wins from points"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-2">{Object.keys(SPORT).map((s) => <button key={s} onClick={() => setSport(s)} className={`rounded-lg px-2 py-1 text-xs font-semibold ${sport === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>)}</div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Points/runs scored" value={pf} min={300} max={1200} step={10} onChange={(v) => update({ pf: v })} />
        <Slider label="Points/runs allowed" value={pa} min={300} max={1200} step={10} onChange={(v) => update({ pa: v })} />
        <p className="mt-3 text-xs text-slate-500">Bill James discovered that a team&apos;s win percentage tracks the ratio of points scored to points allowed, raised to a sport-specific exponent — the Pythagorean expectation. It predicts records better than actual wins early in a season, exposing teams that are lucky or unlucky and due to regress. The exponent varies from ~1.8 in baseball to ~14 in basketball.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Expected win %" value={`${(winPct * 100).toFixed(1)}%`} /><Stat label="Projected wins" value={`${wins.toFixed(0)} of ${SPORT[sport].games}`} /><Stat label="Exponent" value={exp.toFixed(2)} /><Equation tex={`\\text{Win\\%} = \\dfrac{${pf}^{${exp.toFixed(2)}}}{${pf}^{${exp.toFixed(2)}} + ${pa}^{${exp.toFixed(2)}}} = ${(winPct * 100).toFixed(1)}\\%`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
