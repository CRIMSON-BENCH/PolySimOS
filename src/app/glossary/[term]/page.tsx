import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2 } from "@/components/PageShell";
import { getTerm, getAllTermSlugs, GLOSSARY } from "@/lib/glossary";
import { ProductGrid } from "@/components/ProductCard";
import { contextualProducts } from "@/lib/products";
import { definedTermLd } from "@/lib/seo";

export function generateStaticParams() {
  return getAllTermSlugs().map((term) => ({ term }));
}

export async function generateMetadata({ params }: { params: Promise<{ term: string }> }): Promise<Metadata> {
  const { term } = await params;
  const t = getTerm(term);
  if (!t) return {};
  return {
    title: `${t.term} — Definition | PolySim OS Glossary`,
    description: t.definition.slice(0, 155),
    alternates: { canonical: `/glossary/${t.slug}` },
  };
}

export default async function TermPage({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  const t = getTerm(term);
  if (!t) notFound();

  const related = t.related.map((s) => GLOSSARY.find((x) => x.slug === s)).filter(Boolean) as typeof GLOSSARY;

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Glossary", path: "/glossary" }, { name: t.term, path: `/glossary/${t.slug}` }]}
      jsonLd={definedTermLd({ term: t.term, definition: t.definition, path: `/glossary/${t.slug}` })}
      eyebrow={t.category}
      title={t.term}
      lede={t.definition}
    >
      {t.studio && (
        <Link href={t.studio} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-lime-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-lime-400">
          ▶ See {t.term} in a live simulation
        </Link>
      )}

      {related.length > 0 && (
        <>
          <H2>Related terms</H2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/glossary/${r.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {r.term}
              </Link>
            ))}
          </div>
        </>
      )}

      <ProductGrid products={contextualProducts(t.slug, 6)} title="Related products" />
    </PageShell>
  );
}
