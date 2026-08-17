"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 760, H = 480;
type State = 0 | 1 | 2; // S, I, R

export function EpidemicNetworkStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const net = useRef<{ x: number; y: number; s: State }[]>([]);
  const edges = useRef<[number, number][]>([]);
  const [running, setRunning] = useState(true);
  const [beta, setBeta] = useState(0.06);
  const [gamma, setGamma] = useState(0.01);
  const [radius, setRadius] = useState(60);
  const [counts, setCounts] = useState({ s: 0, i: 0, r: 0 });
  const frame = useRef(0);

  const build = () => {
    const n = 220; const nodes = Array.from({ length: n }, () => ({ x: 30 + Math.random() * (W - 60), y: 30 + Math.random() * (H - 60), s: 0 as State }));
    nodes[(Math.random() * n) | 0].s = 1;
    const e: [number, number][] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if ((nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2 < radius * radius) e.push([i, j]);
    net.current = nodes; edges.current = e; frame.current = 0;
  };
  useEffect(() => { build(); /* eslint-disable-next-line */ }, [radius]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const loop = () => {
      const nodes = net.current, es = edges.current;
      if (running) { frame.current++;
        if (frame.current % 3 === 0) {
          const next = nodes.map((nd) => nd.s);
          for (const [a, b] of es) { if (nodes[a].s === 1 && nodes[b].s === 0 && Math.random() < beta) next[b] = 1; if (nodes[b].s === 1 && nodes[a].s === 0 && Math.random() < beta) next[a] = 1; }
          for (let i = 0; i < nodes.length; i++) if (nodes[i].s === 1 && Math.random() < gamma) next[i] = 2;
          nodes.forEach((nd, i) => (nd.s = next[i]));
        }
      }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(148,163,184,0.12)"; ctx.lineWidth = 0.5; ctx.beginPath(); for (const [a, b] of es) { ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); } ctx.stroke();
      let s = 0, ii = 0, r = 0;
      for (const nd of nodes) { const col = nd.s === 0 ? "#38bdf8" : nd.s === 1 ? "#f87171" : "#a3e635"; nd.s === 0 ? s++ : nd.s === 1 ? ii++ : r++; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(nd.x, nd.y, 4, 0, 7); ctx.fill(); }
      if (frame.current % 6 === 0) setCounts({ s, i: ii, r });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running, beta, gamma]);

  return (
    <StudioChrome title="Epidemic on a Network" tagline="agent-based SIR on a contact graph"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={build} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reseed</button></div>
        <p className="mb-3 text-xs text-slate-500">Infection spreads along the contact network (red = infected, blue = susceptible, green = recovered). Tune transmission, recovery, and connectivity.</p>
        <Slider label="Transmission β" value={beta} min={0.01} max={0.2} step={0.01} onChange={setBeta} />
        <Slider label="Recovery γ" value={gamma} min={0.002} max={0.05} step={0.002} onChange={setGamma} />
        <Slider label="Contact radius" value={radius} min={30} max={90} step={5} onChange={setRadius} />
      </div>}
      inspector={<div><Stat label="Susceptible" value={String(counts.s)} /><Stat label="Infected" value={String(counts.i)} /><Stat label="Recovered" value={String(counts.r)} /><Stat label="Edges" value={String(edges.current.length)} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
