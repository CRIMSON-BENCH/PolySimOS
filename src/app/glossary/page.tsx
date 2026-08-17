import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { GLOSSARY } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Simulation Glossary — Terms in Physics, Math & Engineering Modeling",
  description: "Clear definitions of the terms you meet in simulation and modeling — from finite element analysis to Reynolds number, many with a live demo.",
  alternates: { canonical: "/glossary" },
};

export default function GlossaryIndex() {
  const sorted = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Glossary", path: "/glossary" }]}
      title="Simulation Glossary"
      lede="The vocabulary of simulation, defined clearly — with live demonstrations wherever we can show, not just tell."
    >
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {sorted.map((t) => (
          <Link key={t.slug} href={`/glossary/${t.slug}`} className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{t.term}</h2>
              {t.studio && <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-700 dark:bg-lime-950 dark:text-lime-300">LIVE</span>}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{t.definition}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
