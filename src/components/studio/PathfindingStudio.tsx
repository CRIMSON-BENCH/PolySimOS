"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi } from "@/lib/studioKit";

const COLS = 48, ROWS = 30, CELL = 15;

export function PathfindingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const walls = useRef<Set<number>>(new Set());
  const [algo, setAlgo] = useState<"astar" | "dijkstra">("astar");
  const [tick, setTick] = useState(0);
  const paint = useRef(false);

  const run = () => {
    const start = 0, goal = COLS * ROWS - 1;
    const h = (i: number) => { const x = i % COLS, y = (i / COLS) | 0; const gx = goal % COLS, gy = (goal / COLS) | 0; return Math.abs(x - gx) + Math.abs(y - gy); };
    const open = new Set([start]); const came = new Map<number, number>(); const g = new Map([[start, 0]]); const visited = new Set<number>();
    while (open.size) {
      let cur = -1, best = Infinity; for (const i of open) { const f = (g.get(i) ?? Infinity) + (algo === "astar" ? h(i) : 0); if (f < best) { best = f; cur = i; } }
      if (cur === goal) break; open.delete(cur); visited.add(cur);
      const x = cur % COLS, y = (cur / COLS) | 0; const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      for (const [nx, ny] of nb) { if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue; const ni = ny * COLS + nx; if (walls.current.has(ni)) continue; const ng = (g.get(cur) ?? Infinity) + 1; if (ng < (g.get(ni) ?? Infinity)) { came.set(ni, cur); g.set(ni, ng); open.add(ni); } }
    }
    const path = new Set<number>(); let c = goal; while (came.has(c)) { path.add(c); c = came.get(c)!; }
    return { visited, path };
  };

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, COLS * CELL, ROWS * CELL);
    const { visited, path } = run();
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    for (let i = 0; i < COLS * ROWS; i++) { const x = (i % COLS) * CELL, y = ((i / COLS) | 0) * CELL; let col = "#0b1220"; if (walls.current.has(i)) col = "#475569"; else if (path.has(i)) col = "#a3e635"; else if (visited.has(i)) col = "rgba(34,211,238,0.35)"; if (i === 0) col = "#22d3ee"; if (i === COLS * ROWS - 1) col = "#f472b6"; ctx.fillStyle = col; ctx.fillRect(x, y, CELL - 1, CELL - 1); }
  }, [algo, tick]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const at = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * COLS), y = Math.floor((e.clientY - r.top) / r.height * ROWS); const i = y * COLS + x; if (i > 0 && i < COLS * ROWS - 1) { walls.current.add(i); setTick((t) => t + 1); } };
    const down = (e: PointerEvent) => { paint.current = true; at(e); }; const move = (e: PointerEvent) => { if (paint.current) at(e); }; const up = () => (paint.current = false);
    canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  const explain = algo === "astar"
    ? "A* adds the Manhattan-distance heuristic to Dijkstra, so it aims straight at the goal and expands far fewer cells while still returning a shortest path."
    : "Dijkstra ignores where the goal is and expands outward uniformly — it finds the same shortest path as A*, but explores many more cells to get there.";

  const code = `import heapq
COLS, ROWS = ${COLS}, ${ROWS}
algo = ${JSON.stringify(algo)}
walls = set()            # add wall indices here
start, goal = 0, COLS*ROWS - 1

def h(i):
    x, y = i % COLS, i // COLS
    gx, gy = goal % COLS, goal // COLS
    return abs(x - gx) + abs(y - gy) if algo == "astar" else 0

open_pq = [(h(start), start)]
g = {start: 0}; came = {}
while open_pq:
    _, cur = heapq.heappop(open_pq)
    if cur == goal:
        break
    x, y = cur % COLS, cur // COLS
    for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
        if not (0 <= nx < COLS and 0 <= ny < ROWS):
            continue
        ni = ny*COLS + nx
        if ni in walls:
            continue
        ng = g[cur] + 1
        if ng < g.get(ni, 1e9):
            g[ni] = ng; came[ni] = cur
            heapq.heappush(open_pq, (ng + h(ni), ni))

path, c = [], goal
while c in came:
    path.append(c); c = came[c]
print("path length", len(path))`;

  return (
    <StudioChrome title="Pathfinding (A* / Dijkstra)" tagline="grid search · draw walls"
      controls={<div>
        <div className="mb-3 flex gap-2">{(["astar", "dijkstra"] as const).map((a) => <button key={a} onClick={() => setAlgo(a)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${algo === a ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{a === "astar" ? "A*" : "Dijkstra"}</button>)}</div>
        <p className="mb-3 text-xs text-slate-500">Drag on the grid to draw walls. A* uses a distance heuristic to head straight for the goal; Dijkstra explores blindly in all directions. Blue = start, pink = goal, green = shortest path.</p>
        <button onClick={() => { walls.current.clear(); setTick((t) => t + 1); }} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Clear walls</button>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Algorithm" value={algo === "astar" ? "A*" : "Dijkstra"} /><Stat label="Grid" value={`${COLS}×${ROWS}`} /><Stat label="Heuristic" value={algo === "astar" ? "Manhattan" : "none"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="mx-auto h-auto max-w-full cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
