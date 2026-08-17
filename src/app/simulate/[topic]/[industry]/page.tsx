import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getSimTopic, SIM_TOPICS } from "@/lib/simulate";
import { getIndustry, INDUSTRIES } from "@/lib/industries";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  const params: { topic: string; industry: string }[] = [];
  for (const t of SIM_TOPICS) for (const ind of INDUSTRIES.slice(0, 12)) params.push({ topic: t.slug, industry: ind.slug });
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string; industry: string }> }): Promise<Metadata> {
  const { topic, industry } = await params;
  const t = getSimTopic(topic); const ind = getIndustry(industry);
  if (!t || !ind) return {};
  return {
    title: `Simulating ${t.name} for ${ind.name} | PolySim OS`,
    description: `How ${ind.name.toLowerCase()} teams simulate ${t.name.toLowerCase()} in the browser with PolySim OS — free to start, AI-assisted.`,
    alternates: { canonical: `/simulate/${t.slug}/${ind.slug}` },
  };
}

export default async function SimTopicIndustryPage({ params }: { params: Promise<{ topic: string; industry: string }> }) {
  const { topic, industry } = await params;
  const t = getSimTopic(topic); const ind = getIndustry(industry);
  if (!t || !ind) notFound();

  const faqs = [
    { q: `How does ${ind.name.toLowerCase()} use ${t.name.toLowerCase()} simulation?`, a: `${ind.name} teams apply ${t.name.toLowerCase()} to problems such as ${ind.useCases.join(", ")}. ${t.summary}` },
  ];

  return (
    <PageShell
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Simulate", path: "/simulate" },
        { name: t.name, path: `/simulate/${t.slug}` },
        { name: ind.name, path: `/simulate/${t.slug}/${ind.slug}` },
      ]}
      jsonLd={faqLd(faqs)}
      eyebrow={`${t.domainName} · ${ind.name}`}
      title={`Simulating ${t.name} for ${ind.name}`}
      lede={`Apply ${t.name.toLowerCase()} simulation to real ${ind.name.toLowerCase()} problems — in the browser, free to start.`}
    >
      {t.studio && (
        <Link href={t.studio} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-lime-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-lime-400">
          ▶ Launch the live {t.name} simulator
        </Link>
      )}
      <Prose>
        <p>In {ind.name.toLowerCase()}, {t.name.toLowerCase()} shows up in work like {ind.useCases.join(", ").toLowerCase()}. {t.summary} PolySim lets your team build and run these models in the browser and share interactive, citable results.</p>
      </Prose>

      <H2>Common {ind.name} challenges this addresses</H2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {ind.challenges.map((c) => (
          <li key={c} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{c}</li>
        ))}
      </ul>

      <PremiumCTA product={premiumUpsell(`${t.slug}${ind.slug}`)} />
      <ProductGrid products={contextualProducts(`${t.slug}-${ind.slug}`, 6)} title="Recommended products" />
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href={`/simulate/${t.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">← {t.name} guide</Link>
        <Link href={`/for/${ind.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">{ind.name} overview →</Link>
      </div>
    </PageShell>
  );
}
