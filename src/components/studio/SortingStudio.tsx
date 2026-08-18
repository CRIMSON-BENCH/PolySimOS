"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi } from "@/lib/studioKit";

const W = 760, H = 480;
type Step = { arr: number[]; a: number; b: number };

function record(algo: string, base: number[]): Step[] {
  const arr = base.slice(); const steps: Step[] = [{ arr: arr.slice(), a: -1, b: -1 }];
  const snap = (a: number, b: number) => steps.push({ arr: arr.slice(), a, b });
  const swap = (i: number, j: number) => { [arr[i], arr[j]] = [arr[j], arr[i]]; };
  if (algo === "bubble") { for (let i = 0; i < arr.length; i++) for (let j = 0; j < arr.length - i - 1; j++) { if (arr[j] > arr[j + 1]) swap(j, j + 1); snap(j, j + 1); } }
  else if (algo === "insertion") { for (let i = 1; i < arr.length; i++) { let j = i; while (j > 0 && arr[j - 1] > arr[j]) { swap(j, j - 1); snap(j, j - 1); j--; } } }
  else if (algo === "selection") { for (let i = 0; i < arr.length; i++) { let m = i; for (let j = i + 1; j < arr.length; j++) { if (arr[j] < arr[m]) m = j; snap(i, j); } swap(i, m); snap(i, m); } }
  else if (algo === "quick") { const qs = (lo: number, hi: number) => { if (lo >= hi) return; const p = arr[hi]; let i = lo; for (let j = lo; j < hi; j++) { if (arr[j] < p) { swap(i, j); i++; } snap(j, hi); } swap(i, hi); snap(i, hi); qs(lo, i - 1); qs(i + 1, hi); }; qs(0, arr.length - 1); }
  return steps.slice(0, 6000);
}

export function SortingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [algo, setAlgo] = useState("quick");
  const [size, setSize] = useState(60);
  const [speed, setSpeed] = useState(4);
  const steps = useRef<Step[]>([]);
  const idx = useRef(0);
  const rafRef = useRef(0);

  const reset = () => { const base = Array.from({ length: size }, () => Math.random()); steps.current = record(algo, base); idx.current = 0; };
  useEffect(() => { reset(); /* eslint-disable-next-line */ }, [algo, size]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    const loop = () => {
      idx.current = Math.min(steps.current.length - 1, idx.current + speed);
      const step = steps.current[idx.current]; if (!step) { rafRef.current = requestAnimationFrame(loop); return; }
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const n = step.arr.length; const bw = W / n;
      for (let i = 0; i < n; i++) { const h = step.arr[i] * (H - 30); const active = i === step.a || i === step.b; ctx.fillStyle = active ? "#f472b6" : `hsl(${190 - step.arr[i] * 120},80%,60%)`; ctx.fillRect(i * bw, H - h, bw - 1, h); }
      ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`${algo} sort · step ${idx.current}/${steps.current.length - 1}`, 12, 20);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [algo, speed]);

  const explain =
    algo === "quick"
      ? `Quicksort partitions around a pivot and recurses, averaging O(n log n) — on ${size} elements it makes far fewer comparisons than the quadratic sorts.`
      : algo === "insertion"
      ? `Insertion sort grows a sorted prefix one element at a time; it is O(n²) in general but nearly linear when the ${size}-element array is almost sorted.`
      : algo === "selection"
      ? `Selection sort scans for the minimum on every pass, so it always does about ${Math.round(size * size / 2)} comparisons regardless of the starting order.`
      : `Bubble sort repeatedly swaps adjacent out-of-order pairs; simple to follow but O(n²), so ${size} elements take up to ${size * size} comparisons.`;

  const code = `def ${algo}_sort(a):
    a = a[:]
    n = len(a)
    ${
      algo === "quick"
        ? `def qs(lo, hi):
        if lo >= hi: return
        p, i = a[hi], lo
        for j in range(lo, hi):
            if a[j] < p: a[i], a[j] = a[j], a[i]; i += 1
        a[i], a[hi] = a[hi], a[i]
        qs(lo, i - 1); qs(i + 1, hi)
    qs(0, n - 1)`
        : algo === "insertion"
        ? `for i in range(1, n):
        j = i
        while j > 0 and a[j - 1] > a[j]:
            a[j], a[j - 1] = a[j - 1], a[j]; j -= 1`
        : algo === "selection"
        ? `for i in range(n):
        m = i
        for j in range(i + 1, n):
            if a[j] < a[m]: m = j
        a[i], a[m] = a[m], a[i]`
        : `for i in range(n):
        for j in range(n - i - 1):
            if a[j] > a[j + 1]: a[j], a[j + 1] = a[j + 1], a[j]`
    }
    return a

print(${algo}_sort([${size} random values]))`;

  return (
    <StudioChrome title="Sorting Algorithm Visualizer" tagline="watch algorithms sort in real time"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-1.5">{["bubble", "insertion", "selection", "quick"].map((s) => <button key={s} onClick={() => setAlgo(s)} className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${algo === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>)}</div>
        <button onClick={reset} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Shuffle & restart</button>
        <Slider label="Array size" value={size} min={20} max={140} step={10} onChange={setSize} />
        <Slider label="Speed" value={speed} min={1} max={20} step={1} onChange={setSpeed} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Algorithm" value={algo} /><Stat label="Elements" value={String(size)} /><Stat label="Complexity" value={algo === "quick" ? "O(n log n) avg" : "O(n²)"} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
