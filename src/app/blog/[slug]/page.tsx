import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { getArticle, getAllArticleSlugs } from "@/lib/blog";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { articleLd } from "@/lib/seo";

export function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return { title: `${a.title} | PolySim OS Blog`, description: a.excerpt, alternates: { canonical: `/blog/${a.slug}` } };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: a.title, path: `/blog/${a.slug}` }]}
      jsonLd={articleLd({ headline: a.title, description: a.excerpt, path: `/blog/${a.slug}`, datePublished: a.date })}
      eyebrow={a.category}
      title={a.title}
      lede={a.excerpt}
    >
      <article className="mt-8 max-w-3xl space-y-8">
        {a.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.heading}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">{s.body}</p>
          </section>
        ))}
      </article>
      <PremiumCTA product={premiumUpsell(a.slug)} />
      <ProductGrid products={contextualProducts(a.slug, 6)} title="Related products" />
    </PageShell>
  );
}
