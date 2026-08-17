"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Two countries, two goods: PPF + comparative advantage.
export function ComparativeAdvantageStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aWine, setAWine] = useState(6); // country A wine max
  const [aCloth, setACloth] = useState(3);
  const [bWine, setBWine] = useState(2);
  const [bCloth, setBCloth] = useState(4);

  const aOppWine = aCloth / aWine; // cloth given up per wine
  const bOppWine = bCloth / bWine;
  const aAdv = aOppWine < bOppWine ? "wine" : "cloth"; const bAdv = aOppWine < bOppWine ? "cloth" : "wine";

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const ox = 45, oy = H - 35, pw = W - 65, ph = H - 55; const maxW = 8, maxC = 8;
    const X = (w: number) => ox + (w / maxW) * pw; const Y = (c: number) => oy - (c / maxC) * ph;
    ctx.strokeStyle = "#334155"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph); ctx.stroke();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(aWine), Y(0)); ctx.lineTo(X(0), Y(aCloth)); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.beginPath(); ctx.moveTo(X(bWine), Y(0)); ctx.lineTo(X(0), Y(bCloth)); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillStyle = "#67e8f9"; ctx.fillText("Country A", X(aWine) - 20, Y(0) - 8); ctx.fillStyle = "#f9a8d4"; ctx.fillText("Country B", X(0) + 10, Y(bCloth)); ctx.fillStyle = "#94a3b8"; ctx.fillText("wine →", ox + pw - 50, oy + 16); ctx.save(); ctx.translate(16, oy - ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("cloth", -18, 0); ctx.restore();
  }, [aWine, aCloth, bWine, bCloth]);

  return (
    <StudioChrome title="Comparative Advantage" tagline="the gains from trade"
      controls={<div>
        <Slider label="A max wine" value={aWine} min={1} max={8} step={1} onChange={setAWine} />
        <Slider label="A max cloth" value={aCloth} min={1} max={8} step={1} onChange={setACloth} />
        <Slider label="B max wine" value={bWine} min={1} max={8} step={1} onChange={setBWine} />
        <Slider label="B max cloth" value={bCloth} min={1} max={8} step={1} onChange={setBCloth} />
        <p className="mt-3 text-xs text-slate-500">David Ricardo&apos;s great insight: even if one country is worse at making everything, both still gain from trade. Each should specialize in the good it gives up the least to produce — its comparative advantage — measured by the slope of its production-possibility frontier. Trade then lets both consume beyond their own frontiers.</p>
      </div>}
      inspector={<div><Stat label="A opp. cost (wine)" value={`${aOppWine.toFixed(2)} cloth`} /><Stat label="B opp. cost (wine)" value={`${bOppWine.toFixed(2)} cloth`} /><Stat label="A should make" value={aAdv} /><Stat label="B should make" value={bAdv} /></div>}
    ><canvas ref={canvasRef} width={500} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
