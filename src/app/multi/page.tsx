import type { Metadata } from "next";
import Link from "next/link";
import { MULTIS, PACKS } from "@/lib/multi";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = { title: "Multi-Solvers — End-to-End Workflows", description: `${MULTIS.length} guided multi-solver workflows that chain PolySim's solvers into complete, real-world analyses — from bridge design to portfolio building to epidemic response. Free, interactive.`, alternates: { canonical: "/multi" } };

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Multi-Solvers", path: "/multi" }]} />
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">Multi-Solvers</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-600 dark:text-slate-400">The tier above single solvers. Each of these {MULTIS.length} workflows chains several solvers into one guided, end-to-end analysis — the way real engineering, science, and finance problems are actually solved. Every step runs live in your browser.</p>
      {PACKS.map((pack) => {
        const items = MULTIS.filter((m) => m.p === pack);
        return (
          <section key={pack} className="mt-10">
            <h2 className="text-xl font-bold text-cyan-700 dark:text-cyan-400">{pack} <span className="text-sm font-normal text-slate-400">({items.length})</span></h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <Link key={m.s} href={`/multi/${m.s}`} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cyan-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{m.n}</div>
                  <div className="mt-1 text-sm text-slate-500">{m.t}</div>
                  <div className="mt-2 text-xs text-cyan-600 dark:text-cyan-400">{m.steps.length} solvers chained →</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
