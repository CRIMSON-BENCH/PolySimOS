import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { LISTINGS } from "@/lib/marketplace";
import { getProduct } from "@/lib/products";
import { PremiumCTA } from "@/components/PremiumCTA";

export const metadata: Metadata = {
  title: "Marketplace — Forkable Simulations, Nodes & Templates",
  description: "Browse and buy community-built simulation models, custom nodes, and templates. Fork free examples or sell your own and keep 70%.",
  alternates: { canonical: "/marketplace" },
};

export default function MarketplaceIndex() {
  const sell = getProduct("community-model-marketplace");
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Marketplace", path: "/marketplace" }]}
      title="Community Marketplace"
      lede="Start from someone else's work. Fork free models, buy specialized ones, or sell your own creations and keep 70%."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LISTINGS.map((l) => (
          <Link key={l.slug} href={`/marketplace/${l.slug}`} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800">{l.kind}</span>
              <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">{l.price === 0 ? "Free" : `$${l.price}`}</span>
            </div>
            <h2 className="font-semibold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{l.title}</h2>
            <p className="mb-3 mt-1 flex-1 text-sm text-slate-600 dark:text-slate-400">{l.blurb}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>@{l.author}</span>
              <span>{l.downloads.toLocaleString()} uses</span>
            </div>
          </Link>
        ))}
      </div>
      {sell && <PremiumCTA product={sell} heading="Sell your own models & nodes" />}
    </PageShell>
  );
}
