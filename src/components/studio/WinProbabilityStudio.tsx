"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { lead: number; minsLeft: number; scoreSigma: number }> = {
  "Nail-biter": { lead: 2, minsLeft: 2, scoreSigma: 12 },
  "Comfortable": { lead: 12, minsLeft: 8, scoreSigma: 12 },
  "Early deficit": { lead: -8, minsLeft: 40, scoreSigma: 14 },
  "Tied, late": { lead: 0, minsLeft: 1, scoreSigma: 10 },
};

// In-game win probability from lead and time remaining.
export function WinProbabilityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ lead, minsLeft, scoreSigma }, update] = useShareableNumbers({ lead: 5, minsLeft: 10, scoreSigma: 12 });

  const wp = (l: number, t: number) => { const remainSigma = scoreSigma * Math.sqrt(Math.max(0.001, t) / 48); const z = l / (remainSigma || 0.5); return 1 / (1 + Math.exp(-z * 1.7)); };
  const currentWP = wp(lead, minsLeft);

  useEffect(() => {
    const W = 520, H = 300; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox, oy - ph / 2); ctx.lineTo(ox + pw, oy - ph / 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = 48 - (i / pw) * 48; const w = wp(lead, t); const y = oy - w * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    const px = ox + ((48 - minsLeft) / 48) * pw; const py = oy - currentWP * ph; ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`win probability with a ${lead}-point lead over time`, ox + 6, oy - ph + 12); ctx.fillText("← time elapsed", ox + pw - 90, oy + 16);
  }, [lead, minsLeft, scoreSigma]);

  const pct = currentWP * 100;
  const explain =
    Math.abs(lead) <= 1
      ? `Dead even with ${minsLeft} min left — the model sits near a coin flip until someone scores.`
      : pct > 85 || pct < 15
      ? `A ${Math.abs(lead)}-point ${lead > 0 ? "lead" : "deficit"} with only ${minsLeft} min left leaves little time to swing, so the odds have hardened to ${pct.toFixed(0)}%.`
      : `A ${Math.abs(lead)}-point ${lead > 0 ? "lead" : "deficit"} is still soft with ${minsLeft} min on the clock — plenty of scoring remains, keeping win probability near ${pct.toFixed(0)}%.`;

  const code = `import numpy as np
lead, mins_left, sigma = ${lead}, ${minsLeft}, ${scoreSigma}
remain_sigma = sigma * np.sqrt(max(0.001, mins_left) / 48)
z = lead / (remain_sigma or 0.5)
win_prob = 1 / (1 + np.exp(-z * 1.7))
print("win probability", round(win_prob * 100, 1), "%")`;

  return (
    <StudioChrome title="Live Win Probability" tagline="the odds in real time"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Lead (points)" value={lead} min={-20} max={20} step={1} onChange={(v) => update({ lead: v })} />
        <Slider label="Minutes remaining" value={minsLeft} min={0.5} max={48} step={0.5} onChange={(v) => update({ minsLeft: v })} />
        <Slider label="Scoring volatility" value={scoreSigma} min={6} max={20} step={1} onChange={(v) => update({ scoreSigma: v })} />
        <p className="mt-3 text-xs text-slate-500">Win probability turns the score and clock into a live percentage. Early on, even a big lead is fragile because plenty of scoring remains; late in the game, the same lead is nearly safe because the uncertainty has shrunk. Modeling the remaining margin as a shrinking random variable produces the classic curve that broadcasts now show on screen.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Win probability" value={`${pct.toFixed(1)}%`} /><Stat label="Lead" value={`${lead > 0 ? "+" : ""}${lead}`} /><Stat label="Time left" value={`${minsLeft} min`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
