"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function CellularAutomataStudio() {
  const [mode, setMode] = useState<"elementary" | "life">("elementary");
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["elementary", "life"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m === "elementary" ? "Elementary (Rule N)" : "Conway's Life"}</button>)}
      </div>
      {mode === "elementary" ? <Elementary /> : <Life />}
    </div>
  );
}

function Elementary() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rule, setRule] = useState(30);
  const N = 201, ROWS = 200;
  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, N, ROWS);
    let row = new Uint8Array(N); row[Math.floor(N / 2)] = 1;
    const img = ctx.createImageData(N, ROWS);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < N; x++) { const i = (y * N + x) * 4; const on = row[x]; img.data[i] = on ? 34 : 2; img.data[i + 1] = on ? 211 : 6; img.data[i + 2] = on ? 238 : 23; img.data[i + 3] = 255; }
      const next = new Uint8Array(N);
      for (let x = 0; x < N; x++) { const l = row[(x - 1 + N) % N], c = row[x], r = row[(x + 1) % N]; const idx = (l << 2) | (c << 1) | r; next[x] = (rule >> idx) & 1; }
      row = next;
    }
    ctx.putImageData(img, 0, 0);
  }, [rule]);
  return (
    <StudioChrome title="Elementary Cellular Automaton" tagline={`Wolfram rule ${rule}`}
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">One rule, 256 possibilities. Rule 30 makes chaos; Rule 90 makes a Sierpiński triangle; Rule 110 is Turing-complete.</p>
        <Slider label="Rule number" value={rule} min={0} max={255} step={1} onChange={setRule} />
        <div className="mt-2 flex flex-wrap gap-1">{[30, 90, 110, 54, 150, 184].map((r) => <button key={r} onClick={() => setRule(r)} className="rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">Rule {r}</button>)}</div>
      </div>}
      inspector={<div><Stat label="Rule" value={String(rule)} /><Stat label="Cells" value={String(N)} /><Stat label="Class" value={rule === 30 || rule === 110 ? "chaotic/complex" : "structured"} /></div>}
    ><canvas ref={canvasRef} width={N} height={ROWS} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} /></StudioChrome>
  );
}

function Life() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Uint8Array>(new Uint8Array(120 * 120));
  const rafRef = useRef(0);
  const [running, setRunning] = useState(true);
  const [gen, setGen] = useState(0);
  const N = 120;
  const seed = () => { const g = new Uint8Array(N * N); for (let i = 0; i < N * N; i++) g[i] = Math.random() < 0.28 ? 1 : 0; gridRef.current = g; setGen(0); };
  useEffect(() => { seed(); }, []);
  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const img = ctx.createImageData(N, N); let frame = 0;
    const loop = () => {
      const g = gridRef.current;
      if (running && frame % 3 === 0) {
        const n = new Uint8Array(N * N);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx || dy) c += g[((y + dy + N) % N) * N + (x + dx + N) % N]; } const alive = g[y * N + x]; n[y * N + x] = (alive && (c === 2 || c === 3)) || (!alive && c === 3) ? 1 : 0; }
        gridRef.current = n; setGen((v) => v + 1);
      }
      const gg = gridRef.current;
      for (let i = 0; i < N * N; i++) { const on = gg[i]; img.data[i * 4] = on ? 163 : 2; img.data[i * 4 + 1] = on ? 230 : 6; img.data[i * 4 + 2] = on ? 53 : 23; img.data[i * 4 + 3] = 255; }
      ctx.putImageData(img, 0, 0); frame++; rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(rafRef.current);
  }, [running]);
  return (
    <StudioChrome title="Conway's Game of Life" tagline="cellular automaton · emergent complexity"
      controls={<div>
        <div className="mb-3 flex gap-2"><button onClick={() => setRunning((v) => !v)} className="flex-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-cyan-700">{running ? "Pause" : "Play"}</button><button onClick={seed} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Randomize</button></div>
        <p className="text-xs text-slate-500">Four simple rules produce gliders, oscillators, and endless emergent structure.</p>
      </div>}
      inspector={<div><Stat label="Grid" value={`${N}×${N}`} /><Stat label="Generation" value={String(gen)} /></div>}
    ><canvas ref={canvasRef} width={N} height={N} className="mx-auto h-auto max-h-[440px] rounded-lg" style={{ imageRendering: "pixelated", width: "440px" }} /></StudioChrome>
  );
}
