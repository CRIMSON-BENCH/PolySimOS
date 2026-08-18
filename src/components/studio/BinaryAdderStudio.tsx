"use client";

import { useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function BinaryAdderStudio() {
  const [a, setA] = useState(83), [b, setB] = useState(58);
  const bits = 8, sum = a + b;
  const bin = (n: number) => n.toString(2).padStart(bits, "0");
  // ripple carries
  const carries: number[] = []; let c = 0;
  for (let i = 0; i < bits; i++) { const ai = (a >> i) & 1, bi = (b >> i) & 1; const s = ai + bi + c; carries[i] = s > 1 ? 1 : 0; c = carries[i]; }
  const overflow = sum > 255;

  return (
    <StudioChrome title="Binary Ripple-Carry Adder" tagline="how computers add"
      controls={<div>
        <Slider label="A" value={a} min={0} max={255} step={1} onChange={setA} />
        <Slider label="B" value={b} min={0} max={255} step={1} onChange={setB} />
        <p className="mt-3 text-xs text-slate-500">A ripple-carry adder chains full-adders: each bit adds A, B, and the carry from the bit below, passing its own carry upward. That carry ripple is why simple adders slow down as they get wider. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="A + B (decimal)" value={`${a} + ${b} = ${sum}`} />
        <Stat label="8-bit result" value={overflow ? `${bin(sum & 255)} (overflow)` : bin(sum)} />
        <Stat label="Carry out" value={overflow ? "1" : "0"} />
      </div>}
    ><div className="flex h-[320px] flex-col items-center justify-center gap-2 rounded-lg bg-slate-950 font-mono text-lg">
      <div className="text-cyan-300">  {bin(a)}</div>
      <div className="text-pink-300">+ {bin(b)}</div>
      <div className="flex gap-[0.5ch] text-xs text-amber-400">{carries.slice().reverse().map((cc, i) => <span key={i} className="w-[1ch] text-center">{cc}</span>)}<span className="w-[1ch]" /></div>
      <div className="border-t border-slate-700 pt-1 text-emerald-300">= {bin(sum & 255)}</div>
      <div className="mt-2 text-xs text-slate-500">amber = carry chain{overflow ? " · carry out of MSB (overflow)" : ""}</div>
    </div></StudioChrome>
  );
}
