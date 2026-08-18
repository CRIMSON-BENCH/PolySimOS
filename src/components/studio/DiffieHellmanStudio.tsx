"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { useShareableNumbers } from "@/lib/studioKit";

function modpow(b: number, e: number, m: number): number { let r = 1; b %= m; while (e > 0) { if (e & 1) r = (r * b) % m; e = Math.floor(e / 2); b = (b * b) % m; } return r; }

const PRESETS: Record<string, { g: number; prime: number; a: number; b: number }> = {
  "Textbook (p=23)": { g: 5, prime: 23, a: 6, b: 15 },
  "Small (p=11)": { g: 2, prime: 11, a: 3, b: 7 },
  "Larger prime": { g: 5, prime: 97, a: 40, b: 53 },
  "Generator 7": { g: 7, prime: 41, a: 13, b: 22 },
};

export function DiffieHellmanStudio() {
  const [{ g, prime, a, b }, update] = useShareableNumbers({ g: 5, prime: 23, a: 6, b: 15 });

  const A = modpow(g, a, prime); const B = modpow(g, b, prime);
  const secretA = modpow(B, a, prime); const secretB = modpow(A, b, prime);

  const explain =
    secretA === secretB
      ? `Both sides arrive at the same key ${secretA} because (g^a)^b and (g^b)^a are the same value mod ${prime} — yet an eavesdropper who sees g, p, A and B must still solve a discrete logarithm to recover it.`
      : `The keys disagree here, an artifact of these tiny numbers — with a proper prime, (g^a)^b always equals (g^b)^a mod ${prime}.`;

  const code = `def modpow(base, e, m):
    r = 1; base %= m
    while e:
        if e & 1: r = r * base % m
        e >>= 1; base = base * base % m
    return r
g, p, a, b = ${g}, ${prime}, ${a}, ${b}
A, B = modpow(g, a, p), modpow(g, b, p)
print("A", A, "B", B, "shared", modpow(B, a, p), modpow(A, b, p))`;

  return (
    <StudioChrome title="Diffie-Hellman Key Exchange" tagline="a shared secret over an open line"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <Slider label="Generator g" value={g} min={2} max={12} step={1} onChange={(v) => update({ g: v })} />
        <Slider label="Prime p" value={prime} min={11} max={97} step={2} onChange={(v) => update({ prime: v })} />
        <Slider label="Alice's secret a" value={a} min={2} max={prime - 1} step={1} onChange={(v) => update({ a: v })} />
        <Slider label="Bob's secret b" value={b} min={2} max={prime - 1} step={1} onChange={(v) => update({ b: v })} />
        <p className="mt-3 text-xs text-slate-500">Diffie-Hellman lets two strangers agree on a secret key while an eavesdropper hears everything. Both share public numbers g and p, each picks a private exponent, and they exchange g raised to it. Raising the other&apos;s public value to your own secret yields the same shared key — yet recovering it from the public traffic requires solving the discrete logarithm, which is infeasible.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Alice sends A" value={String(A)} /><Stat label="Bob sends B" value={String(B)} /><Stat label="Shared secret" value={String(secretA)} /><Stat label="Match?" value={secretA === secretB ? "yes ✓" : "no"} /><ExplainResult text={explain} /></div>}
    ><div className="grid grid-cols-2 gap-4 p-6 font-mono text-sm">
        <div className="rounded-lg border border-cyan-800 bg-cyan-950/20 p-4"><div className="mb-2 font-bold text-cyan-300">Alice</div><div className="text-slate-400">secret a = {a}</div><div className="text-slate-400">sends A = g^a = <span className="text-cyan-300">{A}</span></div><div className="mt-2 text-slate-400">key = B^a = <span className="font-bold text-lime-300">{secretA}</span></div></div>
        <div className="rounded-lg border border-pink-800 bg-pink-950/20 p-4"><div className="mb-2 font-bold text-pink-300">Bob</div><div className="text-slate-400">secret b = {b}</div><div className="text-slate-400">sends B = g^b = <span className="text-pink-300">{B}</span></div><div className="mt-2 text-slate-400">key = A^b = <span className="font-bold text-lime-300">{secretB}</span></div></div>
        <div className="col-span-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-center text-slate-400">Eavesdropper sees g={g}, p={prime}, A={A}, B={B} — but cannot find the key {secretA}</div>
      </div></StudioChrome>
  );
}
