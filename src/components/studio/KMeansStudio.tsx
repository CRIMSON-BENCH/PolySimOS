"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const COLORS = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#c084fc", "#fb7185", "#34d399", "#60a5fa"];

export function KMeansStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(4);
  const [clusters, setClusters] = useState(4);
  const [seed, setSeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [iter, setIter] = useState(0);
  const [inertia, setInertia] = useState(0);
  const state = useRef<{ pts: [number, number][]; cen: [number, number][]; asg: number[] } | null>(null);

  const init = () => {
    let s = seed * 7919 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const trueK = Math.round(clusters); const pts: [number, number][] = [];
    for (let c = 0; c < trueK; c++) { const cx = 60 + rnd() * 300, cy = 60 + rnd() * 300; for (let i = 0; i < 60; i++) pts.push([cx + (rnd() - 0.5) * 90, cy + (rnd() - 0.5) * 90]); }
    const cen: [number, number][] = Array.from({ length: Math.round(k) }, () => [rnd() * 420, rnd() * 420]);
    state.current = { pts, cen, asg: new Array(pts.length).fill(0) }; setIter(0);
  };
  useEffect(init, [k, clusters, seed]);

  useEffect(() => {
    if (!running) return; let raf = 0; let frame = 0;
    const loop = () => {
      frame++;
      if (frame % 20 === 0) {
        const st = state.current!; let totalD = 0;
        st.asg = st.pts.map(([x, y]) => { let best = 0, bd = Infinity; st.cen.forEach(([cx, cy], j) => { const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bd) { bd = d; best = j; } }); totalD += bd; return best; });
        setInertia(totalD);
        st.cen = st.cen.map((_, j) => { const mem = st.pts.filter((_, i) => st.asg[i] === j); if (!mem.length) return st.cen[j]; return [mem.reduce((s2, p) => s2 + p[0], 0) / mem.length, mem.reduce((s2, p) => s2 + p[1], 0) / mem.length]; });
        setIter((n) => n + 1);
      }
      const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!; const st = state.current!;
      ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      st.pts.forEach(([x, y], i) => { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fillStyle = COLORS[st.asg[i] % COLORS.length]; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1; });
      st.cen.forEach(([x, y], j) => { ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = COLORS[j % COLORS.length]; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke(); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <StudioChrome title="k-Means Clustering" tagline="Lloyd's algorithm · live"
      controls={<div>
        <Slider label="k (centroids)" value={k} min={1} max={8} step={1} onChange={setK} />
        <Slider label="True clusters" value={clusters} min={1} max={8} step={1} onChange={setClusters} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={() => setSeed((n) => n + 1)} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">New data</button></div>
        <p className="mt-3 text-xs text-slate-500">Lloyd&apos;s algorithm: assign each point to its nearest centroid, then move each centroid to the mean of its members. Repeat until stable. Try setting k different from the true cluster count.</p>
      </div>}
      inspector={<div><Stat label="Iteration" value={String(iter)} /><Stat label="Inertia" value={inertia.toExponential(2)} /><Stat label="k" value={String(Math.round(k))} /></div>}
    ><canvas ref={canvasRef} width={420} height={420} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
