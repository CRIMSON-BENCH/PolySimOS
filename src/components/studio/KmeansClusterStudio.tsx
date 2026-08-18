"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const rnd = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;
const COLORS = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#c084fc"];
const TRUE_BLOBS = 4;

const PRESETS: Record<string, { k: number; iters: number }> = {
  "Two clusters (k=2)": { k: 2, iters: 8 },
  "Three clusters": { k: 3, iters: 8 },
  "Over-clustered (k too high)": { k: 5, iters: 8 },
  "Many points": { k: 4, iters: 12 },
};

export function KmeansClusterStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [{ k, iters }, update] = useShareableNumbers({ k: 3, iters: 6 });
  const pts: { x: number; y: number }[] = [];
  for (let b = 0; b < 4; b++) for (let i = 0; i < 20; i++) pts.push({ x: rnd(b * 50 + i * 3 + 1) * 0.6 + [0.15, 0.7, 0.2, 0.75][b], y: rnd(b * 50 + i * 7 + 2) * 0.6 + [0.15, 0.2, 0.75, 0.7][b] });

  useEffect(() => {
    const W = 520, H = 320; const ctx = hidpi(c.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // init centroids deterministically, run k-means for `iters`
    let cent = Array.from({ length: k }, (_, i) => ({ x: 0.2 + 0.6 * rnd(i * 13 + 5), y: 0.2 + 0.6 * rnd(i * 17 + 9) }));
    let assign = pts.map(() => 0);
    for (let it = 0; it < iters; it++) {
      assign = pts.map(p => { let best = 0, bd = 1e9; cent.forEach((c2, ci) => { const d = (p.x - c2.x) ** 2 + (p.y - c2.y) ** 2; if (d < bd) { bd = d; best = ci; } }); return best; });
      cent = cent.map((_, ci) => { const cl = pts.filter((_, i) => assign[i] === ci); if (!cl.length) return cent[ci]; return { x: cl.reduce((a, p) => a + p.x, 0) / cl.length, y: cl.reduce((a, p) => a + p.y, 0) / cl.length }; });
    }
    const px = (v: number) => 40 + v * (W - 80), py = (v: number) => 30 + v * (H - 60);
    pts.forEach((p, i) => { ctx.fillStyle = COLORS[assign[i] % COLORS.length]; ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 4, 0, Math.PI * 2); ctx.fill(); });
    cent.forEach((c2, ci) => { ctx.fillStyle = COLORS[ci % COLORS.length]; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px(c2.x), py(c2.y), 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`k-means · ${k} clusters · ${iters} iterations (large dots = centroids)`, 12, 20);
  }, [k, iters]);

  const explain =
    k === TRUE_BLOBS
      ? `With k = ${k} matching the ${TRUE_BLOBS} true blobs, Lloyd’s algorithm alternates assign-to-nearest and move-to-mean and settles into clean, well-separated clusters within a few iterations.`
      : k < TRUE_BLOBS
      ? `k = ${k} is fewer than the ${TRUE_BLOBS} true blobs, so Lloyd’s algorithm is forced to merge neighbouring groups into one cluster and real structure is lost. Try k = ${TRUE_BLOBS}.`
      : `k = ${k} exceeds the ${TRUE_BLOBS} true blobs, so at least one real group is split across centroids. Which split you get depends on where the ${k} centroids were initialised.`;

  const code = `from sklearn.cluster import KMeans
import numpy as np

# ${pts.length} points, ${TRUE_BLOBS} true blobs in this demo
X = np.random.rand(${pts.length}, 2)

km = KMeans(n_clusters=${k}, n_init=10, max_iter=${iters}).fit(X)
labels, centroids = km.labels_, km.cluster_centers_
print("inertia", km.inertia_)`;

  return (
    <StudioChrome title="k-Means Clustering" tagline="finding groups in data"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Number of clusters k" value={k} min={2} max={5} step={1} onChange={(v) => update({ k: v })} />
        <Slider label="Iterations" value={iters} min={0} max={15} step={1} onChange={(v) => update({ iters: v })} />
        <p className="mt-3 text-xs text-slate-500">k-means alternates two steps: assign each point to its nearest centroid, then move each centroid to the mean of its points. Repeat and the clusters snap into place. Choosing the right k, and where to start, both matter. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Clusters" value={`${k}`} />
        <Stat label="Points" value={`${pts.length}`} />
        <Stat label="Status" value={iters >= 6 ? "converged" : "still moving"} />
        <Equation tex={`J = \\sum_{k=1}^{${k}} \\sum_{x \\in C_k} \\lVert x - \\mu_k \\rVert^2, \\quad \\mu_k = \\frac{1}{|C_k|}\\sum_{x \\in C_k} x`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
