"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { htx: number; hrx: number; power: number; freq: number; sens: number }> = {
  "Handheld FRS": { htx: 6, hrx: 6, power: 2, freq: 462, sens: -110 },
  "VHF mobile": { htx: 30, hrx: 6, power: 25, freq: 155, sens: -110 },
  "Hilltop repeater": { htx: 200, hrx: 6, power: 50, freq: 145, sens: -115 },
  "UHF low power": { htx: 20, hrx: 6, power: 1, freq: 440, sens: -100 },
};

// Radio: line-of-sight horizon + free-space path loss link budget.
export function RadioRangeStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ htx, hrx, power, freq, sens }, update] = useShareableNumbers({ htx: 30, hrx: 6, power: 5, freq: 155, sens: -110 });

  // Radio horizon (miles) ~ 1.23*(sqrt(ht)+sqrt(hr)) with ht in feet
  const horizon = 1.23 * (Math.sqrt(htx) + Math.sqrt(hrx));
  // Link budget: EIRP dBm - FSPL >= sensitivity. Solve max distance.
  const eirp = 10 * Math.log10(power * 1000); // dBm (0 dBi antennas)
  // FSPL(dB) = 20log10(d_km) + 20log10(f_MHz) + 32.44 ; margin => d
  const allowed = eirp - sens; // dB budget
  const dkm = Math.pow(10, (allowed - 20 * Math.log10(freq) - 32.44) / 20);
  const dmiles = dkm * 0.621371;
  const range = Math.min(dmiles, horizon);
  const limited = horizon < dmiles ? "line-of-sight" : "signal strength";

  const explain =
    limited === "line-of-sight"
      ? `Range is capped by the horizon at ${horizon.toFixed(1)} mi — raising the base antenna helps more than adding power here.`
      : `Signal strength is the limit; you have ${allowed.toFixed(0)} dB of budget, so more power, antenna gain, or a lower frequency would extend the ${range.toFixed(1)} mi reach.`;

  const code = `import math
htx, hrx = ${htx}, ${hrx}  # antenna heights (ft)
power, freq, sens = ${power}, ${freq}, ${sens}  # watts, MHz, dBm
horizon = 1.23 * (math.sqrt(htx) + math.sqrt(hrx))  # miles
eirp = 10 * math.log10(power * 1000)  # dBm, 0 dBi antennas
allowed = eirp - sens  # dB budget
dkm = 10 ** ((allowed - 20*math.log10(freq) - 32.44) / 20)
range_mi = min(dkm * 0.621371, horizon)
print(f"range {range_mi:.1f} mi, horizon {horizon:.1f} mi")`;

  useEffect(() => {
    const W = 520, H = 240; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, W, H);
    // earth curve
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W / 2, H + 900, 940, Math.PI * 1.35, Math.PI * 1.65); ctx.stroke();
    // tx tower
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; const tx = 80, ty = 150; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty - Math.min(60, htx)); ctx.stroke();
    // range rings
    const maxR = 40; const rpx = Math.min(W - 120, (range / maxR) * (W - 120));
    ctx.strokeStyle = "#a3e635"; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + rpx, ty); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(tx + rpx, ty, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#e2e8f0"; ctx.font = "12px sans-serif"; ctx.fillText("base", tx - 12, ty + 18); ctx.fillText(`${range.toFixed(1)} mi`, tx + rpx - 20, ty + 20);
  }, [htx, hrx, power, freq, sens]);

  return (
    <StudioChrome title="Radio Range / Link Budget" tagline="VHF/UHF horizon + path loss"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Base antenna (ft)" value={htx} min={3} max={300} step={1} onChange={(v) => update({ htx: v })} />
        <Slider label="Portable height (ft)" value={hrx} min={3} max={50} step={1} onChange={(v) => update({ hrx: v })} />
        <Slider label="Power (W)" value={power} min={0.5} max={100} step={0.5} onChange={(v) => update({ power: v })} />
        <Slider label="Frequency (MHz)" value={freq} min={30} max={900} step={5} onChange={(v) => update({ freq: v })} />
        <Slider label="Rx sensitivity (dBm)" value={sens} min={-120} max={-90} step={1} onChange={(v) => update({ sens: v })} />
        <p className="mt-3 text-xs text-slate-500">Combines the radio horizon (1.23·(√h₁+√h₂), feet→miles) with a free-space link budget (EIRP minus path loss vs receiver sensitivity). Actual range depends on terrain, foliage, and buildings — treat this as a best-case planning estimate.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Radio horizon" value={`${horizon.toFixed(1)} mi`} /><Stat label="Link budget" value={`${allowed.toFixed(0)} dB`} /><Stat label="Limited by" value={limited} /><ExplainResult text={explain} /></div>}
    ><div>
        <canvas ref={canvasRef} width={520} height={240} className="mx-auto h-auto max-w-full rounded-lg" />
        <div className="mt-6 flex flex-col items-center"><div className="text-xs uppercase tracking-widest text-slate-500">Estimated usable range</div>
          <div className="mt-2 text-6xl font-black text-cyan-500">{range.toFixed(1)}<span className="ml-2 text-2xl text-slate-400">mi</span></div></div>
      </div></StudioChrome>
  );
}
