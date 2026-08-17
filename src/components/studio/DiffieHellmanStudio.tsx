"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

function modpow(b: number, e: number, m: number): number { let r = 1; b %= m; while (e > 0) { if (e & 1) r = (r * b) % m; e = Math.floor(e / 2); b = (b * b) % m; } return r; }

export function DiffieHellmanStudio() {
  const [g, setG] = useState(5);
  const [prime, setPrime] = useState(23);
  const [a, setA] = useState(6);
  const [b, setB] = useState(15);

  const A = modpow(g, a, prime); const B = modpow(g, b, prime);
  const secretA = modpow(B, a, prime); const secretB = modpow(A, b, prime);

  return (
    <StudioChrome title="Diffie-Hellman Key Exchange" tagline="a shared secret over an open line"
      controls={<div>
        <Slider label="Generator g" value={g} min={2} max={12} step={1} onChange={setG} />
        <Slider label="Prime p" value={prime} min={11} max={97} step={2} onChange={setPrime} />
        <Slider label="Alice's secret a" value={a} min={2} max={prime - 1} step={1} onChange={setA} />
        <Slider label="Bob's secret b" value={b} min={2} max={prime - 1} step={1} onChange={setB} />
        <p className="mt-3 text-xs text-slate-500">Diffie-Hellman lets two strangers agree on a secret key while an eavesdropper hears everything. Both share public numbers g and p, each picks a private exponent, and they exchange g raised to it. Raising the other&apos;s public value to your own secret yields the same shared key — yet recovering it from the public traffic requires solving the discrete logarithm, which is infeasible.</p>
      </div>}
      inspector={<div><Stat label="Alice sends A" value={String(A)} /><Stat label="Bob sends B" value={String(B)} /><Stat label="Shared secret" value={String(secretA)} /><Stat label="Match?" value={secretA === secretB ? "yes ✓" : "no"} /></div>}
    ><div className="grid grid-cols-2 gap-4 p-6 font-mono text-sm">
        <div className="rounded-lg border border-cyan-800 bg-cyan-950/20 p-4"><div className="mb-2 font-bold text-cyan-300">Alice</div><div className="text-slate-400">secret a = {a}</div><div className="text-slate-400">sends A = g^a = <span className="text-cyan-300">{A}</span></div><div className="mt-2 text-slate-400">key = B^a = <span className="font-bold text-lime-300">{secretA}</span></div></div>
        <div className="rounded-lg border border-pink-800 bg-pink-950/20 p-4"><div className="mb-2 font-bold text-pink-300">Bob</div><div className="text-slate-400">secret b = {b}</div><div className="text-slate-400">sends B = g^b = <span className="text-pink-300">{B}</span></div><div className="mt-2 text-slate-400">key = A^b = <span className="font-bold text-lime-300">{secretB}</span></div></div>
        <div className="col-span-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-center text-slate-400">Eavesdropper sees g={g}, p={prime}, A={A}, B={B} — but cannot find the key {secretA}</div>
      </div></StudioChrome>
  );
}
