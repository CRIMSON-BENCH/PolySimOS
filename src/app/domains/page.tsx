import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { DOMAINS } from "@/lib/domains";
import { ProductGrid } from "@/components/ProductCard";
import { contextualProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Simulation Domains — Physics, Biology, Chemistry, Math & Engineering",
  description: "Explore every simulation domain PolySim OS covers: physics, biology, chemistry, mathematics, engineering, and data science — all in one browser workspace.",
  alternates: { canonical: "/domains" },
};

export default function DomainsIndex() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Domains", path: "/domains" }]}
      title="Simulation Domains"
      lede="One workspace for every science. Pick a domain to see the phenomena you can model — many with a live, runnable simulation."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAINS.map((d) => (
          <Link key={d.slug} href={`/domains/${d.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-cyan-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{d.name}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{d.tagline}</p>
            <p className="mt-3 text-xs text-slate-400">{d.topics.length} topics</p>
          </Link>
        ))}
      </div>
      <ProductGrid products={contextualProducts("domains", 6)} title="Popular products" />
    </PageShell>
  );
}
