"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function BatteryStorageStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capacity, setCapacity] = useState(13.5); // kWh
  const [rtEff, setRtEff] = useState(90); // %
  const [dod, setDod] = useState(90); // depth of discharge %
  const [dailyLoad, setDailyLoad] = useState(10); // kWh/day used from battery

  const usable = capacity * dod / 100; const delivered = usable * rtEff / 100;
  const hoursBackup = delivered / (dailyLoad / 24); const cycles = 6000; const lifetimeThroughput = cycles * delivered;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 480, H = 260; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // battery graphic
    const bx = 60, by = 60, bw = 120, bh = 140; ctx.strokeStyle = "#64748b"; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh); ctx.fillStyle = "#64748b"; ctx.fillRect(bx + bw / 2 - 15, by - 10, 30, 10);
    const fillH = bh * dod / 100; ctx.fillStyle = "#a3e635"; ctx.fillRect(bx + 4, by + bh - fillH + 4, bw - 8, fillH - 8);
    ctx.fillStyle = "#0b1220"; ctx.font = "bold 14px sans-serif"; ctx.fillText(`${dod}%`, bx + bw / 2 - 14, by + bh - fillH / 2);
    // flow arrows
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("usable capacity", bx, by + bh + 24);
    ctx.fillText(`round-trip ${rtEff}%`, 260, 100); ctx.fillText(`→ ${delivered.toFixed(1)} kWh delivered`, 260, 130); ctx.fillText(`per full cycle`, 260, 150);
  }, [capacity, rtEff, dod, dailyLoad]);

  return (
    <StudioChrome title="Battery Energy Storage" tagline="capacity, efficiency & backup"
      controls={<div>
        <Slider label="Capacity (kWh)" value={capacity} min={2} max={100} step={0.5} onChange={setCapacity} />
        <Slider label="Round-trip efficiency (%)" value={rtEff} min={70} max={98} step={1} onChange={setRtEff} />
        <Slider label="Depth of discharge (%)" value={dod} min={50} max={100} step={5} onChange={setDod} />
        <Slider label="Daily load from battery (kWh)" value={dailyLoad} min={1} max={40} step={1} onChange={setDailyLoad} />
        <p className="mt-3 text-xs text-slate-500">A battery&apos;s rated capacity is not all usable: depth-of-discharge limits protect its life, and round-trip efficiency means some energy is lost charging and discharging. What actually reaches your home is capacity × depth-of-discharge × round-trip efficiency. Together with cycle life, these set backup duration and the cost per stored kilowatt-hour.</p>
      </div>}
      inspector={<div><Stat label="Usable capacity" value={`${usable.toFixed(1)} kWh`} /><Stat label="Delivered / cycle" value={`${delivered.toFixed(1)} kWh`} /><Stat label="Backup time" value={`${hoursBackup.toFixed(1)} hr`} /><Stat label="Lifetime throughput" value={`${(lifetimeThroughput / 1000).toFixed(0)} MWh`} /></div>}
    ><canvas ref={canvasRef} width={480} height={260} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
