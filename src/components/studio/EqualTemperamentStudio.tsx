"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C"];
const JUST: [number, number][] = [[1, 1], [16, 15], [9, 8], [6, 5], [5, 4], [4, 3], [45, 32], [3, 2], [8, 5], [5, 3], [16, 9], [15, 8], [2, 1]];

const PRESETS: Record<string, { root: number }> = {
  "A2 (110)": { root: 110 },
  "C4 middle": { root: 261.63 },
  "F4": { root: 349.23 },
  "A4 concert": { root: 440 },
};

export function EqualTemperamentStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ root }, update] = useShareableNumbers({ root: 261.63 });

  const etFifth = root * Math.pow(2, 7 / 12);
  const justFifth = root * 1.5;
  const explain = `The equal-tempered fifth sits at ${etFifth.toFixed(1)} Hz versus the pure 3:2 fifth at ${justFifth.toFixed(1)} Hz — only about 2 cents flat, which the ear forgives; the major third, however, runs a far more audible 14 cents sharp, the price of making every key playable.`;

  const code = `root = ${root}
for n, name in [(7, "fifth"), (4, "major 3rd")]:
    et = root * 2 ** (n / 12)          # equal temperament
    print(name, round(et, 2), "Hz")`;

  useEffect(() => {
    const W = 540, H = 320; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 40, oy = H / 2, bw = (W - 60) / 13;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(W - 20, oy); ctx.stroke();
    for (let i = 0; i <= 12; i++) { const etCents = i * 100; const justCents = 1200 * Math.log2(JUST[i][0] / JUST[i][1]); const dev = justCents - etCents;
      const x = ox + i * bw; const h = dev * 2.2; ctx.fillStyle = Math.abs(dev) < 2 ? "#a3e635" : Math.abs(dev) > 12 ? "#f472b6" : "#22d3ee"; ctx.fillRect(x - 8, oy - h, 16, h || 1);
      ctx.fillStyle = "#94a3b8"; ctx.font = "9px sans-serif"; ctx.fillText(NOTES[i], x - 6, oy + (h > 0 ? 14 : -6)); ctx.fillText(`${dev >= 0 ? "+" : ""}${dev.toFixed(0)}`, x - 8, oy + (h > 0 ? 26 : -18)); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("cents deviation: equal temperament vs just intonation", ox, 20);
  }, [root]);

  return (
    <StudioChrome title="Equal Temperament vs Just Intonation" tagline="the compromise of tuning"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Root frequency (Hz)" value={root} min={110} max={523} step={1} onChange={(v) => update({ root: v })} />
        <p className="mt-3 text-xs text-slate-500">Just intonation tunes intervals to pure whole-number frequency ratios, which sound perfectly consonant but only in one key. Equal temperament divides the octave into 12 identical steps so every key works, at the cost of every interval except the octave being slightly out of tune. The bars show that compromise in cents.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Equal-temp fifth" value={`${etFifth.toFixed(1)} Hz`} /><Stat label="Just fifth (3:2)" value={`${justFifth.toFixed(1)} Hz`} /><Stat label="Fifth error" value="−2 cents" /><Stat label="Major 3rd error" value="+14 cents" /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
