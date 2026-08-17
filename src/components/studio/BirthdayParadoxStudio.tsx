"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function BirthdayParadoxStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [group, setGroup] = useState(23);

  const pShared = (n: number) => { let p = 1; for (let i = 0; i < n; i++) p *= (365 - i) / 365; return 1 - p; };
  const cur = pShared(group);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 520, H = 300; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 35, pw = W - 60, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // 50% line
    ctx.strokeStyle = "#475569"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ox, oy - ph / 2); ctx.lineTo(ox + pw, oy - ph / 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); for (let n = 1; n <= 80; n++) { const x = ox + (n / 80) * pw; const y = oy - pShared(n) * ph; n === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    const px = ox + (group / 80) * pw; const py = oy - cur * ph; ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("P(shared birthday) vs group size", ox + 6, oy - ph + 12); ctx.fillText("50%", ox + 4, oy - ph / 2 - 4); ctx.fillText("people →", ox + pw - 50, oy + 16);
  }, [group]);

  return (
    <StudioChrome title="Birthday Paradox" tagline="smaller than you'd think"
      controls={<div>
        <Slider label="Group size" value={group} min={2} max={80} step={1} onChange={setGroup} />
        <p className="mt-3 text-xs text-slate-500">How many people until two share a birthday? Intuition says hundreds, but it takes just 23 for better-than-even odds, and 70 makes it near-certain. The trick is that the number of pairs grows quadratically — 23 people form 253 pairs, each a chance to match. It is why hash collisions and cryptographic birthday attacks happen far sooner than expected.</p>
      </div>}
      inspector={<div><Stat label="Group size" value={String(group)} /><Stat label="P(shared birthday)" value={`${(cur * 100).toFixed(1)}%`} /><Stat label="Pairs" value={String(group * (group - 1) / 2)} /></div>}
    ><canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
