import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getTopic, allDomainTopicPairs } from "@/lib/domains";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { faqLd, howToLd } from "@/lib/seo";

export function generateStaticParams() {
  return allDomainTopicPairs();
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string; topic: string }> }): Promise<Metadata> {
  const { domain, topic } = await params;
  const found = getTopic(domain, topic);
  if (!found) return {};
  return {
    title: `How to Simulate ${found.topic.name} — ${found.domain.name}`,
    description: `${found.topic.summary} Learn how to model ${found.topic.name.toLowerCase()} in your browser with PolySim OS.`,
    alternates: { canonical: `/domains/${domain}/${topic}` },
  };
}

export default async function TopicPage({ params }: { params: Promise<{ domain: string; topic: string }> }) {
  const { domain, topic } = await params;
  const found = getTopic(domain, topic);
  if (!found) notFound();
  const { domain: d, topic: t } = found;

  const steps = [
    { name: "Define the system", text: `Set up the governing equations and parameters for ${t.name.toLowerCase()} on the node graph.` },
    { name: "Set boundary & initial conditions", text: "Apply constraints and starting state so the problem is well-posed." },
    { name: "Choose a solver", text: "Pick an appropriate numerical method and resolution for your accuracy needs." },
    { name: "Run and inspect", text: "Run locally with WebGPU and explore results in the data inspector." },
    { name: "Iterate or scale", text: "Adjust parameters live, or scale to the cloud for larger runs." },
  ];
  const faqs = [
    { q: `Can I simulate ${t.name.toLowerCase()} for free?`, a: `Yes — local simulation of ${t.name.toLowerCase()} is free forever in PolySim OS. You only pay Compute Tokens for cloud-scale runs.` },
    { q: `What method does PolySim use for ${t.name.toLowerCase()}?`, a: `PolySim selects established numerical methods suited to ${t.name.toLowerCase()}, and the AI Copilot can recommend settings for your specific problem.` },
  ];

  const related = d.topics.filter((x) => x.slug !== t.slug).slice(0, 6);

  return (
    <PageShell
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Domains", path: "/domains" },
        { name: d.name, path: `/domains/${d.slug}` },
        { name: t.name, path: `/domains/${d.slug}/${t.slug}` },
      ]}
      jsonLd={[faqLd(faqs), howToLd({ name: `How to simulate ${t.name}`, description: t.summary, steps })]}
      eyebrow={d.name}
      title={`Simulate ${t.name}`}
      lede={t.summary}
    >
      {t.studio && (
        <Link href={t.studio} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-lime-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-lime-400">
          ▶ Launch the live {t.name} simulator
        </Link>
      )}

      <H2>How to model {t.name.toLowerCase()} in PolySim</H2>
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

      <Prose>
        <p>
          {t.name} is a core topic in {d.name.toLowerCase()}. With PolySim OS you can build a model
          visually, run it in real time on your own device, and share an interactive version with
          collaborators or students. Because everything runs in the browser, there is nothing to
          install and no license to manage — start free and scale only when a problem outgrows your
          device.
        </p>
      </Prose>

      <PremiumCTA product={premiumUpsell(t.slug)} />
      <ProductGrid products={contextualProducts(t.slug, 6)} title="Recommended products" />

      <H2>Related topics</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {related.map((r) => (
          <Link key={r.slug} href={`/domains/${d.slug}/${r.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {r.name}
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
