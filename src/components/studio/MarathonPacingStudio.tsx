"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { distance: number; targetMin: number }> = {
  "Sub-4 marathon": { distance: 42.2, targetMin: 240 },
  "Boston BQ (sub-3)": { distance: 42.2, targetMin: 180 },
  "Half PB": { distance: 21.1, targetMin: 105 },
  "10K tempo": { distance: 10, targetMin: 50 },
};

export function MarathonPacingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ distance, targetMin }, update] = useShareableNumbers({ distance: 42.2, targetMin: 240 });
  const [strategy, setStrategy] = useState<"even" | "negative" | "positive">("even");

  const pace = targetMin / distance; // min/km
  const paceMin = Math.floor(pace), paceSec = Math.round((pace - paceMin) * 60);
  const kmh = distance / (targetMin / 60);

  useEffect(() => {
    const W = 520, H = 260; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    const n = Math.ceil(distance); ctx.fillStyle = "#22d3ee";
    for (let i = 0; i < n; i++) { const frac = i / (n - 1); let adj = 1; if (strategy === "negative") adj = 1.04 - frac * 0.08; if (strategy === "positive") adj = 0.96 + frac * 0.08; const p = pace * adj; const bh = (p / (pace * 1.15)) * ph; ctx.fillRect(ox + (i / n) * pw, oy - bh, pw / n - 1, bh); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("pace per km (bars) — negative split = faster finish", ox + 6, oy - ph + 12); ctx.fillText("distance →", ox + pw - 60, oy + 16);
  }, [distance, targetMin, strategy]);

  const explain =
    strategy === "positive"
      ? "You are set to a positive split — starting fast and fading. This is exactly how the wall gets you: early glycogen burn makes the back half hurt most."
      : strategy === "negative"
      ? `A negative split means banking a conservative first half, then finishing under your ${paceMin}:${paceSec.toString().padStart(2, "0")}/km average — the pattern behind nearly every marathon record.`
      : `Even pacing holds ${paceMin}:${paceSec.toString().padStart(2, "0")}/km the whole way — the safe default, since pace is simply goal time (${targetMin} min) divided by distance (${distance} km).`;

  const code = `# Marathon pacing plan
distance_km, target_min, strategy = ${distance}, ${targetMin}, "${strategy}"
pace = target_min / distance_km  # min per km
print(f"avg pace {int(pace)}:{round((pace-int(pace))*60):02d}/km")
import math
n = math.ceil(distance_km)
for i in range(n):
    frac = i / (n - 1)
    adj = 1.04 - frac*0.08 if strategy == "negative" else 0.96 + frac*0.08 if strategy == "positive" else 1.0
    print(f"km {i+1}: {pace*adj:.2f} min")`;

  return (
    <StudioChrome title="Marathon Pacing" tagline="hit your goal time"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <div className="mb-3 grid grid-cols-3 gap-1">{[["10K", 10], ["Half", 21.1], ["Full", 42.2]].map(([n, d]) => <button key={n as string} onClick={() => update({ distance: d as number })} className={`rounded-lg px-1 py-1 text-xs font-semibold ${distance === d ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{n}</button>)}</div>
        <Slider label="Target time (min)" value={targetMin} min={30} max={360} step={5} onChange={(v) => update({ targetMin: v })} />
        <div className="mt-3 grid grid-cols-3 gap-1">{(["even", "negative", "positive"] as const).map((s) => <button key={s} onClick={() => setStrategy(s)} className={`rounded-lg px-1 py-1 text-xs font-semibold capitalize ${strategy === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>)}</div>
        <p className="mt-3 text-xs text-slate-500">Race pace is simply your goal time divided by the distance, but how you distribute it matters. A negative split — starting conservatively and finishing faster — is how nearly every marathon world record is run, because going out too hard burns glycogen and invites the dreaded wall. Even pacing is the safe default.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Average pace" value={`${paceMin}:${paceSec.toString().padStart(2, "0")}/km`} /><Stat label="Speed" value={`${kmh.toFixed(1)} km/h`} /><Stat label="Finish time" value={`${Math.floor(targetMin / 60)}h ${(targetMin % 60).toFixed(0)}m`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
