"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { capacity: number; rtEff: number; dod: number; dailyLoad: number }> = {
  "Home powerwall": { capacity: 13.5, rtEff: 90, dod: 90, dailyLoad: 10 },
  "EV-sized pack": { capacity: 75, rtEff: 92, dod: 80, dailyLoad: 20 },
  "Small backup": { capacity: 5, rtEff: 95, dod: 80, dailyLoad: 3 },
  "Off-grid daily": { capacity: 30, rtEff: 88, dod: 95, dailyLoad: 25 },
};

export function BatteryStorageStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ capacity, rtEff, dod, dailyLoad }, update] = useShareableNumbers({ capacity: 13.5, rtEff: 90, dod: 90, dailyLoad: 10 });

  const usable = capacity * dod / 100; const delivered = usable * rtEff / 100;
  const hoursBackup = delivered / (dailyLoad / 24); const cycles = 6000; const lifetimeThroughput = cycles * delivered;

  useEffect(() => {
    const W = 480, H = 260; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // battery graphic
    const bx = 60, by = 60, bw = 120, bh = 140; ctx.strokeStyle = "#64748b"; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh); ctx.fillStyle = "#64748b"; ctx.fillRect(bx + bw / 2 - 15, by - 10, 30, 10);
    const fillH = bh * dod / 100; ctx.fillStyle = "#a3e635"; ctx.fillRect(bx + 4, by + bh - fillH + 4, bw - 8, fillH - 8);
    ctx.fillStyle = "#0b1220"; ctx.font = "bold 14px sans-serif"; ctx.fillText(`${dod}%`, bx + bw / 2 - 14, by + bh - fillH / 2);
    // flow arrows
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("usable capacity", bx, by + bh + 24);
    ctx.fillText(`round-trip ${rtEff}%`, 260, 100); ctx.fillText(`→ ${delivered.toFixed(1)} kWh delivered`, 260, 130); ctx.fillText(`per full cycle`, 260, 150);
  }, [capacity, rtEff, dod, dailyLoad]);

  const dodLoss = capacity * (1 - dod / 100); const rtLoss = usable * (1 - rtEff / 100);
  const explain = `Usable energy is capacity × depth-of-discharge × round-trip efficiency, so only ${delivered.toFixed(1)} of ${capacity} kWh (${((delivered / capacity) * 100).toFixed(0)}%) reaches your home each cycle — ${dodLoss > rtLoss ? "the discharge limit removes more here than efficiency does" : "round-trip inefficiency removes more here than the discharge limit does"}.`;

  const code = `cap, rt_eff, dod, load = ${capacity}, ${rtEff}, ${dod}, ${dailyLoad}
usable = cap * dod / 100
delivered = usable * rt_eff / 100
backup_hr = delivered / (load / 24)
lifetime_MWh = 6000 * delivered / 1000
print("delivered", delivered, "backup_hr", backup_hr)`;

  return (
    <StudioChrome title="Battery Energy Storage" tagline="capacity, efficiency & backup"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Capacity (kWh)" value={capacity} min={2} max={100} step={0.5} onChange={(v) => update({ capacity: v })} />
        <Slider label="Round-trip efficiency (%)" value={rtEff} min={70} max={98} step={1} onChange={(v) => update({ rtEff: v })} />
        <Slider label="Depth of discharge (%)" value={dod} min={50} max={100} step={5} onChange={(v) => update({ dod: v })} />
        <Slider label="Daily load from battery (kWh)" value={dailyLoad} min={1} max={40} step={1} onChange={(v) => update({ dailyLoad: v })} />
        <p className="mt-3 text-xs text-slate-500">A battery&apos;s rated capacity is not all usable: depth-of-discharge limits protect its life, and round-trip efficiency means some energy is lost charging and discharging. What actually reaches your home is capacity × depth-of-discharge × round-trip efficiency. Together with cycle life, these set backup duration and the cost per stored kilowatt-hour.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Usable capacity" value={`${usable.toFixed(1)} kWh`} /><Stat label="Delivered / cycle" value={`${delivered.toFixed(1)} kWh`} /><Stat label="Backup time" value={`${hoursBackup.toFixed(1)} hr`} /><Stat label="Lifetime throughput" value={`${(lifetimeThroughput / 1000).toFixed(0)} MWh`} /><Equation tex={`E_{\\text{del}} = C \\cdot \\text{DoD} \\cdot \\eta_{rt} = ${capacity} \\times ${(dod / 100).toFixed(2)} \\times ${(rtEff / 100).toFixed(2)} = ${delivered.toFixed(1)}\\ \\text{kWh}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={480} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
