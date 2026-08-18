"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;
type State = 0 | 1 | 2; // S, I, R

const PRESETS: Record<string, { beta: number; gamma: number; radius: number }> = {
  "Slow burn": { beta: 0.03, gamma: 0.02, radius: 45 },
  "Superspreader": { beta: 0.15, gamma: 0.01, radius: 80 },
  "Quick recovery": { beta: 0.08, gamma: 0.04, radius: 60 },
  "Sparse contacts": { beta: 0.12, gamma: 0.01, radius: 35 },
};

export function EpidemicNetworkStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const net = useRef<{ x: number; y: number; s: State }[]>([]);
  const edges = useRef<[number, number][]>([]);
  const [{ beta, gamma, radius }, update] = useShareableNumbers({ beta: 0.06, gamma: 0.01, radius: 60 });
  const betaRef = useRef(beta); betaRef.current = beta;
  const gammaRef = useRef(gamma); gammaRef.current = gamma;
  const [counts, setCounts] = useState({ s: 0, i: 0, r: 0 });
  const tick = useRef(0);

  const ratio = beta / gamma;
  const explain =
    ratio >= 8
      ? `Transmission outruns recovery about ${ratio.toFixed(0)}-to-1; with this connectivity the infection should sweep most of the network before it burns out.`
      : ratio <= 3
      ? `Recovery nearly keeps pace with spread (β/γ ≈ ${ratio.toFixed(1)}), so outbreaks tend to fizzle early unless contacts are dense enough to chain new infections.`
      : `Spread outpaces recovery by ${ratio.toFixed(1)}-to-1 — an epidemic grows, but whether it reaches everyone hinges on the contact radius wiring nodes together.`;

  const code = `beta, gamma, N = ${beta}, ${gamma}, 220
S, I, R = N - 1, 1, 0
for _ in range(600):                 # mean-field SIR approximation
    ni = beta * S * I / N; nr = gamma * I
    S -= ni; I += ni - nr; R += nr
print("total ever infected:", round(R))`;

  const build = () => {
    const n = 220; const nodes = Array.from({ length: n }, () => ({ x: 30 + Math.random() * (W - 60), y: 30 + Math.random() * (H - 60), s: 0 as State }));
    nodes[(Math.random() * n) | 0].s = 1;
    const e: [number, number][] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if ((nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2 < radius * radius) e.push([i, j]);
    net.current = nodes; edges.current = e; tick.current = 0;
  };
  useEffect(() => { build(); /* eslint-disable-next-line */ }, [radius]);

  const frame = (steps: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H);
    const nodes = net.current, es = edges.current;
    const b = betaRef.current, gm = gammaRef.current;
    for (let st = 0; st < steps; st++) {
      tick.current++;
      if (tick.current % 3 === 0) {
        const next = nodes.map((nd) => nd.s);
        for (const [a, b2] of es) { if (nodes[a].s === 1 && nodes[b2].s === 0 && Math.random() < b) next[b2] = 1; if (nodes[b2].s === 1 && nodes[a].s === 0 && Math.random() < b) next[a] = 1; }
        for (let i = 0; i < nodes.length; i++) if (nodes[i].s === 1 && Math.random() < gm) next[i] = 2;
        nodes.forEach((nd, i) => (nd.s = next[i]));
      }
    }
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148,163,184,0.12)"; ctx.lineWidth = 0.5; ctx.beginPath(); for (const [a, b2] of es) { ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b2].x, nodes[b2].y); } ctx.stroke();
    let s = 0, ii = 0, r = 0;
    for (const nd of nodes) { const col = nd.s === 0 ? "#38bdf8" : nd.s === 1 ? "#f87171" : "#a3e635"; nd.s === 0 ? s++ : nd.s === 1 ? ii++ : r++; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(nd.x, nd.y, 4, 0, 7); ctx.fill(); }
    if (tick.current % 6 === 0) setCounts({ s, i: ii, r });
  };

  const t = useTransport(frame);

  return (
    <StudioChrome title="Epidemic on a Network" tagline="agent-based SIR on a contact graph"
      controls={<div>
        <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={() => { build(); t.step(); }} speed={t.speed} onSpeed={t.setSpeed} />
        <p className="mb-3 text-xs text-slate-500">Infection spreads along the contact network (red = infected, blue = susceptible, green = recovered). Tune transmission, recovery, and connectivity.</p>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="Transmission β" value={beta} min={0.01} max={0.2} step={0.01} onChange={(v) => update({ beta: v })} />
        <Slider label="Recovery γ" value={gamma} min={0.002} max={0.05} step={0.002} onChange={(v) => update({ gamma: v })} />
        <Slider label="Contact radius" value={radius} min={30} max={90} step={5} onChange={(v) => update({ radius: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Susceptible" value={String(counts.s)} /><Stat label="Infected" value={String(counts.i)} /><Stat label="Recovered" value={String(counts.r)} /><Stat label="Edges" value={String(edges.current.length)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
