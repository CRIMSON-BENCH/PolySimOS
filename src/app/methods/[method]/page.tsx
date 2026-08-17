import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getMethod, getAllMethodSlugs } from "@/lib/methods";
import { INDUSTRIES } from "@/lib/industries";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { faqLd } from "@/lib/seo";
import { StudioPromo } from "@/components/StudioPromo";

export function generateStaticParams() {
  return getAllMethodSlugs().map((method) => ({ method }));
}

export async function generateMetadata({ params }: { params: Promise<{ method: string }> }): Promise<Metadata> {
  const { method } = await params;
  const m = getMethod(method);
  if (!m) return {};
  return {
    title: `${m.name} — Simulation Method Explained`,
    description: `${m.summary}`,
    alternates: { canonical: `/methods/${m.slug}` },
  };
}

export default async function MethodPage({ params }: { params: Promise<{ method: string }> }) {
  const { method } = await params;
  const m = getMethod(method);
  if (!m) notFound();

  const faqs = [
    { q: `What is the ${m.name}?`, a: m.detail },
    { q: `What is the ${m.name} best for?`, a: `It is particularly well-suited to: ${m.bestFor.join(", ")}.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Methods", path: "/methods" }, { name: m.name, path: `/methods/${m.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow={m.category}
      title={m.name}
      lede={m.summary}
    >
      <Prose>
        <p>{m.detail}</p>
      </Prose>

      <H2>Best suited for</H2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {m.bestFor.map((b) => (
          <li key={b} className="rounded-full bg-cyan-50 px-3 py-1 text-sm text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">{b}</li>
        ))}
      </ul>

      <H2>{m.name} by industry</H2>
      <p className="mt-2 text-slate-600 dark:text-slate-400">See how the {m.name.toLowerCase()} is applied across sectors:</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {INDUSTRIES.map((ind) => (
          <Link key={ind.slug} href={`/methods/${m.slug}/${ind.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {m.name} for {ind.name}
          </Link>
        ))}
      </div>

      <PremiumCTA product={premiumUpsell(m.slug)} />
      <ProductGrid products={contextualProducts(m.slug, 6)} title="Related products" />
      <StudioPromo />
    </PageShell>
  );
}
