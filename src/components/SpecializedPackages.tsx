"use client";

import { useState } from "react";
import { PRODUCTS, priceLabel, categoryLabel, CATEGORY_ORDER } from "@/lib/products";
import type { Product, ProductCategory } from "@/lib/products";

// One-time / à-la-carte packs shown under the four subscription tiers.
const ONE_TIME_CATEGORIES: ProductCategory[] = CATEGORY_ORDER.filter(
  (c) => !["consumer-sub", "business-sub", "membership", "affiliate", "marketplace", "advertising"].includes(c),
);

const CATEGORY_BLURB: Partial<Record<ProductCategory, string>> = {
  core: "Credits & compute — pay for exactly what you run.",
  premium: "Power sessions that unlock the heavy machinery for a task.",
  bundle: "Domain kits — a whole field's solvers unlocked at once.",
  service: "Done-with-you: expert review, setup, and validation.",
  addon: "Boosters — rush compute, extra storage, extras.",
  report: "One-off analysis reports, generated on demand.",
  education: "Courses & masterclasses to go from zero to fluent.",
};

function PackCard({ p }: { p: Product }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: p.slug }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url as string;
      else setError(data.error || "Checkout isn't set up yet.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 transition hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-700">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-[13px] font-semibold leading-tight text-slate-800 dark:text-slate-100">{p.name}</h4>
        <span className="shrink-0 text-sm font-bold text-cyan-600 dark:text-cyan-400">{priceLabel(p)}</span>
      </div>
      <p className="mt-1 flex-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{p.blurb}</p>
      <button
        onClick={buy}
        disabled={loading}
        className="mt-2.5 rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300"
      >
        {loading ? "…" : "Buy"}
      </button>
      {error && <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">{error}</p>}
    </div>
  );
}

export function SpecializedPackages() {
  const groups = ONE_TIME_CATEGORIES
    .map((cat) => ({ cat, items: PRODUCTS.filter((p) => p.category === cat && p.billing !== "subscription" && p.price > 0) }))
    .filter((g) => g.items.length > 0);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div data-hide-in-app className="mt-14">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Specialized packages</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        No subscription needed — {total} one-time packs, credits, kits, reports, and services. Buy exactly what a single project needs.
      </p>

      <div className="mt-6 space-y-8">
        {groups.map(({ cat, items }) => (
          <div key={cat}>
            <div className="mb-3 flex items-baseline gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">{categoryLabel(cat)}</h3>
              <span className="text-xs text-slate-400">{CATEGORY_BLURB[cat]}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => <PackCard key={p.slug} p={p} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
