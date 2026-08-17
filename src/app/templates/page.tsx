import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SIM_TOPICS } from "@/lib/simulate";

export const metadata: Metadata = {
  title: "Simulation Templates — Forkable Example Projects",
  description: "Start from a working example. Fork ready-made simulation templates across physics, biology, chemistry, math, and engineering.",
  alternates: { canonical: "/templates" },
};

export default function TemplatesIndex() {
  const withStudio = SIM_TOPICS.filter((t) => t.studio);
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Templates", path: "/templates" }]} title="Simulation Templates" lede="Don't start from a blank canvas. Fork a working example and make it yours.">
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {withStudio.map((t) => (
          <Link key={t.slug} href={t.studio!} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-700 dark:bg-lime-950 dark:text-lime-300">RUNNABLE</span>
            <h2 className="mt-2 font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{t.name}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.summary}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
