"use client";

import { useState } from "react";
import { parseMatrix, multiply, transpose, determinant, inverse, formatMatrix } from "@/lib/engines/linalg";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";

export function MatrixStudio() {
  const [a, setA] = useState("2 1\n1 3");
  const [b, setB] = useState("1 0\n0 1");
  const [out, setOut] = useState("");
  const [label, setLabel] = useState("");

  const run = (op: string) => {
    try {
      const A = parseMatrix(a);
      if (op === "det") { setLabel("det(A)"); setOut(String(Math.round(determinant(A) * 1e6) / 1e6)); return; }
      if (op === "inv") { setLabel("A⁻¹"); setOut(formatMatrix(inverse(A))); return; }
      if (op === "transpose") { setLabel("Aᵀ"); setOut(formatMatrix(transpose(A))); return; }
      const B = parseMatrix(b);
      if (op === "add") { setLabel("A + B"); setOut(formatMatrix(A.map((r, i) => r.map((v, j) => v + B[i][j])))); return; }
      if (op === "mul") { setLabel("A × B"); setOut(formatMatrix(multiply(A, B))); return; }
    } catch (e) { setLabel("error"); setOut((e as Error).message); }
  };

  const explain = (() => {
    try {
      const A = parseMatrix(a);
      if (A.length !== A[0].length)
        return `Matrix A is ${A.length}×${A[0].length} — non-square, so it has no determinant or inverse; only transpose and shape-compatible products apply.`;
      const d = Math.round(determinant(A) * 1e6) / 1e6;
      return d === 0
        ? "A is square with det(A) = 0, so it is singular: it has no inverse and collapses space onto a lower dimension."
        : `A is square with det(A) = ${d} ≠ 0, so it is invertible; |det| is the factor by which the map scales area/volume.`;
    } catch {
      return "Enter a valid matrix A (equal-length rows, space-separated) to see its structure and invertibility.";
    }
  })();

  const toPy = (s: string) => { try { return JSON.stringify(parseMatrix(s)); } catch { return "[[1,0],[0,1]]"; } };
  const code = `import numpy as np
A = np.array(${toPy(a)})
B = np.array(${toPy(b)})
print("A + B\\n", A + B)
print("A @ B\\n", A @ B)
print("det(A)", round(float(np.linalg.det(A)), 6))
print("A^-1\\n", np.linalg.inv(A))
print("A^T\\n", A.T)`;

  const box = "w-full h-28 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
  return (
    <StudioChrome title="Matrix Calculator" tagline="linear algebra · multiply, det, inverse, solve"
      controls={<div>
        <p className="mb-3 text-xs text-slate-500">Enter matrices (rows on new lines, values space-separated), then pick an operation.</p>
        <div className="grid grid-cols-2 gap-1.5">
          {["add", "mul", "det", "inv", "transpose"].map((op) => (
            <button key={op} onClick={() => run(op)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-700 dark:text-slate-400">
              {op === "add" ? "A + B" : op === "mul" ? "A × B" : op === "det" ? "det(A)" : op === "inv" ? "A⁻¹" : "Aᵀ"}
            </button>
          ))}
        </div>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Engine" value="Gauss-Jordan" /><Stat label="Result" value={label || "—"} /><ExplainResult text={explain} /></div>}
    >
      <div className="grid gap-4 p-2 md:grid-cols-2">
        <div><label className="mb-1 block text-xs font-semibold text-slate-400">Matrix A</label><textarea value={a} onChange={(e) => setA(e.target.value)} className={box} spellCheck={false} /></div>
        <div><label className="mb-1 block text-xs font-semibold text-slate-400">Matrix B</label><textarea value={b} onChange={(e) => setB(e.target.value)} className={box} spellCheck={false} /></div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-400">{label ? `Result — ${label}` : "Result"}</label>
          <pre className="min-h-[80px] w-full overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 font-mono text-sm text-lime-400">{out || "Pick an operation →"}</pre>
        </div>
      </div>
    </StudioChrome>
  );
}
