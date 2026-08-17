import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ARTICLES } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — PolySim OS | Simulation, Methods & Scientific Computing",
  description: "Deep dives on simulation, numerical methods, AI surrogates, and scientific computing from the PolySim OS team.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const sorted = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]} title="The PolySim Blog" lede="Ideas on simulation, numerical methods, and turning theory into running reality.">
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sorted.map((a) => (
          <Link key={a.slug} href={`/blog/${a.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{a.category}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{a.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{a.excerpt}</p>
            <p className="mt-3 text-xs text-slate-400">{a.date}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
