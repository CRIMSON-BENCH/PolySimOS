"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// In-game win probability from lead and time remaining.
export function WinProbabilityStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lead, setLead] = useState(5);
  const [minsLeft, setMinsLeft] = useState(10);
  const [scoreSigma, setScoreSigma] = useState(12); // typical final margin std

  const wp = (l: number, t: number) => { const remainSigma = scoreSigma * Math.sqrt(Math.max(0.001, t) / 48); const z = l / (remainSigma || 0.5); return 1 / (1 + Math.exp(-z * 1.7)); };
  const currentWP = wp(lead, minsLeft);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox, oy - ph / 2); ctx.lineTo(ox + pw, oy - ph / 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= pw; i++) { const t = 48 - (i / pw) * 48; const w = wp(lead, t); const y = oy - w * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    const px = ox + ((48 - minsLeft) / 48) * pw; const py = oy - currentWP * ph; ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`win probability with a ${lead}-point lead over time`, ox + 6, oy - ph + 12); ctx.fillText("← time elapsed", ox + pw - 90, oy + 16);
  }, [lead, minsLeft, scoreSigma]);

  return (
    <StudioChrome title="Live Win Probability" tagline="the odds in real time"
      controls={<div>
        <Slider label="Lead (points)" value={lead} min={-20} max={20} step={1} onChange={setLead} />
        <Slider label="Minutes remaining" value={minsLeft} min={0.5} max={48} step={0.5} onChange={setMinsLeft} />
        <Slider label="Scoring volatility" value={scoreSigma} min={6} max={20} step={1} onChange={setScoreSigma} />
        <p className="mt-3 text-xs text-slate-500">Win probability turns the score and clock into a live percentage. Early on, even a big lead is fragile because plenty of scoring remains; late in the game, the same lead is nearly safe because the uncertainty has shrunk. Modeling the remaining margin as a shrinking random variable produces the classic curve that broadcasts now show on screen.</p>
      </div>}
      inspector={<div><Stat label="Win probability" value={`${(currentWP * 100).toFixed(1)}%`} /><Stat label="Lead" value={`${lead > 0 ? "+" : ""}${lead}`} /><Stat label="Time left" value={`${minsLeft} min`} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
