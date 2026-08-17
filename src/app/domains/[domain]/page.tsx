import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2 } from "@/components/PageShell";
import { getDomain, getAllDomainSlugs } from "@/lib/domains";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { CrossLinks } from "@/components/CrossLinks";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return getAllDomainSlugs().map((domain) => ({ domain }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const d = getDomain(domain);
  if (!d) return {};
  return {
    title: `${d.name} Simulation — ${d.tagline}`,
    description: `${d.intro.slice(0, 155)}`,
    alternates: { canonical: `/domains/${d.slug}` },
  };
}

export default async function DomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const d = getDomain(domain);
  if (!d) notFound();

  const faqs = [
    { q: `Can I run ${d.name.toLowerCase()} simulations in the browser?`, a: `Yes. PolySim OS runs ${d.name.toLowerCase()} models directly in your browser with WebGPU acceleration — no install, free for local use.` },
    { q: `Is PolySim suitable for research-grade ${d.name.toLowerCase()}?`, a: `PolySim uses established numerical methods and supports reproducible, citable projects, though results should be validated before you rely on them.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Domains", path: "/domains" }, { name: d.name, path: `/domains/${d.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow="Domain"
      title={`${d.name} Simulation`}
      lede={d.intro}
    >
      <H2>Topics in {d.name}</H2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {d.topics.map((t) => (
          <Link key={t.slug} href={`/domains/${d.slug}/${t.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{t.name}</h3>
              {t.studio && <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-700 dark:bg-lime-950 dark:text-lime-300">LIVE</span>}
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.summary}</p>
          </Link>
        ))}
      </div>

      <PremiumCTA product={premiumUpsell(d.slug)} />
      <ProductGrid products={contextualProducts(d.slug, 6)} title={`Tools for ${d.name}`} />
      <CrossLinks title="Other domains" links={[{ name: "All domains", path: "/domains" }].map((x) => ({ name: x.name, href: x.path }))} />
    </PageShell>
  );
}
