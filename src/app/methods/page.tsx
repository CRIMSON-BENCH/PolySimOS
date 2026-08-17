import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { METHODS } from "@/lib/methods";

export const metadata: Metadata = {
  title: "Numerical & Simulation Methods — FEM, FVM, RK4, Monte Carlo & More",
  description: "A reference of the numerical methods behind modern simulation: finite element, finite volume, Runge–Kutta, Monte Carlo, molecular dynamics, and dozens more.",
  alternates: { canonical: "/methods" },
};

export default function MethodsIndex() {
  const byCat: Record<string, typeof METHODS> = {};
  for (const m of METHODS) (byCat[m.category] ??= []).push(m);
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Methods", path: "/methods" }]}
      title="Simulation Methods"
      lede="The numerical engines behind every simulation. Browse by category to understand each method and how PolySim applies it."
    >
      {Object.entries(byCat).map(([cat, list]) => (
        <div key={cat} className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">{cat}</h2>
          <div className="flex flex-wrap gap-2">
            {list.map((m) => (
              <Link key={m.slug} href={`/methods/${m.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {m.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </PageShell>
  );
}
