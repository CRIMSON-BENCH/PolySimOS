"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { step: number }> = {
  "Fine": { step: 10 },
  "Balanced": { step: 18 },
  "Coarse": { step: 30 },
  "Jumpy": { step: 40 },
};

// Rapidly-exploring Random Tree path planner.
export function RRTStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ step }, update] = useShareableNumbers({ step: 18 });
  const [seed, setSeed] = useState(1);
  const [stats, setStats] = useState({ nodes: 0, found: false, len: 0 });

  useEffect(() => {
    const W = 540, H = 400; let s = seed * 1299709 >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const obstacles = [[120, 90, 70], [330, 130, 60], [200, 280, 55], [400, 300, 50]]; // x,y,r
    const hit = (x: number, y: number) => obstacles.some(([ox, oy, r]) => Math.hypot(x - ox, y - oy) < r);
    const collideSeg = (ax: number, ay: number, bx: number, by: number) => { for (let t = 0; t <= 1; t += 0.1) if (hit(ax + (bx - ax) * t, ay + (by - ay) * t)) return true; return false; };
    const start: [number, number] = [30, 30], goal: [number, number] = [500, 370];
    const nodes: { x: number; y: number; p: number }[] = [{ x: start[0], y: start[1], p: -1 }];
    let goalIdx = -1;
    for (let iter = 0; iter < 3000 && goalIdx < 0; iter++) {
      const rx = rnd() < 0.1 ? goal[0] : rnd() * W, ry = rnd() < 0.1 ? goal[1] : rnd() * H;
      let best = 0, bd = Infinity; nodes.forEach((n, i) => { const d = (n.x - rx) ** 2 + (n.y - ry) ** 2; if (d < bd) { bd = d; best = i; } });
      const nn = nodes[best]; const ang = Math.atan2(ry - nn.y, rx - nn.x); const nx = nn.x + Math.cos(ang) * step, ny = nn.y + Math.sin(ang) * step;
      if (nx < 0 || ny < 0 || nx > W || ny > H || hit(nx, ny) || collideSeg(nn.x, nn.y, nx, ny)) continue;
      nodes.push({ x: nx, y: ny, p: best });
      if (Math.hypot(nx - goal[0], ny - goal[1]) < step) goalIdx = nodes.length - 1;
    }
    const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#334155"; obstacles.forEach(([ox, oy, r]) => { ctx.beginPath(); ctx.arc(ox, oy, r, 0, 7); ctx.fill(); });
    ctx.strokeStyle = "rgba(34,211,238,0.4)"; ctx.lineWidth = 1; nodes.forEach((n) => { if (n.p >= 0) { ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(nodes[n.p].x, nodes[n.p].y); ctx.stroke(); } });
    let len = 0;
    if (goalIdx >= 0) { ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 3; ctx.beginPath(); let i = goalIdx; ctx.moveTo(nodes[i].x, nodes[i].y); while (nodes[i].p >= 0) { len += Math.hypot(nodes[i].x - nodes[nodes[i].p].x, nodes[i].y - nodes[nodes[i].p].y); i = nodes[i].p; ctx.lineTo(nodes[i].x, nodes[i].y); } ctx.stroke(); }
    ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(start[0], start[1], 7, 0, 7); ctx.fill(); ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(goal[0], goal[1], 7, 0, 7); ctx.fill();
    setStats({ nodes: nodes.length, found: goalIdx >= 0, len });
  }, [step, seed]);

  const explain = !stats.found
    ? `No path yet at step ${step} — the tree ran out of iterations before reaching the goal. Try Replan or a smaller step.`
    : step <= 12
    ? `Small steps trace a tight, smooth path (${stats.len.toFixed(0)} units) but need many nodes (${stats.nodes}) to weave through.`
    : step >= 30
    ? `Large steps reached the goal with just ${stats.nodes} nodes, but the ${stats.len.toFixed(0)}-unit path is coarse and hugs obstacles.`
    : `A balanced step found the goal in ${stats.nodes} nodes along a ${stats.len.toFixed(0)}-unit path.`;

  const code = `import numpy as np
step, seed = ${step}, ${seed}
s = (seed*1299709) & 0xffffffff
def rnd():
    global s
    s = (s*1664525 + 1013904223) & 0xffffffff
    return s/4294967296
W, H = 540, 400
obstacles = [(120,90,70),(330,130,60),(200,280,55),(400,300,50)]
hit = lambda x,y: any((x-ox)**2+(y-oy)**2 < r*r for ox,oy,r in obstacles)
nodes = [(30.0,30.0,-1)]; goal = (500,370); gi = -1
for _ in range(3000):
    if gi >= 0: break
    rx = goal[0] if rnd()<0.1 else rnd()*W
    ry = goal[1] if rnd()<0.1 else rnd()*H
    b = min(range(len(nodes)), key=lambda i:(nodes[i][0]-rx)**2+(nodes[i][1]-ry)**2)
    a = np.arctan2(ry-nodes[b][1], rx-nodes[b][0])
    nx, ny = nodes[b][0]+np.cos(a)*step, nodes[b][1]+np.sin(a)*step
    if hit(nx,ny): continue
    nodes.append((nx,ny,b))
    if np.hypot(nx-goal[0], ny-goal[1]) < step: gi = len(nodes)-1
print("nodes", len(nodes), "found", gi>=0)`;

  return (
    <StudioChrome title="RRT Path Planning" tagline="rapidly-exploring random tree"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Step size" value={step} min={8} max={40} step={2} onChange={(v) => update({ step: v })} />
        <button onClick={() => setSeed((k) => k + 1)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">Replan</button>
        <p className="mt-3 text-xs text-slate-500">A Rapidly-exploring Random Tree grows toward random points in free space, quickly filling the map and snaking around obstacles to connect start (blue) to goal (yellow). It is a cornerstone of motion planning for robot arms, self-driving cars, and drones — fast even in high dimensions where grid search fails.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Tree nodes" value={String(stats.nodes)} /><Stat label="Path found" value={stats.found ? "yes" : "no"} /><Stat label="Path length" value={stats.len.toFixed(0)} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={540} height={400} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
