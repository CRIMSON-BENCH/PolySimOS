"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DISCLAIMER_SHORT } from "@/lib/disclaimer";
import { useAuth } from "@/lib/auth";

// Real Supabase-backed auth: OAuth (Google/Apple), email+password, and a
// passwordless magic-link fallback. Degrades to a friendly message until the
// NEXT_PUBLIC_SUPABASE_* keys are present.
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { configured, signInPassword, signUpPassword, signInMagicLink, signInOAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setMsg("");
    try {
      if (isSignup) {
        const r = await signUpPassword(email, password);
        if (r.error) setErr(r.error);
        else if (r.needsConfirm) setMsg("Check your email to confirm your account, then log in.");
        else router.push("/dashboard");
      } else {
        const r = await signInPassword(email, password);
        if (r.error) setErr(r.error);
        else router.push("/dashboard");
      }
    } finally { setBusy(false); }
  }

  async function magic() {
    if (!email) { setErr("Enter your email first."); return; }
    setBusy(true); setErr(""); setMsg("");
    const r = await signInMagicLink(email);
    if (r.error) setErr(r.error);
    else setMsg("Magic link sent — check your email to sign in.");
    setBusy(false);
  }

  async function oauth(provider: "google" | "apple") {
    setErr(""); setMsg("");
    const r = await signInOAuth(provider);
    if (r.error) setErr(r.error);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isSignup ? "Start simulating free — no credit card." : "Log in to your PolySim OS workspace."}
        </p>

        <div className="mt-6 grid gap-2">
          <button onClick={() => oauth("google")} disabled={busy} className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Continue with Google
          </button>
          <button onClick={() => oauth("apple")} disabled={busy} className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Continue with Apple
          </button>
        </div>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /> or <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 font-semibold text-white hover:bg-cyan-700 disabled:opacity-60">
            {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
          </button>
        </form>

        <button onClick={magic} disabled={busy} className="mt-2 w-full text-center text-xs font-medium text-cyan-600 hover:underline disabled:opacity-60 dark:text-cyan-400">
          Email me a magic link instead
        </button>

        {msg && <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">{msg}</p>}
        {err && <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{err}</p>}
        {!configured && <p className="mt-3 text-xs text-slate-400">Sign-in activates once Supabase keys are added to the environment.</p>}

        <p className="mt-4 text-center text-sm text-slate-500">
          {isSignup ? (
            <>Already have an account? <Link href="/login" className="text-cyan-600 hover:underline dark:text-cyan-400">Log in</Link></>
          ) : (
            <>New to PolySim? <Link href="/signup" className="text-cyan-600 hover:underline dark:text-cyan-400">Sign up free</Link></>
          )}
        </p>
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">{DISCLAIMER_SHORT}</p>
    </div>
  );
}
