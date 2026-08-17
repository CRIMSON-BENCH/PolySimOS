"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const C = 343;
export function RoomModesStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [Lx, setLx] = useState(5);
  const [Ly, setLy] = useState(4);
  const [Lz, setLz] = useState(2.8);

  const modes: { f: number; type: string }[] = [];
  for (let nx = 0; nx <= 4; nx++) for (let ny = 0; ny <= 4; ny++) for (let nz = 0; nz <= 3; nz++) {
    if (nx + ny + nz === 0) continue; const f = (C / 2) * Math.sqrt((nx / Lx) ** 2 + (ny / Ly) ** 2 + (nz / Lz) ** 2);
    const nz3 = [nx, ny, nz].filter((v) => v > 0).length; if (f < 200) modes.push({ f, type: nz3 === 1 ? "axial" : nz3 === 2 ? "tangential" : "oblique" });
  }
  modes.sort((a, b) => a.f - b.f);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 540, H = 240; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 30, oy = H - 40, pw = W - 50; const fMax = 200;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.stroke();
    const col = { axial: "#22d3ee", tangential: "#a3e635", oblique: "#64748b" } as Record<string, string>;
    modes.forEach((mo) => { const x = ox + (mo.f / fMax) * pw; ctx.strokeStyle = col[mo.type]; ctx.lineWidth = mo.type === "axial" ? 2.5 : 1.5; ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy - (mo.type === "axial" ? 120 : mo.type === "tangential" ? 70 : 35)); ctx.stroke(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("room modes below 200 Hz", ox, 18); ctx.fillText("frequency (Hz) →", ox + pw - 100, oy + 20);
    ctx.fillStyle = "#22d3ee"; ctx.fillText("axial", ox, 34); ctx.fillStyle = "#a3e635"; ctx.fillText("tangential", ox + 44, 34);
  }, [Lx, Ly, Lz]);

  const first = modes[0]?.f ?? 0;
  return (
    <StudioChrome title="Room Acoustic Modes" tagline="standing waves in a room"
      controls={<div>
        <Slider label="Length Lx (m)" value={Lx} min={2} max={12} step={0.1} onChange={setLx} />
        <Slider label="Width Ly (m)" value={Ly} min={2} max={10} step={0.1} onChange={setLy} />
        <Slider label="Height Lz (m)" value={Lz} min={2} max={5} step={0.1} onChange={setLz} />
        <p className="mt-3 text-xs text-slate-500">A room resonates at frequencies where sound waves fit exactly between its surfaces. These modes — axial between two walls, tangential among four, oblique among all six — cause the boomy bass and dead spots in small rooms. Even spacing sounds smooth; clustered modes cause problems. Cube-shaped rooms are the worst.</p>
      </div>}
      inspector={<div><Stat label="Lowest mode" value={`${first.toFixed(1)} Hz`} /><Stat label="Modes < 200 Hz" value={String(modes.length)} /><Stat label="Volume" value={`${(Lx * Ly * Lz).toFixed(0)} m³`} /></div>}
    ><canvas ref={canvasRef} width={540} height={240} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
