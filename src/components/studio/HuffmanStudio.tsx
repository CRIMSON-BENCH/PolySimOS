"use client";

import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { useState } from "react";

type Node = { ch?: string; freq: number; l?: Node; r?: Node };

export function HuffmanStudio() {
  const [text, setText] = useState("abracadabra");

  const freq: Record<string, number> = {}; for (const c of text) freq[c] = (freq[c] || 0) + 1;
  const entries = Object.entries(freq);
  const nodes: Node[] = entries.map(([ch, f]) => ({ ch, freq: f }));
  while (nodes.length > 1) { nodes.sort((a, b) => a.freq - b.freq); const l = nodes.shift()!, r = nodes.shift()!; nodes.push({ freq: l.freq + r.freq, l, r }); }
  const root = nodes[0]; const codes: Record<string, string> = {};
  const walk = (n: Node | undefined, code: string) => { if (!n) return; if (n.ch !== undefined) { codes[n.ch] = code || "0"; return; } walk(n.l, code + "0"); walk(n.r, code + "1"); };
  if (root) walk(root, "");
  const huffBits = text.split("").reduce((s, c) => s + (codes[c]?.length || 0), 0);
  const fixedBits = text.length * Math.ceil(Math.log2(entries.length || 1));
  const ratio = fixedBits > 0 ? huffBits / fixedBits : 1;

  const topChar = entries.length ? entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0] : "";
  const topLabel = topChar === " " ? "␣" : topChar;
  const savings = Math.max(0, 100 - Math.round(ratio * 100));
  const explain =
    entries.length <= 1
      ? `A single distinct symbol carries no choice to encode, so one bit per character is the hard floor here.`
      : savings > 0
      ? `Huffman packs this text into ${huffBits} bits versus ${fixedBits} fixed-length — a ${savings}% saving, earned by giving the most frequent symbol (${topLabel}, ×${freq[topChar]}) the shortest code.`
      : `The symbol frequencies are nearly uniform, so there is little skew to exploit and Huffman barely improves on fixed-length coding.`;

  const code = `# Huffman coding
import heapq, collections
text = ${JSON.stringify(text)}
freq = collections.Counter(text)
heap = [[w, [sym, ""]] for sym, w in freq.items()]
heapq.heapify(heap)
while len(heap) > 1:
    lo, hi = heapq.heappop(heap), heapq.heappop(heap)
    for pair in lo[1:]: pair[1] = "0" + pair[1]
    for pair in hi[1:]: pair[1] = "1" + pair[1]
    heapq.heappush(heap, [lo[0] + hi[0]] + lo[1:] + hi[1:])
codes = {sym: bits for sym, bits in heapq.heappop(heap)[1:]}
print(codes)`;

  return (
    <StudioChrome title="Huffman Coding" tagline="optimal lossless compression"
      controls={<div>
        <label className="text-xs font-semibold text-slate-500">Text to compress</label>
        <input className="w-full rounded-lg border border-slate-300 bg-transparent px-2 py-1 font-mono text-sm dark:border-slate-700" value={text} onChange={(e) => setText(e.target.value)} />
        <p className="mt-3 text-xs text-slate-500">Huffman coding gives frequent symbols short codes and rare ones long codes, minimizing the total bits — the optimal prefix code. It builds a tree by repeatedly merging the two least frequent nodes, so no code is a prefix of another and decoding is unambiguous. It is the compression step inside ZIP, JPEG, MP3, and countless file formats.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Symbols" value={String(entries.length)} /><Stat label="Huffman bits" value={String(huffBits)} /><Stat label="Fixed-length bits" value={String(fixedBits)} /><Stat label="Compression" value={`${(ratio * 100).toFixed(0)}%`} /><ExplainResult text={explain} /></div>}
    ><div className="p-4">
        <div className="mb-3 text-center text-xs uppercase tracking-widest text-slate-500">Codebook (shorter = more frequent)</div>
        <div className="mx-auto max-w-md space-y-1 font-mono text-sm">
          {Object.entries(codes).sort((a, b) => a[1].length - b[1].length).map(([ch, code]) => (
            <div key={ch} className="flex items-center gap-3">
              <div className="w-10 rounded bg-slate-800 px-2 py-1 text-center text-cyan-300">{ch === " " ? "␣" : ch}</div>
              <div className="w-12 text-right text-xs text-slate-500">×{freq[ch]}</div>
              <div className="flex-1 font-bold text-pink-300">{code}</div>
              <div className="text-xs text-slate-500">{code.length} bit</div>
            </div>
          ))}
        </div>
      </div></StudioChrome>
  );
}
