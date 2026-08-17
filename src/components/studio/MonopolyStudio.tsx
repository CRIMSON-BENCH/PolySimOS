"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Monopoly: demand P=a-bQ, MR=a-2bQ, MC constant. Monopolist sets MR=MC.
export function MonopolyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mc, setMc] = useState(30);
  const a = 100, b = 1;
  const qm = (a - mc) / (2 * b); const pm = a - b * qm; // monopoly
  const qc = (a - mc) / b; // competitive (P=MC)
  const dwl = 0.5 * (qc - qm) * (pm - mc); const profit = (pm - mc) * qm;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 360; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const qMax = 100, pMax = 110;
    const X = (q: number) => ox + (q / qMax) * pw; const Y = (p: number) => oy - (p / pMax) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    // DWL
    ctx.fillStyle = "rgba(239,68,68,0.25)"; ctx.beginPath(); ctx.moveTo(X(qm), Y(pm)); ctx.lineTo(X(qc), Y(mc)); ctx.lineTo(X(qm), Y(mc)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(a)); ctx.lineTo(X(a / b), Y(0)); ctx.stroke(); // demand
    ctx.strokeStyle = "#a3e635"; ctx.beginPath(); ctx.moveTo(X(0), Y(a)); ctx.lineTo(X(a / (2 * b)), Y(0)); ctx.stroke(); // MR
    ctx.strokeStyle = "#fbbf24"; ctx.beginPath(); ctx.moveTo(X(0), Y(mc)); ctx.lineTo(X(qMax), Y(mc)); ctx.stroke(); // MC
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(qm), Y(pm), 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("demand", ox + pw - 50, Y(0) - 10); ctx.fillStyle = "#bef264"; ctx.fillText("MR", X(a / (2 * b)) - 20, oy - 6); ctx.fillStyle = "#fde68a"; ctx.fillText("MC", ox + 6, Y(mc) - 4); ctx.fillStyle = "#fca5a5"; ctx.fillText("deadweight loss", X(qm) + 6, Y(mc) - 20);
  }, [mc]);

  return (
    <StudioChrome title="Monopoly Pricing" tagline="market power & deadweight loss"
      controls={<div>
        <Slider label="Marginal cost" value={mc} min={0} max={80} step={2} onChange={setMc} />
        <p className="mt-3 text-xs text-slate-500">A monopolist maximizes profit where marginal revenue equals marginal cost — then charges the price the demand curve allows. Because MR lies below demand, the monopoly produces less and charges more than a competitive market (where price equals MC). The red triangle is the deadweight loss: mutually beneficial trades that never happen.</p>
      </div>}
      inspector={<div><Stat label="Monopoly price" value={`$${pm.toFixed(1)}`} /><Stat label="Monopoly qty" value={qm.toFixed(1)} /><Stat label="Competitive qty" value={qc.toFixed(1)} /><Stat label="Deadweight loss" value={dwl.toFixed(0)} /><Stat label="Profit" value={profit.toFixed(0)} /></div>}
    ><canvas ref={canvasRef} width={500} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
