import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SCHOOLS } from "@/lib/schools";

export const metadata: Metadata = {
  title: "STEM Simulations for High Schools — Free Browser Labs",
  description: "Free, browser-based physics, chemistry, and math simulations for high-school STEM classrooms. AP, IB, and A-Level aligned. No install.",
  alternates: { canonical: "/schools" },
};

export default function SchoolsIndex() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "High Schools", path: "/schools" }]} title="Simulations for High Schools" lede="Real, runnable STEM labs for high-school classrooms — free, in the browser, aligned to AP, IB, and A-Level.">
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/curriculum" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">Browse by curriculum (AP/IB/A-Level) →</Link>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {SCHOOLS.map((s) => (
          <Link key={s.slug} href={`/schools/${s.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{s.name}</Link>
        ))}
      </div>
    </PageShell>
  );
}
