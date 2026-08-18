"use client";

import { useEffect, useRef, useState } from "react";
import { Charge, potentialAt, traceFieldLine } from "@/lib/engines/em";
import { StudioChrome, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

const W = 640, H = 480;

export function EMStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [charges, setCharges] = useState<Charge[]>([{ x: 220, y: 240, q: 1 }, { x: 420, y: 240, q: -1 }]);
  const [sign, setSign] = useState<1 | -1>(1);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    const buf = document.createElement("canvas"); buf.width = W; buf.height = H;
    const bctx = buf.getContext("2d")!;
    const img = bctx.createImageData(W, H);
    // potential heatmap (coarse for speed)
    const step = 2;
    let minV = Infinity, maxV = -Infinity;
    const grid: number[] = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) { const v = potentialAt(charges, x, y); grid.push(v); minV = Math.min(minV, v); maxV = Math.max(maxV, v); }
    const rng = Math.max(1, maxV - minV); let gi = 0;
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
      const t = (grid[gi++] - minV) / rng; const r = t > 0.5 ? (t - 0.5) * 2 * 255 : 0; const b = t < 0.5 ? (0.5 - t) * 2 * 255 : 0;
      for (let dy = 0; dy < step; dy++) for (let dx = 0; dx < step; dx++) { const i = ((y + dy) * W + (x + dx)) * 4; img.data[i] = r * 0.7 + 10; img.data[i + 1] = 20; img.data[i + 2] = b * 0.7 + 10; img.data[i + 3] = 255; }
    }
    bctx.putImageData(img, 0, 0); ctx.drawImage(buf, 0, 0, W, H);
    // field lines from positive charges
    ctx.strokeStyle = "rgba(226,232,240,0.6)"; ctx.lineWidth = 1;
    for (const c of charges) {
      if (c.q <= 0) continue;
      for (let k = 0; k < 12; k++) { const ang = (k / 12) * Math.PI * 2; const pts = traceFieldLine(charges, c.x + Math.cos(ang) * 10, c.y + Math.sin(ang) * 10, 1, 200, W, H); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
    }
    // charges
    charges.forEach((c) => { ctx.beginPath(); ctx.fillStyle = c.q > 0 ? "#f87171" : "#60a5fa"; ctx.arc(c.x, c.y, 10, 0, 7); ctx.fill(); ctx.fillStyle = "#020617"; ctx.font = "bold 14px system-ui"; ctx.textAlign = "center"; ctx.fillText(c.q > 0 ? "+" : "−", c.x, c.y + 5); });
  }, [charges]);

  const addCharge = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    setCharges((cs) => [...cs, { x, y, q: sign }]);
  };

  return (
    <StudioChrome
      title="Electromagnetics — Electrostatics Studio"
      tagline="superposition · potential + field lines"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Click to place a charge. Red = potential from +, blue = −. White lines are the electric field.</p>
          <div className="mb-3 flex gap-2">
            <button onClick={() => setSign(1)} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${sign === 1 ? "bg-red-500 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>+ charge</button>
            <button onClick={() => setSign(-1)} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${sign === -1 ? "bg-blue-500 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>− charge</button>
          </div>
          <button onClick={() => setCharges([{ x: 220, y: 240, q: 1 }, { x: 420, y: 240, q: -1 }])} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reset (dipole)</button>
        </div>
      }
      inspector={<div><Stat label="Charges" value={String(charges.length)} /><Stat label="Net charge" value={String(charges.reduce((a, c) => a + c.q, 0))} /><Stat label="Method" value="Superposition" /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} onClick={addCharge} className="mx-auto h-auto max-h-[460px] cursor-crosshair rounded-lg" />
    </StudioChrome>
  );
}
