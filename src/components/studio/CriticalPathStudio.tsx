"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

// Critical Path Method on a small fixed project network.
type Task = { id: string; dur: number; deps: string[]; x: number; y: number };

export function CriticalPathStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [durB, setDurB] = useState(4);
  const [durD, setDurD] = useState(5);

  const tasks: Task[] = [
    { id: "A", dur: 3, deps: [], x: 60, y: 90 },
    { id: "B", dur: durB, deps: ["A"], x: 200, y: 50 },
    { id: "C", dur: 2, deps: ["A"], x: 200, y: 150 },
    { id: "D", dur: durD, deps: ["B", "C"], x: 340, y: 90 },
    { id: "E", dur: 2, deps: ["C"], x: 340, y: 180 },
    { id: "F", dur: 3, deps: ["D", "E"], x: 470, y: 120 },
  ];
  const map = Object.fromEntries(tasks.map((t) => [t.id, t]));
  const es: Record<string, number> = {}; const ef: Record<string, number> = {};
  const order = ["A", "B", "C", "D", "E", "F"];
  order.forEach((id) => { const t = map[id]; es[id] = t.deps.length ? Math.max(...t.deps.map((d) => ef[d])) : 0; ef[id] = es[id] + t.dur; });
  const projDur = Math.max(...Object.values(ef));
  // latest finish backward
  const lf: Record<string, number> = {}; const ls: Record<string, number> = {};
  [...order].reverse().forEach((id) => { const succ = tasks.filter((t) => t.deps.includes(id)); lf[id] = succ.length ? Math.min(...succ.map((s) => ls[s.id])) : projDur; ls[id] = lf[id] - map[id].dur; });
  const critical = new Set(order.filter((id) => Math.abs(ls[id] - es[id]) < 1e-6));

  useEffect(() => {
    const W = 540, H = 240; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    tasks.forEach((t) => t.deps.forEach((d) => { const a = map[d]; const crit = critical.has(d) && critical.has(t.id); ctx.strokeStyle = crit ? "#f472b6" : "#334155"; ctx.lineWidth = crit ? 2.5 : 1.5; ctx.beginPath(); ctx.moveTo(a.x + 24, a.y); ctx.lineTo(t.x - 24, t.y); ctx.stroke(); }));
    tasks.forEach((t) => { ctx.fillStyle = critical.has(t.id) ? "#f472b6" : "#22d3ee"; ctx.beginPath(); ctx.arc(t.x, t.y, 24, 0, 7); ctx.fill(); ctx.fillStyle = "#0b1220"; ctx.font = "bold 14px sans-serif"; ctx.fillText(t.id, t.x - 5, t.y - 2); ctx.font = "9px sans-serif"; ctx.fillText(`${t.dur}d`, t.x - 7, t.y + 10); });
    ctx.fillStyle = "#f9a8d4"; ctx.font = "11px sans-serif"; ctx.fillText("critical path (pink) — zero slack", 14, 20);
  }, [durB, durD]);

  return (
    <StudioChrome title="Critical Path Method" tagline="project scheduling"
      controls={<div>
        <Slider label="Task B duration (days)" value={durB} min={1} max={10} step={1} onChange={setDurB} />
        <Slider label="Task D duration (days)" value={durD} min={1} max={10} step={1} onChange={setDurD} />
        <p className="mt-3 text-xs text-slate-500">The Critical Path Method finds the longest chain of dependent tasks through a project — the sequence that sets the minimum completion time. Tasks on it have zero slack: delay any one and the whole project slips. Tasks off it can float. Stretch task B or D and watch the critical path re-route. The backbone of project management.</p>
      </div>}
      inspector={<div><Stat label="Project duration" value={`${projDur} days`} /><Stat label="Critical tasks" value={[...critical].join(", ")} /><Stat label="Tasks" value={String(tasks.length)} /></div>}
    ><canvas ref={canvasRef} width={540} height={240} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
