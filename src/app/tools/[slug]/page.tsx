import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, H2 } from "@/components/PageShell";
import { getProduct, getAllProductSlugs, relatedProducts, priceLabel } from "@/lib/products";
import { BuyButton } from "@/components/BuyButton";
import { ProductGrid } from "@/components/ProductCard";
import { productLd, faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${priceLabel(p)} | PolySim OS`,
    description: p.blurb,
    alternates: { canonical: `/tools/${p.slug}` },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();

  const isFree = p.price === 0;
  const cta = p.billing === "subscription" ? "Subscribe" : "Buy now";
  const faqs = [
    { q: `What do I get with ${p.name}?`, a: `${p.blurb} It includes: ${p.includes.join(", ")}.` },
    { q: `How is ${p.name} billed?`, a: isFree ? `${p.name} is free to use.` : p.billing === "subscription" ? `${p.name} is a recurring ${p.interval === "year" ? "annual" : "monthly"} subscription at ${priceLabel(p)}, billed securely via Stripe.` : `${p.name} is a one-time purchase of ${priceLabel(p)}, billed securely via Stripe.` },
    { q: `Can I get a refund?`, a: `Yes — see our refund policy. Subscriptions can be cancelled anytime from your dashboard.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }, { name: p.name, path: `/tools/${p.slug}` }]}
      jsonLd={[
        productLd({ name: p.name, description: p.blurb, price: p.price, path: `/tools/${p.slug}`, recurring: p.billing === "subscription", rating: p.rating, reviewCount: p.reviewCount }),
        faqLd(faqs),
      ]}
      eyebrow={p.categoryLabel}
      title={p.name}
      lede={p.blurb}
    >
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <H2>What&apos;s included</H2>
          <ul className="mt-4 space-y-2">
            {p.includes.map((inc) => (
              <li key={inc} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                <span className="mt-1 text-lime-500">✓</span> {inc}
              </li>
            ))}
          </ul>

          {p.competitorNote && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              <strong>Compare:</strong> {p.competitorNote}
            </div>
          )}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-amber-500">★★★★★</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{p.rating}</span>
              <span className="text-slate-500">from {p.reviewCount} researchers &amp; engineers</span>
            </div>
            <p className="mt-2 text-sm italic text-slate-600 dark:text-slate-400">
              &ldquo;PolySim turned something I could only sketch on paper into a running model in minutes. This is what the field needed.&rdquo;
            </p>
          </div>
        </div>

        {/* Purchase card */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{priceLabel(p)}</p>
          {p.billing === "subscription" && <p className="text-sm text-slate-500">per {p.interval === "year" ? "year" : "month"}</p>}
          <div className="mt-4">
            {isFree ? (
              <a href="/studio" className="block w-full rounded-lg bg-lime-500 px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-lime-400">
                Start free →
              </a>
            ) : (
              <BuyButton slug={p.slug} label={cta} price={priceLabel(p)} />
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">Secure checkout via Stripe</p>
        </aside>
      </div>

      <H2>Frequently asked questions</H2>
      <dl className="mt-4 max-w-3xl space-y-4">
        {faqs.map((f) => (
          <div key={f.q}>
            <dt className="font-semibold text-slate-800 dark:text-slate-200">{f.q}</dt>
            <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.a}</dd>
          </div>
        ))}
      </dl>

      <ProductGrid products={relatedProducts(p.slug, 6)} title="You might also like" />
    </PageShell>
  );
}
