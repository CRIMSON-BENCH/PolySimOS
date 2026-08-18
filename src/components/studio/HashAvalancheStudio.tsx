"use client";

import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useState } from "react";

// Toy 32-bit hash to demonstrate the avalanche effect.
function toyHash(s: string): number { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); h ^= h >>> 15; h = Math.imul(h, 0x2545f491); h ^= h >>> 13; } return h >>> 0; }
const hex = (n: number) => n.toString(16).padStart(8, "0");
const bits = (n: number) => n.toString(2).padStart(32, "0");

export function HashAvalancheStudio() {
  const [text, setText] = useState("hello");

  const h1 = toyHash(text); const alt = text.length ? text.slice(0, -1) + String.fromCharCode(text.charCodeAt(text.length - 1) ^ 1) : "x";
  const h2 = toyHash(alt);
  const b1 = bits(h1), b2 = bits(h2); let diff = 0; for (let i = 0; i < 32; i++) if (b1[i] !== b2[i]) diff++;

  const explain =
    diff >= 13 && diff <= 19
      ? `About half of the 32 output bits flipped (${diff}) — the ideal avalanche, so the two fingerprints look completely unrelated even though the inputs differ by a single bit.`
      : diff < 13
      ? `Only ${diff} of 32 bits changed — weaker than the ideal ~16, so this input leaks a hint of similarity that a strong hash would fully scramble.`
      : `${diff} of 32 bits flipped — even past the ideal half, a strong avalanche where one input bit scrambles almost the entire fingerprint.`;

  const code = `def toy(s):
    h = 0x811c9dc5
    for c in s:
        h ^= ord(c); h = (h * 0x01000193) & 0xffffffff
        h ^= h >> 15; h = (h * 0x2545f491) & 0xffffffff
        h ^= h >> 13
    return h & 0xffffffff
s = ${JSON.stringify(text)}
a = toy(s); b = toy(s[:-1] + chr(ord(s[-1]) ^ 1))
print(f"{a:08x}", f"{b:08x}", bin(a ^ b).count("1"), "bits differ")`;

  return (
    <StudioChrome title="Hash Avalanche Effect" tagline="one bit changes everything"
      controls={<div>
        <label className="text-xs font-semibold text-slate-500">Input text</label>
        <input className="w-full rounded-lg border border-slate-300 bg-transparent px-2 py-1 font-mono text-sm dark:border-slate-700" value={text} onChange={(e) => setText(e.target.value)} />
        <p className="mt-3 text-xs text-slate-500">A good cryptographic hash maps any input to a fixed-size fingerprint, and flipping a single input bit flips about half the output bits — the avalanche effect. This makes the output look random and unrelated to the input, so you cannot nudge your way from one hash to a target. It is why hashes protect passwords, verify files, and anchor blockchains.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Bits changed" value={`${diff} / 32`} /><Stat label="Avalanche" value={`${(diff / 32 * 100).toFixed(0)}%`} /><Stat label="Ideal" value="~50%" /><Equation tex={`\\frac{d_H(h_1, h_2)}{32} = \\frac{${diff}}{32} = ${(diff / 32).toFixed(2)} \\approx 0.5`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center gap-3 py-10 font-mono text-sm">
        <div className="text-slate-500">hash(&quot;{text}&quot;)</div>
        <div className="text-2xl font-bold text-cyan-300">{hex(h1)}</div>
        <div className="mt-3 text-slate-500">hash with last bit flipped</div>
        <div className="text-2xl font-bold text-pink-300">{hex(h2)}</div>
        <div className="mt-4 flex flex-wrap justify-center gap-0.5">{b1.split("").map((bit, i) => <span key={i} className={`inline-block h-4 w-4 rounded text-center text-[10px] ${bit !== b2[i] ? "bg-pink-500 text-white" : "bg-slate-800 text-slate-500"}`}>{bit}</span>)}</div>
        <div className="text-xs text-slate-500">pink = flipped bits</div>
      </div></StudioChrome>
  );
}
