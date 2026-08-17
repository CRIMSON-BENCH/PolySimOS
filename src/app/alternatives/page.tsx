import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { COMPARISONS } from "@/lib/comparisons";

export const metadata: Metadata = {
  title: "Simulation Software Alternatives — SimScale, Ansys, COMSOL, MATLAB",
  description: "Looking for a browser-based, affordable alternative to legacy simulation software? See how PolySim OS replaces SimScale, Ansys, COMSOL, MATLAB, and more.",
  alternates: { canonical: "/alternatives" },
};

export default function AlternativesIndex() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Alternatives", path: "/alternatives" }]} title="A Better Alternative to Legacy Simulation Tools" lede="Browser-native, AI-assisted, transparently priced. See what PolySim OS replaces.">
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMPARISONS.map((c) => (
          <Link key={c.slug} href={`/alternatives/${c.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <h2 className="font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">The {c.competitor} Alternative</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{c.tagline}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
