"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Chladni plate nodal patterns: superposition of plate modes.
export function ChladniStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [m, setM] = useState(3);
  const [n, setN] = useState(2);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const S = 400; const img = ctx.createImageData(S, S);
    const M = Math.round(m), N = Math.round(n);
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
      const x = px / S, y = py / S;
      const val = Math.cos(N * Math.PI * x) * Math.cos(M * Math.PI * y) - Math.cos(M * Math.PI * x) * Math.cos(N * Math.PI * y);
      const nodal = Math.abs(val); const t = Math.max(0, 1 - nodal * 8); // sand collects where val≈0
      const idx = (py * S + px) * 4; const c = 11 + t * 230; img.data[idx] = c; img.data[idx + 1] = c * 0.95 + t * 10; img.data[idx + 2] = c * 0.8; img.data[idx + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = "#334155"; ctx.strokeRect(0, 0, S, S);
    ctx.fillStyle = "#22d3ee"; ctx.font = "13px sans-serif"; ctx.fillText(`mode (${N}, ${M}) — sand gathers on the nodal lines`, 10, S - 12);
  }, [m, n]);

  return (
    <StudioChrome title="Chladni Plate Patterns" tagline="visible standing waves"
      controls={<div>
        <Slider label="Mode m" value={m} min={1} max={7} step={1} onChange={setM} />
        <Slider label="Mode n" value={n} min={1} max={7} step={1} onChange={setN} />
        <p className="mt-3 text-xs text-slate-500">Bow or drive a metal plate at a resonant frequency and sand sprinkled on top dances away from the moving areas and settles along the still nodal lines — Chladni figures. Each pair of mode numbers gives a different symmetric pattern, a direct, physical picture of a two-dimensional standing wave.</p>
      </div>}
      inspector={<div><Stat label="Mode" value={`(${Math.round(n)}, ${Math.round(m)})`} /><Stat label="Symmetry" value={(Math.round(m) + Math.round(n)) % 2 === 0 ? "even" : "odd"} /><Stat label="Pattern" value="nodal lines" /></div>}
    ><canvas ref={canvasRef} width={400} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
