"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const COLORS = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#c084fc", "#fb7185", "#34d399", "#60a5fa"];
const CW = 420, CH = 420;

const PRESETS: Record<string, { k: number; clusters: number }> = {
  "Perfect match": { k: 4, clusters: 4 },
  "Too few k": { k: 2, clusters: 6 },
  "Too many k": { k: 8, clusters: 3 },
  "Simple pair": { k: 2, clusters: 2 },
};

export function KMeansStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ k, clusters }, update] = useShareableNumbers({ k: 4, clusters: 4 });
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
      const canvas = canvasRef.current!; const ctx = hidpi(canvas, CW, CH); const st = state.current!;
      ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, CW, CH);
      st.pts.forEach(([x, y], i) => { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fillStyle = COLORS[st.asg[i] % COLORS.length]; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1; });
      st.cen.forEach(([x, y], j) => { ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = COLORS[j % COLORS.length]; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke(); });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running]);

  const kR = Math.round(k), cR = Math.round(clusters);
  const explain = kR === cR
    ? `k matches the ${cR} true clusters, so each centroid can settle onto one real group and inertia falls to a clean minimum.`
    : kR < cR
    ? `k (${kR}) is below the ${cR} true clusters, so at least one centroid must straddle several real groups — inertia stays high and boundaries look forced.`
    : `k (${kR}) exceeds the ${cR} true clusters, so genuine groups get split by spare centroids — inertia keeps dropping, but the extra clusters are artificial.`;

  const code = `import numpy as np
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs
X, _ = make_blobs(n_samples=${cR * 60}, centers=${cR}, cluster_std=25, random_state=${seed})
km = KMeans(n_clusters=${kR}, n_init=10).fit(X)
print("iterations:", km.n_iter_, " inertia:", km.inertia_)`;

  return (
    <StudioChrome title="k-Means Clustering" tagline="Lloyd's algorithm · live"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <Slider label="k (centroids)" value={k} min={1} max={8} step={1} onChange={(v) => update({ k: v })} />
        <Slider label="True clusters" value={clusters} min={1} max={8} step={1} onChange={(v) => update({ clusters: v })} />
        <div className="mt-3 flex gap-2"><button onClick={() => setRunning((r) => !r)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button><button onClick={() => setSeed((n) => n + 1)} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">New data</button></div>
        <p className="mt-3 text-xs text-slate-500">Lloyd&apos;s algorithm: assign each point to its nearest centroid, then move each centroid to the mean of its members. Repeat until stable. Try setting k different from the true cluster count.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Iteration" value={String(iter)} /><Stat label="Inertia" value={inertia.toExponential(2)} /><Stat label="k" value={String(Math.round(k))} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={420} height={420} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
