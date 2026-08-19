import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppLd } from "@/lib/seo";
import { DISCLAIMER_SHORT } from "@/lib/disclaimer";
import { PRODUCT_COUNT } from "@/lib/products";
import { IdleFinderPrompt } from "@/components/IdleFinderPrompt";
import { SolverMarquee } from "@/components/SolverMarquee";

export const metadata: Metadata = {
  title: "PolySim OS — The Everything Engine for Simulation",
  description:
    "Connect physics, biology, chemistry, and math in one AI-powered, browser-based simulation workspace. WebGPU-accelerated. Local rendering free forever.",
  alternates: { canonical: "/" },
};

const FEATURES = [
  { title: "Particle / N-Body", desc: "Gravity, orbits, and collisions with a real symplectic integrator.", href: "/studio/particles" },
  { title: "2D Fluid (CFD)", desc: "Interactive Navier–Stokes fluid you can stir with your cursor.", href: "/studio/fluid" },
  { title: "Dynamical Systems", desc: "Lorenz chaos, SIR epidemics, reaction–diffusion, and more.", href: "/studio/dynamics" },
  { title: "Symbolic Math", desc: "Differentiate, simplify, solve, and plot — a real CAS.", href: "/studio/cas" },
  { title: "AI Surrogate", desc: "Instant ML predictions trained on our own solvers.", href: "/studio/surrogate" },
  { title: "AI Copilot", desc: "Describe a system in plain English; get a runnable graph.", href: "/product/ai-copilot" },
];

export default function Home() {
  return (
    <div>
      <JsonLd data={softwareAppLd({ name: "PolySim OS", description: "Browser-based multi-domain simulation workspace.", path: "/" })} />

      {/* Hero */}
      <section className="grid-bg border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="inline-block rounded-full border border-cyan-300 bg-cyan-50 px-4 py-1 text-sm font-semibold text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300">
            WebGPU + WebAssembly · Local rendering free forever
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-6xl">
            The Everything Engine for{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-lime-500 bg-clip-text text-transparent">simulation</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Connect physics, biology, chemistry, and math in a single AI-powered workspace.
            For the minds who can see the equations — turn them into running reality.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/studio" className="rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white transition hover:bg-cyan-700">
              Launch Studio — free
            </Link>
            <Link href="/pricing" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Honest social proof: a scrolling wall of the REAL simulators (no fabricated logos) */}
      <SolverMarquee count={390} />

      {/* Unified canvas */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Simulate reality in one unified canvas</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            A creative tool for science — not a 1990s spreadsheet. Wire physics into chemistry into math on a single
            node graph, and watch it run in real time.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-cyan-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
              <h3 className="font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Hybrid compute */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">Hybrid Compute</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Local by default. Cloud when you need 5 billion particles.</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Your device is powerful. Run locally with WebGPU for free, and burst to serverless GPU clusters —
              metered by Compute Tokens — only when a problem outgrows your hardware.
            </p>
            <Link href="/product/hybrid-compute" className="mt-4 inline-block font-semibold text-cyan-600 hover:underline dark:text-cyan-400">How hybrid compute works →</Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-bold uppercase tracking-wide text-lime-600 dark:text-lime-400">Run the math</p>
            <p className="mt-2 text-slate-600 dark:text-slate-400">This isn&apos;t a screenshot — it&apos;s a live integrator.</p>
            <Link href="/studio/dynamics" className="mt-4 inline-block rounded-lg bg-lime-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-lime-400">▶ Launch a live simulation</Link>
          </div>
        </div>
      </section>

      {/* Growth loops */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">Growth Loops</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Built to spread through science</h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["The “Cite Us” loop", "Mint a DOI for any simulation. Every citation is a link back — research that compounds.", "/studio"],
            ["Programmatic SEO", "Live, runnable pages for every topic, method, material, and equation people search.", "/simulate"],
            ["Share & embed", "Share any simulation to your socials or embed it in a page — every view links back.", "/developers"],
          ].map(([t, d, href]) => (
            <Link key={t} href={href} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">{t}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{d}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 text-center sm:grid-cols-4">
          {[
            ["390+", "live simulators"],
            [`${PRODUCT_COUNT}+`, "products & plans"],
            ["100%", "runs in-browser"],
            ["$0", "to start"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400">{n}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Start free. Render your first simulation in minutes.</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">No download, no credit card. Scale to the cloud only when reality gets heavy.</p>
        <Link href="/studio" className="mt-6 inline-block rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white transition hover:bg-cyan-700">
          Launch Studio
        </Link>
        <p className="mx-auto mt-10 max-w-3xl text-xs text-slate-400">{DISCLAIMER_SHORT}</p>
      </section>

      <IdleFinderPrompt />
    </div>
  );
}
