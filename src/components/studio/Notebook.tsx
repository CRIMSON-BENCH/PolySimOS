"use client";

import { useState } from "react";
import { differentiateExpr, integrateExpr, simplifyExpr, solveRoot, evalExpr } from "@/lib/engines/cas";
import { parseMatrix, determinant, inverse, formatMatrix } from "@/lib/engines/linalg";
import { parseCSV } from "@/lib/engines/fieldmath";

type Cell = { id: number; type: "compute" | "prose"; src: string };
let cid = 0;

const STARTER: Cell[] = [
  { id: cid++, type: "prose", src: "# PolySim Notebook\nMix prose, symbolic math, and computation. Try the commands in the cells below — edit and press Run." },
  { id: cid++, type: "compute", src: "diff sin(x)*exp(-x)" },
  { id: cid++, type: "compute", src: "int x^2 + cos(x)" },
  { id: cid++, type: "compute", src: "solve x^2 - 2" },
  { id: cid++, type: "compute", src: "det 1 2; 3 4" },
  { id: cid++, type: "compute", src: "3*sin(pi/6) + 2^5" },
];

function run(src: string): string {
  const line = src.trim();
  if (!line) return "";
  const [kw, ...rest] = line.split(/\s+/);
  const arg = line.slice(kw.length).trim();
  try {
    switch (kw.toLowerCase()) {
      case "diff": return `d/dx [${arg}] = ${differentiateExpr(arg, "x")}`;
      case "int": return `∫ [${arg}] dx = ${integrateExpr(arg, "x")}`;
      case "simplify": return `${simplifyExpr(arg)}`;
      case "solve": { const r = solveRoot(arg, "x", -50, 50); return r !== null ? `root: x ≈ ${r.toFixed(6)}` : "no root found in [-50, 50]"; }
      case "det": { const M = parseMatrix(arg); return `det = ${determinant(M)}`; }
      case "inv": { const M = parseMatrix(arg); return "inverse =\n" + formatMatrix(inverse(M)); }
      default: {
        // try constant evaluation, else simplify
        try { const v = evalExpr(line, {}); if (isFinite(v)) return `= ${Math.round(v * 1e9) / 1e9}`; } catch { /* */ }
        return simplifyExpr(line);
      }
    }
  } catch (e) {
    void rest; return `error: ${(e as Error).message}`;
  }
}

export function Notebook() {
  const [cells, setCells] = useState<Cell[]>(STARTER);
  const [outputs, setOutputs] = useState<Record<number, string>>({});

  const setSrc = (id: number, src: string) => setCells((cs) => cs.map((c) => (c.id === id ? { ...c, src } : c)));
  const runCell = (id: number, src: string) => setOutputs((o) => ({ ...o, [id]: run(src) }));
  const runAll = () => { const o: Record<number, string> = {}; for (const c of cells) if (c.type === "compute") o[c.id] = run(c.src); setOutputs(o); };
  const addCell = (type: Cell["type"]) => setCells((cs) => [...cs, { id: cid++, type, src: type === "prose" ? "New note…" : "1 + 1" }]);
  const removeCell = (id: number) => setCells((cs) => cs.filter((c) => c.id !== id));

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const rows = parseCSV(String(reader.result)); const flat = rows.map((r) => r.join(" ")).join("; "); addCellWith(`det ${flat}`); };
    reader.readAsText(file);
  };
  const addCellWith = (src: string) => setCells((cs) => [...cs, { id: cid++, type: "compute", src }]);
  const exportNotebook = () => {
    const text = cells.map((c) => (c.type === "prose" ? c.src : `>>> ${c.src}\n${outputs[c.id] ?? ""}`)).join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "polysim-notebook.txt"; a.click();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notebook</span>
        <span className="text-xs text-slate-400">commands: diff · int · simplify · solve · det · inv · or any expression</span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button onClick={runAll} className="rounded-md bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-700">Run all</button>
          <button onClick={() => addCell("compute")} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">+ Compute</button>
          <button onClick={() => addCell("prose")} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">+ Note</button>
          <label className="cursor-pointer rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">Import CSV<input type="file" accept=".csv,.txt" onChange={importCSV} className="hidden" /></label>
          <button onClick={exportNotebook} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">Export</button>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {cells.map((c) => (
          <div key={c.id} className="group flex gap-3 p-4">
            <div className="flex-1">
              {c.type === "prose" ? (
                <textarea value={c.src} onChange={(e) => setSrc(c.id, e.target.value)} rows={Math.max(2, c.src.split("\n").length)}
                  className="w-full resize-none rounded-lg border border-transparent bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-cyan-400 dark:bg-slate-950/40 dark:text-slate-300" />
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input value={c.src} onChange={(e) => setSrc(c.id, e.target.value)} onKeyDown={(e) => e.key === "Enter" && runCell(c.id, c.src)} spellCheck={false}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                    <button onClick={() => runCell(c.id, c.src)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-200 dark:text-slate-900">Run</button>
                  </div>
                  {outputs[c.id] !== undefined && <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 font-mono text-sm text-lime-400">{outputs[c.id]}</pre>}
                </div>
              )}
            </div>
            <button onClick={() => removeCell(c.id)} className="text-xs text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-400">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
