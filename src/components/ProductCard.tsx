import Link from "next/link";
import { Product, priceLabel } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/tools/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">
          {product.name}
        </h3>
        <span className="shrink-0 rounded-lg bg-cyan-50 px-2.5 py-1 text-sm font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
          {priceLabel(product)}
        </span>
      </div>
      <p className="mb-3 flex-1 text-sm text-slate-600 dark:text-slate-400">{product.blurb}</p>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
        <span>{product.categoryLabel}</span>
        <span className="font-medium text-cyan-600 opacity-0 transition group-hover:opacity-100 dark:text-cyan-400">View →</span>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, title }: { products: Product[]; title?: string }) {
  if (!products.length) return null;
  return (
    <section className="mt-12">
      {title && (
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
