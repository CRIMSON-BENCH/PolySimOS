"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { useShareableNumbers } from "@/lib/studioKit";
import { useState } from "react";

const PRESETS: Record<string, { shift: number }> = {
  "Shift +1": { shift: 1 },
  "Classic +3": { shift: 3 },
  "ROT13": { shift: 13 },
  "Shift 25 (-1)": { shift: 25 },
};

export function ClassicalCiphersStudio() {
  const [mode, setMode] = useState<"caesar" | "vigenere">("caesar");
  const [text, setText] = useState("ATTACK AT DAWN");
  const [key, setKey] = useState("LEMON");
  const [{ shift }, update] = useShareableNumbers({ shift: 3 });

  const caesar = (s: string, k: number) => s.toUpperCase().replace(/[A-Z]/g, (c) => String.fromCharCode((c.charCodeAt(0) - 65 + k + 26) % 26 + 65));
  const vigenere = (s: string, kw: string, dec = false) => { let ki = 0; const K = kw.toUpperCase().replace(/[^A-Z]/g, "") || "A"; return s.toUpperCase().replace(/[A-Z]/g, (c) => { const k = K.charCodeAt(ki % K.length) - 65; ki++; return String.fromCharCode((c.charCodeAt(0) - 65 + (dec ? -k : k) + 26) % 26 + 65); }); };
  const cipher = mode === "caesar" ? caesar(text, shift) : vigenere(text, key);

  const keyLen = key.replace(/[^A-Za-z]/g, "").length || 1;
  const explain =
    mode === "vigenere"
      ? `A ${keyLen}-letter Vigenère keyword shifts each position differently, hiding raw letter frequencies — but once the key length is found the cipher splits into ${keyLen} separate Caesar ciphers, each broken by frequency analysis.`
      : shift === 0
      ? "A shift of 0 leaves every letter unchanged, so the ciphertext equals the plaintext and offers no secrecy at all."
      : shift === 13
      ? "ROT13 is its own inverse — applying it twice returns the original text — yet with only 25 possible shifts a Caesar cipher still falls to brute force instantly."
      : `Every letter shifts by the same ${shift}, so this Caesar cipher's 25-key space is cracked instantly by trying all shifts or by letter-frequency analysis.`;

  const code =
    mode === "caesar"
      ? `text, shift = ${JSON.stringify(text.toUpperCase())}, ${shift}
out = "".join(chr((ord(c) - 65 + shift) % 26 + 65) if c.isalpha() else c for c in text.upper())
print(out)`
      : `text, key = ${JSON.stringify(text.toUpperCase())}, ${JSON.stringify(key.toUpperCase())}
K = [ord(k) - 65 for k in key.upper() if k.isalpha()] or [0]
out, ki = "", 0
for c in text.upper():
    if c.isalpha():
        out += chr((ord(c) - 65 + K[ki % len(K)]) % 26 + 65); ki += 1
    else:
        out += c
print(out)`;

  return (
    <StudioChrome title="Classical Ciphers" tagline="Caesar & Vigenère"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-2">{(["caesar", "vigenere"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${mode === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>)}</div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => { setMode("caesar"); update(PRESETS[label]); }} />
        <label className="text-xs font-semibold text-slate-500">Plaintext</label>
        <input className="w-full rounded-lg border border-slate-300 bg-transparent px-2 py-1 font-mono text-sm dark:border-slate-700" value={text} onChange={(e) => setText(e.target.value)} />
        {mode === "caesar" ? <Slider label="Shift" value={shift} min={0} max={25} step={1} onChange={(v) => update({ shift: v })} /> : <><label className="mt-2 block text-xs font-semibold text-slate-500">Keyword</label><input className="w-full rounded-lg border border-slate-300 bg-transparent px-2 py-1 font-mono text-sm dark:border-slate-700" value={key} onChange={(e) => setKey(e.target.value)} /></>}
        <p className="mt-3 text-xs text-slate-500">The Caesar cipher shifts every letter by a fixed amount — trivially broken by trying all 25 shifts or by letter-frequency analysis. The Vigenère cipher uses a repeating keyword so each letter shifts differently, defeating simple frequency attacks for centuries until the key length could be found. Both are insecure today but perfect for learning how ciphers work.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Cipher" value={mode === "caesar" ? `Caesar +${shift}` : "Vigenère"} /><Stat label="Keyspace" value={mode === "caesar" ? "26" : `26^${keyLen}`} /><Stat label="Letters" value={String(text.replace(/[^A-Za-z]/g, "").length)} /><Equation tex={mode === "caesar" ? `E(x)=(x+${shift})\\bmod 26` : `E_i=(x_i+k_i)\\bmod 26,\\quad |k|=${keyLen}`} /><ExplainResult text={explain} /></div>}
    ><div className="flex flex-col items-center gap-4 py-12 font-mono">
        <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center"><div className="text-xs text-slate-500">plaintext</div><div className="mt-1 break-words text-lg text-cyan-300">{text.toUpperCase()}</div></div>
        <div className="text-slate-500">↓ encrypt</div>
        <div className="w-full max-w-md rounded-lg border border-pink-700 bg-pink-950/30 p-4 text-center"><div className="text-xs text-slate-500">ciphertext</div><div className="mt-1 break-words text-lg text-pink-300">{cipher}</div></div>
      </div></StudioChrome>
  );
}
