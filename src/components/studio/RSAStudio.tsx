"use client";

import { StudioChrome, Stat } from "./StudioChrome";
import { useState } from "react";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";

function modpow(b: number, e: number, m: number): number { let r = 1; b %= m; while (e > 0) { if (e & 1) r = (r * b) % m; e = Math.floor(e / 2); b = (b * b) % m; } return r; }
function gcd(a: number, b: number): number { while (b) { [a, b] = [b, a % b]; } return a; }
function modinv(a: number, m: number): number { for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x; return 1; }
const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61];

const PRESETS: Record<string, { message: number }> = {
  "Tiny msg": { message: 7 },
  "Mid msg": { message: 42 },
  "Big msg": { message: 100 },
  "Near n": { message: 128 },
};

export function RSAStudio() {
  const [p, setP] = useState(17);
  const [q, setQ] = useState(23);
  const [{ message }, update] = useShareableNumbers({ message: 42 });

  const n = p * q; const phi = (p - 1) * (q - 1);
  let e = 3; while (e < phi && gcd(e, phi) !== 1) e += 2;
  const d = modinv(e, phi);
  const msg = message % n; const cipher = modpow(msg, e, n); const decrypted = modpow(cipher, d, n);

  const explain = decrypted === msg
    ? `The public key (n=${n}, e=${e}) turns ${msg} into ciphertext ${cipher}; only the private key d=${d}, derived from the secret primes, brings it back to ${decrypted}. With primes this small, n could be factored instantly — real RSA uses 600-digit primes.`
    : `This round-trip did not recover the message — a sign the toy parameters broke an assumption; choose two distinct primes.`;

  const code = `p, q, message = ${p}, ${q}, ${message}
n = p*q; phi = (p-1)*(q-1)
from math import gcd
e = 3
while e < phi and gcd(e, phi) != 1: e += 2
d = pow(e, -1, phi)
msg = message % n
cipher = pow(msg, e, n)
recovered = pow(cipher, d, n)
print("public (n,e)", (n, e), "cipher", cipher, "recovered", recovered)`;

  return (
    <StudioChrome title="RSA Public-Key Encryption" tagline="the math behind secure internet"
      controls={<div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
        <div className="mb-2 text-xs font-semibold text-slate-500">Prime p</div>
        <div className="flex flex-wrap gap-1">{PRIMES.slice(0, 7).map((x) => <button key={x} onClick={() => setP(x)} className={`rounded px-2 py-1 text-xs font-semibold ${p === x ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{x}</button>)}</div>
        <div className="mb-2 mt-3 text-xs font-semibold text-slate-500">Prime q</div>
        <div className="flex flex-wrap gap-1">{PRIMES.slice(4, 11).map((x) => <button key={x} onClick={() => setQ(x)} className={`rounded px-2 py-1 text-xs font-semibold ${q === x ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{x}</button>)}</div>
        <div className="mt-3 text-xs font-semibold text-slate-500">Message (number &lt; n)</div>
        <input type="range" min={2} max={Math.max(3, n - 1)} value={message} onChange={(ev) => update({ message: +ev.target.value })} className="w-full" />
        <p className="mt-3 text-xs text-slate-500">RSA rests on a one-way street: multiplying two big primes is easy, but factoring the product back apart is practically impossible. The public key (n, e) encrypts by raising the message to the power e mod n; only the private key d — computable only from the secret primes — can undo it. Real keys use 600-digit primes; these tiny ones just show the machinery.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Modulus n = p·q" value={String(n)} /><Stat label="φ(n)" value={String(phi)} /><Stat label="Public key e" value={String(e)} /><Stat label="Private key d" value={String(d)} /><Equation tex={`n = pq = ${p}\\cdot ${q} = ${n},\\quad c = m^e \\bmod n = ${cipher},\\quad m = c^d \\bmod n = ${decrypted}`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center gap-4 py-10 font-mono">
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-6 py-3 text-center"><div className="text-xs text-slate-500">message</div><div className="text-2xl font-bold text-cyan-300">{msg}</div></div>
        <div className="text-slate-500">↓ encrypt: {msg}^{e} mod {n}</div>
        <div className="rounded-lg border border-pink-700 bg-pink-950/30 px-6 py-3 text-center"><div className="text-xs text-slate-500">ciphertext</div><div className="text-2xl font-bold text-pink-300">{cipher}</div></div>
        <div className="text-slate-500">↓ decrypt: {cipher}^{d} mod {n}</div>
        <div className="rounded-lg border border-lime-700 bg-lime-950/30 px-6 py-3 text-center"><div className="text-xs text-slate-500">recovered</div><div className="text-2xl font-bold text-lime-300">{decrypted}</div></div>
      </div></StudioChrome>
  );
}
