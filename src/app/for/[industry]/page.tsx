import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getIndustry, getAllIndustrySlugs } from "@/lib/industries";
import { METHODS } from "@/lib/methods";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { faqLd } from "@/lib/seo";
import { StudioPromo } from "@/components/StudioPromo";

export function generateStaticParams() {
  return getAllIndustrySlugs().map((industry) => ({ industry }));
}

export async function generateMetadata({ params }: { params: Promise<{ industry: string }> }): Promise<Metadata> {
  const { industry } = await params;
  const i = getIndustry(industry);
  if (!i) return {};
  return {
    title: `Simulation for ${i.name} — PolySim OS`,
    description: `${i.summary} Browser-native simulation for ${i.name.toLowerCase()}: ${i.useCases.join(", ")}.`,
    alternates: { canonical: `/for/${i.slug}` },
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  const i = getIndustry(industry);
  if (!i) notFound();

  const relevantMethods = METHODS.filter((m) => !/^(explicit|implicit|2d|3d|transient|steady-state|gpu-accelerated) /i.test(m.name)).slice(0, 8);
  const faqs = [
    { q: `Why use PolySim for ${i.name.toLowerCase()}?`, a: `${i.summary} PolySim runs in the browser with AI assistance and flat pricing, removing the cost and setup barriers of legacy tools.` },
    { q: `What can I simulate in ${i.name.toLowerCase()}?`, a: `Common workflows include ${i.useCases.join(", ")}.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Industries", path: "/for" }, { name: i.name, path: `/for/${i.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow="Industry"
      title={`Simulation for ${i.name}`}
      lede={i.summary}
    >
      <H2>Key challenges</H2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {i.challenges.map((c) => (
          <li key={c} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{c}</li>
        ))}
      </ul>

      <H2>Common use cases</H2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {i.useCases.map((u) => (
          <li key={u} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{u}</li>
        ))}
      </ul>

      <H2>Methods used in {i.name}</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {relevantMethods.map((m) => (
          <Link key={m.slug} href={`/methods/${m.slug}/${i.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {m.name} for {i.name}
          </Link>
        ))}
      </div>

      <Prose><p>PolySim OS gives {i.name.toLowerCase()} teams a fast, browser-native path from idea to running simulation — no desktop install, no per-seat license shock, and an AI Copilot that turns plain-English intent into a working model.</p></Prose>

      <PremiumCTA product={premiumUpsell(i.slug)} />
      <ProductGrid products={contextualProducts(i.slug, 6)} title={`Products for ${i.name}`} />
      <StudioPromo heading={`Simulate ${i.name.toLowerCase()} problems live`} />
    </PageShell>
  );
}
