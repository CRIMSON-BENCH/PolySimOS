"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const CW = 560, CH = 480;

const PRESETS: Record<string, { axiom: string; rules: Record<string, string>; angle: number; iter: number }> = {
  "Fractal plant": { axiom: "X", rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" }, angle: 25, iter: 5 },
  "Koch curve": { axiom: "F", rules: { F: "F+F-F-F+F" }, angle: 90, iter: 4 },
  "Sierpinski": { axiom: "F-G-G", rules: { F: "F-G+F+G-F", G: "GG" }, angle: 120, iter: 5 },
  "Dragon curve": { axiom: "F", rules: { F: "F+G", G: "F-G" }, angle: 90, iter: 11 },
};

export function LSystemStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preset, setPreset] = useState("Fractal plant");
  const [{ iter }, update] = useShareableNumbers({ iter: 5 });
  const [len, setLen] = useState(0);

  useEffect(() => { update({ iter: PRESETS[preset].iter }); }, [preset]);

  useEffect(() => {
    const p = PRESETS[preset]; let str = p.axiom; const N = Math.round(iter);
    for (let i = 0; i < N; i++) { let next = ""; for (const ch of str) next += p.rules[ch] ?? ch; str = next; if (str.length > 400000) break; }
    setLen(str.length);
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, CW, CH); ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, CW, CH);
    // measure bounds first
    const rad = (p.angle * Math.PI) / 180; let x = 0, y = 0, a = -Math.PI / 2; const stack: [number, number, number][] = [];
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (const ch of str) { if (ch === "F" || ch === "G") { x += Math.cos(a); y += Math.sin(a); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); } else if (ch === "+") a += rad; else if (ch === "-") a -= rad; else if (ch === "[") stack.push([x, y, a]); else if (ch === "]") { [x, y, a] = stack.pop()!; } }
    const scale = Math.min((CW - 40) / (maxX - minX || 1), (CH - 40) / (maxY - minY || 1));
    const ox = 20 - minX * scale, oy = 20 - minY * scale;
    x = 0; y = 0; a = -Math.PI / 2; ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 1; ctx.beginPath();
    let px = ox, py = oy;
    for (const ch of str) { if (ch === "F" || ch === "G") { x += Math.cos(a); y += Math.sin(a); const nx = ox + x * scale, ny = oy + y * scale; ctx.moveTo(px, py); ctx.lineTo(nx, ny); px = nx; py = ny; } else if (ch === "+") a += rad; else if (ch === "-") a -= rad; else if (ch === "[") stack.push([x, y, a]); else if (ch === "]") { [x, y, a] = stack.pop()!; px = ox + x * scale; py = oy + y * scale; } }
    ctx.stroke();
  }, [preset, iter]);

  const N = Math.round(iter);
  const explain =
    N <= 2
      ? `Only ${N} rewrite${N === 1 ? "" : "s"} so far: the rule has barely compounded, so the figure still looks close to its ${PRESETS[preset].axiom} axiom.`
      : `After ${N} rewrites the string holds ${len.toLocaleString()} symbols — each pass replaces every symbol at once, so detail multiplies exponentially, not linearly.`;

  const rulesPy = Object.entries(PRESETS[preset].rules).map(([k, v]) => `"${k}": "${v}"`).join(", ");
  const code = `axiom = "${PRESETS[preset].axiom}"
rules = {${rulesPy}}
s = axiom
for _ in range(${N}):
    s = "".join(rules.get(c, c) for c in s)
print("symbols", len(s))  # F/G draw, +/- turn ${PRESETS[preset].angle} deg, [ ] push/pop`;

  return (
    <StudioChrome title="L-System Fractals" tagline="turtle graphics · rewriting rules"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => setPreset(label)} />
        <Slider label="Iterations" value={iter} min={1} max={preset === "Dragon curve" ? 14 : 6} step={1} onChange={(v) => update({ iter: v })} />
        <p className="mt-3 text-xs text-slate-500">A Lindenmayer system grows a string by rewriting each symbol with a rule, then reads it as turtle commands: F draw, +/− turn, [ ] push/pop. Simple rules, botanical complexity.</p>
        <ExplainResult text={explain} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Angle" value={`${PRESETS[preset].angle}°`} /><Stat label="Symbols" value={len.toLocaleString()} /><Stat label="Axiom" value={PRESETS[preset].axiom} /><Equation tex={`${Object.entries(PRESETS[preset].rules).map(([k, v]) => `\\texttt{${k}}\\!\\to\\!\\texttt{${v}}`).join(",\\;\\, ")},\\quad \\delta=${PRESETS[preset].angle}^\\circ,\\quad n=${N}`} /></div>}
    ><canvas ref={canvasRef} width={560} height={480} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
