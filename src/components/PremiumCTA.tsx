import Link from "next/link";
import { Product, priceLabel } from "@/lib/products";

// Amber/gold premium upsell banner used across content pages.
export function PremiumCTA({ product, heading }: { product: Product; heading?: string }) {
  return (
    <div className="mt-12 overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:border-amber-700/60 dark:from-amber-950/40 dark:to-orange-950/30">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            {heading ?? "Upgrade your workspace"}
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
            {product.name} — {priceLabel(product)}
          </h3>
          <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">{product.blurb}</p>
        </div>
        <Link
          href={`/tools/${product.slug}`}
          className="shrink-0 rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-white transition hover:bg-amber-600"
        >
          Get it →
        </Link>
      </div>
    </div>
  );
}

// Small inline banner upsell for a high-value add-on.
export function BannerUpsell({ product }: { product: Product }) {
  return (
    <Link
      href={`/tools/${product.slug}`}
      className="mt-8 flex items-center justify-between gap-4 rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-3 text-sm transition hover:border-cyan-400 dark:border-cyan-900 dark:bg-cyan-950/40"
    >
      <span className="text-slate-700 dark:text-slate-300">
        <span className="font-semibold text-cyan-700 dark:text-cyan-300">Add-on:</span> {product.name} — {product.blurb}
      </span>
      <span className="shrink-0 font-bold text-cyan-700 dark:text-cyan-300">{priceLabel(product)} →</span>
    </Link>
  );
}
