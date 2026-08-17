import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { PRODUCTS, CATEGORY_ORDER, categoryLabel } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Tools, Plans & Products — PolySim OS",
  description: "Every PolySim OS product: compute packs, premium tools, bundles, expert services, subscriptions, and more. Transparent pricing, no quotes.",
  alternates: { canonical: "/tools" },
};

export default function ToolsIndex() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }]}
      title="Tools, Plans & Products"
      lede="Everything PolySim offers, with transparent pricing — from $2 compute packs to enterprise plans. No quotes, no sales calls."
    >
      {CATEGORY_ORDER.map((cat) => {
        const items = PRODUCTS.filter((p) => p.category === cat);
        if (!items.length) return null;
        return (
          <section key={cat} className="mt-12">
            <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">{categoryLabel(cat)}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        );
      })}
    </PageShell>
  );
}
