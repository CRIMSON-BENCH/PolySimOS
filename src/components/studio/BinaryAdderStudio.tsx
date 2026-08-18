"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";
import { Equation } from "./Equation";

const PRESETS: Record<string, { a: number; b: number }> = {
  "Simple add": { a: 83, b: 58 },
  "Carry cascade": { a: 127, b: 1 },
  "Overflow": { a: 200, b: 100 },
  "Max out": { a: 255, b: 255 },
};

export function BinaryAdderStudio() {
  const [{ a, b }, update] = useShareableNumbers({ a: 83, b: 58 });
  const bits = 8, sum = a + b;
  const bin = (n: number) => n.toString(2).padStart(bits, "0");
  // ripple carries
  const carries: number[] = []; let c = 0;
  for (let i = 0; i < bits; i++) { const ai = (a >> i) & 1, bi = (b >> i) & 1; const s = ai + bi + c; carries[i] = s > 1 ? 1 : 0; c = carries[i]; }
  const overflow = sum > 255;
  const carryCount = carries.reduce((n, cc) => n + cc, 0);

  const explain = overflow
    ? "The sum passes 255, so a carry falls out of the top bit — that stray carry is exactly the overflow flag a CPU would raise."
    : carryCount === 0
    ? "No column produces a carry, so each bit adds independently — the best case, where a ripple adder runs at full speed."
    : `A carry is generated in ${carryCount} of the 8 columns, and each one must wait for the column below it — that wait is why wide ripple adders slow down.`;

  const code = `a, b = ${a}, ${b}
bits, carry, result = 8, 0, 0
for i in range(bits):
    ai, bi = (a >> i) & 1, (b >> i) & 1
    s = ai + bi + carry
    result |= (s & 1) << i
    carry = 1 if s > 1 else 0
print(format(result, "08b"), "carry-out", carry)`;

  return (
    <StudioChrome title="Binary Ripple-Carry Adder" tagline="how computers add"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="A" value={a} min={0} max={255} step={1} onChange={(v) => update({ a: v })} />
        <Slider label="B" value={b} min={0} max={255} step={1} onChange={(v) => update({ b: v })} />
        <p className="mt-3 text-xs text-slate-500">A ripple-carry adder chains full-adders: each bit adds A, B, and the carry from the bit below, passing its own carry upward. That carry ripple is why simple adders slow down as they get wider. Educational tool.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="A + B (decimal)" value={`${a} + ${b} = ${sum}`} />
        <Stat label="8-bit result" value={overflow ? `${bin(sum & 255)} (overflow)` : bin(sum)} />
        <Stat label="Carry out" value={overflow ? "1" : "0"} />
        <Equation tex={`\\begin{aligned} S &= A \\oplus B \\oplus C_{in} \\\\ C_{out} &= AB + C_{in}(A \\oplus B) = ${overflow ? 1 : 0} \\end{aligned}`} />
        <ExplainResult text={explain} />
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
