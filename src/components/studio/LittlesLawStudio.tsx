"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { throughput: number; leadTime: number }> = {
  "Lean cell": { throughput: 12, leadTime: 1 },
  "Hospital ED": { throughput: 4, leadTime: 3 },
  "Backlogged team": { throughput: 2, leadTime: 10 },
  "Fast checkout": { throughput: 15, leadTime: 0.5 },
};

// Little's Law: WIP = throughput x lead time.
export function LittlesLawStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ throughput, leadTime }, update] = useShareableNumbers({ throughput: 5, leadTime: 4 });
  const [running, setRunning] = useState(true);

  const wip = throughput * leadTime;

  useEffect(() => {
    if (!running) return; let raf = 0; let t = 0;
    const loop = () => {
      t += 0.02; const W = 520, H = 260; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      // pipe
      ctx.strokeStyle = "#334155"; ctx.lineWidth = 2; ctx.strokeRect(60, 100, W - 120, 60);
      // items flowing (count ~ wip)
      const n = Math.min(30, Math.round(wip)); const speed = throughput * 8;
      for (let i = 0; i < n; i++) { const x = 60 + ((i / n * (W - 120) + t * speed) % (W - 120)); ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(x, 130, 6, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`→ in ${throughput}/hr`, 8, 134); ctx.fillText(`out ${throughput}/hr →`, W - 90, 134); ctx.fillText(`work-in-progress ≈ ${wip.toFixed(0)} units`, 60, 90);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [throughput, leadTime, running]);

  const explain = `At ${throughput}/hr throughput and a ${leadTime} hr lead time, about ${wip.toFixed(0)} items sit in progress at once — so the only ways to cut lead time are to raise throughput or shrink work-in-progress; you cannot move one without the others following.`;

  const code = `throughput, lead_time = ${throughput}, ${leadTime}  # units/hr, hr
wip = throughput * lead_time
print("work-in-progress:", wip, "units")
# rearranged: lead_time = wip / throughput`;

  return (
    <StudioChrome title="Little's Law" tagline="the law of flow"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Throughput (units/hr)" value={throughput} min={1} max={20} step={1} onChange={(v) => update({ throughput: v })} />
        <Slider label="Lead time (hr)" value={leadTime} min={0.5} max={12} step={0.5} onChange={(v) => update({ leadTime: v })} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">Little&apos;s Law is deceptively simple and astonishingly general: the average work-in-progress equals throughput times lead time. It holds for any stable queue — a factory, a hospital, a software backlog, a checkout line — regardless of the details. It means the only ways to cut lead time are to raise throughput or reduce work-in-progress, the core insight of lean and agile.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Work in progress" value={`${wip.toFixed(1)} units`} /><Stat label="Throughput" value={`${throughput}/hr`} /><Stat label="Lead time" value={`${leadTime} hr`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
