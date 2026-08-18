"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { match: number; mismatch: number; gap: number }> = {
  "DNA default (1/-1/-2)": { match: 1, mismatch: -1, gap: -2 },
  "Strict gaps": { match: 1, mismatch: -1, gap: -4 },
  "Lenient gaps": { match: 1, mismatch: -1, gap: -1 },
  "Reward matches": { match: 2, mismatch: -1, gap: -2 },
};

// Needleman-Wunsch global alignment of two DNA sequences.
export function SequenceAlignmentStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seqA, setSeqA] = useState("GATTACA");
  const [seqB, setSeqB] = useState("GCATGCU");
  const [{ match, mismatch, gap }, update] = useShareableNumbers({ match: 1, mismatch: -1, gap: -2 });
  const [result, setResult] = useState({ score: 0, a: "", b: "", identity: 0 });

  useEffect(() => {
    const A = seqA.toUpperCase().replace(/[^ACGTU]/g, "").slice(0, 14); const B = seqB.toUpperCase().replace(/[^ACGTU]/g, "").slice(0, 14);
    const n = A.length, m = B.length; if (!n || !m) return;
    const H: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) H[i][0] = i * gap; for (let j = 0; j <= m; j++) H[0][j] = j * gap;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) { const s = A[i - 1] === B[j - 1] ? match : mismatch; H[i][j] = Math.max(H[i - 1][j - 1] + s, H[i - 1][j] + gap, H[i][j - 1] + gap); }
    // traceback
    let i = n, j = m, alnA = "", alnB = ""; while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && H[i][j] === H[i - 1][j - 1] + (A[i - 1] === B[j - 1] ? match : mismatch)) { alnA = A[i - 1] + alnA; alnB = B[j - 1] + alnB; i--; j--; }
      else if (i > 0 && H[i][j] === H[i - 1][j] + gap) { alnA = A[i - 1] + alnA; alnB = "-" + alnB; i--; }
      else { alnA = "-" + alnA; alnB = B[j - 1] + alnB; j--; }
    }
    let id = 0; for (let k = 0; k < alnA.length; k++) if (alnA[k] === alnB[k]) id++;
    setResult({ score: H[n][m], a: alnA, b: alnB, identity: id / alnA.length });
    // draw DP matrix heatmap
    const W = 520, Hc = 300; const ctx = hidpi(canvasRef.current!, W, Hc); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, Hc);
    const cw = Math.min(30, (W - 60) / (m + 1)), ch = Math.min(26, (Hc - 40) / (n + 1));
    let mn = Infinity, mx = -Infinity; for (let a = 0; a <= n; a++) for (let b = 0; b <= m; b++) { mn = Math.min(mn, H[a][b]); mx = Math.max(mx, H[a][b]); }
    for (let a = 0; a <= n; a++) for (let b = 0; b <= m; b++) { const t = (H[a][b] - mn) / (mx - mn || 1); ctx.fillStyle = `rgb(${11 + t * 30},${18 + t * 190},${60 + t * 120})`; ctx.fillRect(40 + b * cw, 30 + a * ch, cw - 1, ch - 1); }
    ctx.fillStyle = "#e2e8f0"; ctx.font = "12px sans-serif"; for (let b = 0; b < m; b++) ctx.fillText(B[b], 40 + (b + 1) * cw + cw / 2 - 4, 24); for (let a = 0; a < n; a++) ctx.fillText(A[a], 20, 30 + (a + 1) * ch + ch / 2 + 4);
  }, [seqA, seqB, match, mismatch, gap]);

  const pct = Math.round(result.identity * 100);
  const explain = result.identity >= 0.7
    ? `High similarity: ${pct}% of aligned columns match for a score of ${result.score}. These two sequences are closely related — few gaps were needed to line them up.`
    : result.identity < 0.4
    ? `Low similarity: only ${pct}% of columns match (score ${result.score}). The optimal alignment leans on ${gap}-penalty gaps and mismatches, so the sequences share little common structure.`
    : `Moderate similarity: ${pct}% identity at score ${result.score}. With match=${match}, mismatch=${mismatch}, gap=${gap}, the algorithm traded a few gaps against mismatches to maximize the total.`;

  const code = `def needleman_wunsch(A, B, match=${match}, mismatch=${mismatch}, gap=${gap}):
    n, m = len(A), len(B)
    H = [[0]*(m+1) for _ in range(n+1)]
    for i in range(n+1): H[i][0] = i*gap
    for j in range(m+1): H[0][j] = j*gap
    for i in range(1, n+1):
        for j in range(1, m+1):
            s = match if A[i-1] == B[j-1] else mismatch
            H[i][j] = max(H[i-1][j-1]+s, H[i-1][j]+gap, H[i][j-1]+gap)
    return H[n][m]

print(needleman_wunsch("${seqA}", "${seqB}"))`;

  const inp = "w-full rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-sm font-mono dark:border-slate-700";

  return (
    <StudioChrome title="Sequence Alignment (Needleman-Wunsch)" tagline="global DNA alignment"
      controls={<div>
        <label className="text-xs font-semibold text-slate-500">Sequence A</label>
        <input className={inp} value={seqA} onChange={(e) => setSeqA(e.target.value)} maxLength={14} />
        <label className="mt-2 block text-xs font-semibold text-slate-500">Sequence B</label>
        <input className={inp} value={seqB} onChange={(e) => setSeqB(e.target.value)} maxLength={14} />
        <div className="mt-3"><Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} /></div>
        <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
          <label>Match<input type="number" className={inp} value={match} onChange={(e) => update({ match: +e.target.value })} /></label>
          <label>Mismatch<input type="number" className={inp} value={mismatch} onChange={(e) => update({ mismatch: +e.target.value })} /></label>
          <label>Gap<input type="number" className={inp} value={gap} onChange={(e) => update({ gap: +e.target.value })} /></label>
        </div>
        <p className="mt-3 text-xs text-slate-500">The Needleman-Wunsch algorithm finds the optimal global alignment of two sequences by dynamic programming, filling a scoring matrix and tracing back the best path. It is the foundation of bioinformatics — comparing genes, proteins, and genomes. The heatmap shows the accumulated score matrix.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Alignment score" value={String(result.score)} /><Stat label="Identity" value={`${(result.identity * 100).toFixed(0)}%`} /><Stat label="Length" value={String(result.a.length)} /><ExplainResult text={explain} /></div>}
    ><div>
        <canvas ref={canvasRef} width={520} height={300} className="mx-auto h-auto max-w-full rounded-lg" />
        <div className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm">
          <div className="text-cyan-300">{result.a}</div>
          <div className="text-slate-500">{result.a.split("").map((c, k) => c === result.b[k] ? "|" : " ").join("")}</div>
          <div className="text-pink-300">{result.b}</div>
        </div>
      </div></StudioChrome>
  );
}
