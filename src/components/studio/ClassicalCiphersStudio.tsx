"use client";

import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { useState } from "react";

export function ClassicalCiphersStudio() {
  const [mode, setMode] = useState<"caesar" | "vigenere">("caesar");
  const [text, setText] = useState("ATTACK AT DAWN");
  const [shift, setShift] = useState(3);
  const [key, setKey] = useState("LEMON");

  const caesar = (s: string, k: number) => s.toUpperCase().replace(/[A-Z]/g, (c) => String.fromCharCode((c.charCodeAt(0) - 65 + k + 26) % 26 + 65));
  const vigenere = (s: string, kw: string, dec = false) => { let ki = 0; const K = kw.toUpperCase().replace(/[^A-Z]/g, "") || "A"; return s.toUpperCase().replace(/[A-Z]/g, (c) => { const k = K.charCodeAt(ki % K.length) - 65; ki++; return String.fromCharCode((c.charCodeAt(0) - 65 + (dec ? -k : k) + 26) % 26 + 65); }); };
  const cipher = mode === "caesar" ? caesar(text, shift) : vigenere(text, key);

  return (
    <StudioChrome title="Classical Ciphers" tagline="Caesar & Vigenère"
      controls={<div>
        <div className="mb-3 grid grid-cols-2 gap-2">{(["caesar", "vigenere"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${mode === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>)}</div>
        <label className="text-xs font-semibold text-slate-500">Plaintext</label>
        <input className="w-full rounded-lg border border-slate-300 bg-transparent px-2 py-1 font-mono text-sm dark:border-slate-700" value={text} onChange={(e) => setText(e.target.value)} />
        {mode === "caesar" ? <Slider label="Shift" value={shift} min={0} max={25} step={1} onChange={setShift} /> : <><label className="mt-2 block text-xs font-semibold text-slate-500">Keyword</label><input className="w-full rounded-lg border border-slate-300 bg-transparent px-2 py-1 font-mono text-sm dark:border-slate-700" value={key} onChange={(e) => setKey(e.target.value)} /></>}
        <p className="mt-3 text-xs text-slate-500">The Caesar cipher shifts every letter by a fixed amount — trivially broken by trying all 25 shifts or by letter-frequency analysis. The Vigenère cipher uses a repeating keyword so each letter shifts differently, defeating simple frequency attacks for centuries until the key length could be found. Both are insecure today but perfect for learning how ciphers work.</p>
      </div>}
      inspector={<div><Stat label="Cipher" value={mode === "caesar" ? `Caesar +${shift}` : "Vigenère"} /><Stat label="Keyspace" value={mode === "caesar" ? "26" : `26^${key.replace(/[^A-Za-z]/g, "").length || 1}`} /><Stat label="Letters" value={String(text.replace(/[^A-Za-z]/g, "").length)} /></div>}
    ><div className="flex flex-col items-center gap-4 py-12 font-mono">
        <div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center"><div className="text-xs text-slate-500">plaintext</div><div className="mt-1 break-words text-lg text-cyan-300">{text.toUpperCase()}</div></div>
        <div className="text-slate-500">↓ encrypt</div>
        <div className="w-full max-w-md rounded-lg border border-pink-700 bg-pink-950/30 p-4 text-center"><div className="text-xs text-slate-500">ciphertext</div><div className="mt-1 break-words text-lg text-pink-300">{cipher}</div></div>
      </div></StudioChrome>
  );
}
