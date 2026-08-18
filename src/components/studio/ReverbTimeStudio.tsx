"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { volume: number; area: number; alpha: number }> = {
  "Recording booth": { volume: 40, area: 80, alpha: 0.6 },
  "Living room": { volume: 60, area: 100, alpha: 0.25 },
  "Concert hall": { volume: 1500, area: 1200, alpha: 0.15 },
  "Empty gym": { volume: 2000, area: 1600, alpha: 0.05 },
};

// Sabine reverberation time: RT60 = 0.161 V / (S * alpha).
export function ReverbTimeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ volume, area, alpha }, update] = useShareableNumbers({ volume: 200, area: 220, alpha: 0.15 });

  const A = area * alpha; const rt60 = 0.161 * volume / A;

  useEffect(() => {
    const W = 520, H = 280; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H - 40, pw = W - 60, ph = H - 60; const tMax = 3;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // decay: level drops 60 dB over RT60
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= pw; i++) { const t = (i / pw) * tMax; const db = -60 * t / rt60; const y = oy - ((db + 70) / 70) * ph; i ? ctx.lineTo(ox + i, y) : ctx.moveTo(ox + i, y); } ctx.stroke();
    // -60 dB marker
    ctx.strokeStyle = "#f472b6"; ctx.setLineDash([4, 4]); const y60 = oy - ((-60 + 70) / 70) * ph; ctx.beginPath(); ctx.moveTo(ox, y60); ctx.lineTo(ox + pw, y60); ctx.stroke();
    const xr = ox + (Math.min(rt60, tMax) / tMax) * pw; ctx.beginPath(); ctx.moveTo(xr, oy); ctx.lineTo(xr, oy - ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("sound decay (dB)", ox + 6, oy - ph + 12); ctx.fillStyle = "#f9a8d4"; ctx.fillText("−60 dB", ox + pw - 44, y60 - 4); ctx.fillText(`RT60 = ${rt60.toFixed(2)}s`, xr - 30, oy + 16);
  }, [volume, area, alpha, rt60]);

  const verdict = rt60 < 0.5 ? "dry (studio)" : rt60 < 1.2 ? "good (living room)" : rt60 < 2.2 ? "live (hall)" : "very reverberant";

  const explain =
    rt60 < 0.5
      ? `At RT60 ${rt60.toFixed(2)} s this space is very dry — ideal for speech and recording, though music can sound lifeless.`
      : rt60 < 1.2
      ? `RT60 of ${rt60.toFixed(2)} s is a balanced living-room decay: speech stays clear with a touch of warmth.`
      : rt60 < 2.2
      ? `RT60 ${rt60.toFixed(2)} s gives a lively, hall-like decay well suited to orchestral music.`
      : `A ${rt60.toFixed(2)} s RT60 is very reverberant — speech smears badly; raise α or add surface area to tame it.`;

  const code = `V, S, alpha = ${volume}, ${area}, ${alpha}
A = S*alpha                 # total absorption, sabins
rt60 = 0.161*V/A            # Sabine's formula
print("RT60 %.2f s" % rt60, "A", round(A), "sabins")`;

  return (
    <StudioChrome title="Reverberation Time (Sabine)" tagline="how long sound lingers"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Room volume (m³)" value={volume} min={30} max={2000} step={10} onChange={(v) => update({ volume: v })} />
        <Slider label="Surface area (m²)" value={area} min={50} max={2000} step={10} onChange={(v) => update({ area: v })} />
        <Slider label="Avg absorption α" value={alpha} min={0.05} max={0.9} step={0.05} onChange={(v) => update({ alpha: v })} />
        <p className="mt-3 text-xs text-slate-500">Reverberation time — how long a sound takes to decay by 60 dB — is set by Sabine&apos;s formula RT60 = 0.161·V/(S·α). Big, hard rooms ring for seconds; small, soft rooms deaden almost instantly. Concert halls target around 2 seconds; recording studios far less. Adding absorption pulls the decay down.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="RT60" value={`${rt60.toFixed(2)} s`} /><Stat label="Absorption A" value={`${A.toFixed(0)} sabins`} /><Stat label="Character" value={verdict} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={280} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
