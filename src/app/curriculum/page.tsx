import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { STANDARDS } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Curriculum-Aligned Simulations — AP, IB, A-Level, NGSS & More",
  description: "Simulations mapped to major curricula: AP Physics & Calculus, IB, A-Level, NGSS, GCSE, and MCAT. Free, browser-based labs for every unit.",
  alternates: { canonical: "/curriculum" },
};

export default function CurriculumIndex() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Curriculum", path: "/curriculum" }]} title="Curriculum-Aligned Simulations" lede="Simulations mapped to the standards you teach — pick your curriculum and get runnable labs for each unit.">
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STANDARDS.map((s) => (
          <Link key={s.slug} href={`/curriculum/${s.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{s.region}</p>
            <h2 className="mt-1 font-semibold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{s.name}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.blurb}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
