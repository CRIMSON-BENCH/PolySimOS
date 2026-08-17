import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { COMPARISONS } from "@/lib/comparisons";

export const metadata: Metadata = {
  title: "Compare PolySim OS — vs SimScale, Ansys, COMSOL, MATLAB & More",
  description: "Honest, side-by-side comparisons of PolySim OS against the leading simulation tools on pricing, features, and scope.",
  alternates: { canonical: "/compare" },
};

export default function CompareIndex() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }]}
      title="How PolySim OS Compares"
      lede="Straight comparisons against every major simulation tool — pricing, features, and where each one wins."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {COMPARISONS.map((c) => (
          <Link key={c.slug} href={`/compare/${c.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <h2 className="font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">PolySim OS vs {c.competitor}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{c.tagline}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
