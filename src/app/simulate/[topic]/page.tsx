import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getSimTopic, getAllSimTopicSlugs } from "@/lib/simulate";
import { INDUSTRIES } from "@/lib/industries";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { howToLd, faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return getAllSimTopicSlugs().map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const { topic } = await params;
  const t = getSimTopic(topic);
  if (!t) return {};
  return {
    title: `How to Simulate ${t.name} in Your Browser`,
    description: `${t.summary} A step-by-step guide to simulating ${t.name.toLowerCase()} online, free, with PolySim OS.`,
    alternates: { canonical: `/simulate/${t.slug}` },
  };
}

export default async function SimulateTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = getSimTopic(topic);
  if (!t) notFound();

  const steps = [
    { name: "Open the Studio", text: "Launch PolySim Studio in your browser — no install or signup needed to start." },
    { name: `Set up ${t.name.toLowerCase()}`, text: "Add the relevant nodes and parameters, or describe the system to the AI Copilot." },
    { name: "Configure conditions", text: "Set boundary and initial conditions so the model is well-posed." },
    { name: "Run and explore", text: "Run locally with WebGPU and inspect the results interactively." },
    { name: "Share or scale", text: "Publish an interactive embed, or scale to the cloud for larger runs." },
  ];
  const faqs = [
    { q: `Can I simulate ${t.name.toLowerCase()} for free?`, a: `Yes — ${t.name.toLowerCase()} runs free in your browser with PolySim OS. Cloud-scale runs use metered Compute Tokens.` },
    { q: `Do I need to code?`, a: `No. Build visually on the node graph, or use the AI Copilot to generate the model from plain English.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Simulate", path: "/simulate" }, { name: t.name, path: `/simulate/${t.slug}` }]}
      jsonLd={[howToLd({ name: `How to simulate ${t.name}`, description: t.summary, steps }), faqLd(faqs)]}
      eyebrow={t.domainName}
      title={`How to Simulate ${t.name}`}
      lede={t.summary}
    >
      {t.studio && (
        <Link href={t.studio} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-lime-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-lime-400">
          ▶ Launch the live {t.name} simulator
        </Link>
      )}

      <H2>Step by step</H2>
      <ol className="mt-6 space-y-4">
        {steps.map((s, i) => (
          <li key={s.name} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">{i + 1}</span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <Prose><p>Related to <Link href={`/domains/${t.domainSlug}/${t.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">{t.name} in {t.domainName}</Link>.</p></Prose>

      <H2>{t.name} by industry</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {INDUSTRIES.slice(0, 12).map((ind) => (
          <Link key={ind.slug} href={`/simulate/${t.slug}/${ind.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {t.name} for {ind.name}
          </Link>
        ))}
      </div>

      <PremiumCTA product={premiumUpsell(t.slug)} />
      <ProductGrid products={contextualProducts(`sim-${t.slug}`, 6)} title="Recommended products" />
    </PageShell>
  );
}
