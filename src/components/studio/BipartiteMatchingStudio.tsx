"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Maximum bipartite matching (Hungarian augmenting-path).
export function BipartiteMatchingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [density, setDensity] = useState(0.4);
  const [seed, setSeed] = useState(1);
  const [matched, setMatched] = useState(0);

  useEffect(() => {
    const L = 6, R = 6; let s = seed * 7043 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const adj: number[][] = Array.from({ length: L }, () => []); const allEdges: [number, number][] = [];
    for (let i = 0; i < L; i++) for (let j = 0; j < R; j++) if (rnd() < density) { adj[i].push(j); allEdges.push([i, j]); }
    const matchR = new Array(R).fill(-1);
    const tryKuhn = (u: number, seen: boolean[]): boolean => { for (const v of adj[u]) if (!seen[v]) { seen[v] = true; if (matchR[v] < 0 || tryKuhn(matchR[v], seen)) { matchR[v] = u; return true; } } return false; };
    let m = 0; for (let u = 0; u < L; u++) { const seen = new Array(R).fill(false); if (tryKuhn(u, seen)) m++; }
    setMatched(m);
    const ctx = hidpi(canvasRef.current!, 460, 340); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 460, 340);
    const lx = 120, rx = 340; const ly = (i: number) => 50 + i * 48, ry = (i: number) => 50 + i * 48;
    const matchSet = new Set(matchR.map((u, v) => u >= 0 ? `${u}-${v}` : "").filter(Boolean));
    allEdges.forEach(([u, v]) => { const on = matchSet.has(`${u}-${v}`); ctx.strokeStyle = on ? "#a3e635" : "#334155"; ctx.lineWidth = on ? 3 : 1; ctx.beginPath(); ctx.moveTo(lx, ly(u)); ctx.lineTo(rx, ry(v)); ctx.stroke(); });
    for (let i = 0; i < L; i++) { ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(lx, ly(i), 12, 0, 7); ctx.fill(); ctx.fillStyle = "#0b1220"; ctx.font = "bold 11px sans-serif"; ctx.fillText(`W${i + 1}`, lx - 9, ly(i) + 4); }
    for (let i = 0; i < R; i++) { ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(rx, ry(i), 12, 0, 7); ctx.fill(); ctx.fillStyle = "#0b1220"; ctx.font = "bold 11px sans-serif"; ctx.fillText(`J${i + 1}`, rx - 8, ry(i) + 4); }
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("workers", lx - 24, 30); ctx.fillText("jobs", rx - 12, 30);
  }, [density, seed]);

  return (
    <StudioChrome title="Bipartite Matching" tagline="assignment problem"
      controls={<div>
        <Slider label="Edge density" value={density} min={0.2} max={0.8} step={0.05} onChange={setDensity} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">New graph</button>
        <p className="mt-3 text-xs text-slate-500">Maximum bipartite matching pairs items from two groups — workers to jobs, students to schools, organs to recipients — so that as many valid pairings as possible are made, with no one assigned twice. Kuhn&apos;s algorithm repeatedly finds augmenting paths that improve the matching. The green edges are the optimal assignment.</p>
      </div>}
      inspector={<div><Stat label="Matched pairs" value={String(matched)} /><Stat label="Max possible" value="6" /><Stat label="Method" value="augmenting paths" /></div>}
    ><canvas ref={canvasRef} width={460} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
