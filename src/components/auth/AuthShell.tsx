"use client";

import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const appearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#06b6d4",
    colorBackground: "#0b1220",
    colorInputBackground: "#0f172a",
    // Explicit light text so nothing renders dark-on-dark.
    colorText: "#f1f5f9",          // near-white body text
    colorTextSecondary: "#cbd5e1", // labels / subtitles (was too dark)
    colorInputText: "#f8fafc",
    borderRadius: "0.65rem",
    fontFamily: "inherit",
  },
  elements: {
    card: "shadow-2xl border border-white/10 bg-[#0b1220]",
    headerTitle: "text-white",
    headerSubtitle: "text-slate-300",
    // Give the Google button a visible tinted background + light label.
    socialButtonsBlockButton: "border border-white/20 bg-white/[0.06] text-slate-100 hover:bg-white/[0.12]",
    socialButtonsBlockButtonText: "text-slate-100 font-medium",
    dividerLine: "bg-white/15",
    dividerText: "text-slate-400",
    formFieldLabel: "text-slate-200",
    formFieldInput: "border-white/10 text-slate-100",
    footerActionText: "text-slate-400",
    footerActionLink: "text-cyan-400 hover:text-cyan-300",
    footer: "text-slate-400",
  },
};

export function AuthShell({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  return (
    <div className="grid min-h-[calc(100vh-56px)] lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/25 via-slate-950 to-emerald-500/10" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)", backgroundSize: "44px 44px" }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2 text-lg font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 font-black text-white">P</span>
          PolySim OS
        </Link>

        <div className="relative">
          <h1 className="text-4xl font-black leading-tight text-white xl:text-5xl">
            The Everything Engine<br />for simulation.
          </h1>
          <p className="mt-5 max-w-md text-lg text-slate-300">
            Run 300+ real physics, math, and engineering solvers — plus 22,000 ready-made use cases — right in your browser.
          </p>
          <ul className="mt-8 space-y-3 text-slate-200">
            {["Free forever, runs locally — no install", "Save your work and unlock advanced tools", "Built for students, engineers & researchers"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-300">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-sm text-slate-500">© 2026 PolySim OS Labs · The Everything Engine for simulation</div>
      </div>

      {/* Auth column */}
      <div className="flex flex-col items-center justify-center bg-slate-900 px-4 py-16">
        <div className="mb-6 flex items-center gap-2 text-lg font-bold text-white lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 font-black text-white">P</span>
          PolySim OS
        </div>
        {clerkConfigured ? (
          isSignUp ? <SignUp appearance={appearance} /> : <SignIn appearance={appearance} />
        ) : (
          <div className="max-w-sm rounded-2xl border border-white/10 bg-slate-950 p-8 text-center">
            <p className="font-semibold text-slate-100">{isSignUp ? "Create your account" : "Welcome back"}</p>
            <p className="mt-2 text-sm text-slate-400">Sign-in activates once authentication keys are added. Every simulation runs free in the meantime.</p>
            <Link href="/studio" className="mt-5 inline-block rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700">Explore the Studio →</Link>
          </div>
        )}
        <p className="mt-8 max-w-sm text-center text-xs text-slate-500">
          By continuing you agree to our <Link href="/terms" className="underline hover:text-slate-300">Terms</Link> and <Link href="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
