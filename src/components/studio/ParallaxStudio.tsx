"use client";

import { useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { parallax: number }> = {
  "Proxima Cen": { parallax: 0.7687 },
  Sirius: { parallax: 0.379 },
  Vega: { parallax: 0.130 },
  Betelgeuse: { parallax: 0.0055 },
};

export function ParallaxStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ parallax }, update] = useShareableNumbers({ parallax: 0.1 }); // arcsec
  const parallaxRef = useRef(parallax); parallaxRef.current = parallax;
  const phase = useRef(0);

  const distPc = 1 / parallax; // parsecs
  const distLy = distPc * 3.26156;

  const explain = `A parallax of ${parallax.toFixed(3)}″ puts this star ${distPc.toFixed(1)} pc (${distLy.toFixed(1)} ly) away — because distance is 1/p, halving the angle would double the distance, so the tiniest angles mark the most distant stars.`;

  const code = `parallax = ${parallax}  # arcseconds
dist_pc = 1 / parallax
dist_ly = dist_pc * 3.26156
print(round(dist_pc, 2), "pc", round(dist_ly, 2), "ly")`;

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    phase.current += 0.02 * steps; const t = phase.current; const W = 520, H = 360;
    const ctx = hidpi(canvas, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // sun
    const sunX = 130, sunY = H / 2; ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(sunX, sunY, 12, 0, 7); ctx.fill();
    // Earth orbit
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.ellipse(sunX, sunY, 45, 30, 0, 0, 7); ctx.stroke();
    const ex = sunX + Math.cos(t) * 45, ey = sunY + Math.sin(t) * 30; ctx.fillStyle = "#60a5fa"; ctx.beginPath(); ctx.arc(ex, ey, 5, 0, 7); ctx.fill();
    // nearby star
    const starX = 340, starY = H / 2; const shift = Math.cos(t) * Math.min(60, parallaxRef.current * 400);
    ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(starX, starY, 6, 0, 7); ctx.fill();
    // background stars (fixed)
    ctx.fillStyle = "#64748b"; for (let i = 0; i < 30; i++) { const bx = 440 + (i % 6) * 12, by = 40 + ((i / 6) | 0) * 60; ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, 7); ctx.fill(); }
    // sightline from Earth through star to background (apparent shift)
    ctx.strokeStyle = "rgba(244,114,182,0.4)"; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(490, starY + shift); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("Sun", sunX - 10, sunY + 26); ctx.fillText("nearby star", starX - 24, starY - 14); ctx.fillText("distant background", 420, 24);
  };

  const t = useTransport(frame);

  return (
    <StudioChrome title="Stellar Parallax" tagline="the first rung of the distance ladder"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} speed={t.speed} onSpeed={t.setSpeed} />
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Parallax angle (arcsec)" value={parallax} min={0.005} max={0.8} step={0.005} onChange={(v) => update({ parallax: v })} />
        <p className="mt-3 text-xs text-slate-500">As Earth orbits the Sun, a nearby star appears to shift against the distant background. Half that annual shift is the parallax angle p, and distance in parsecs is simply 1/p (with p in arcseconds). One parsec is the distance giving a one-arcsecond parallax.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Distance" value={`${distPc.toFixed(1)} pc`} /><Stat label="Light years" value={`${distLy.toFixed(1)} ly`} /><Stat label="Parallax" value={`${parallax.toFixed(3)}″`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={520} height={360} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
