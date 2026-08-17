import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getMethod, METHODS } from "@/lib/methods";
import { getIndustry, INDUSTRIES } from "@/lib/industries";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { CrossLinks } from "@/components/CrossLinks";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { faqLd } from "@/lib/seo";

// Method × industry factory. Cap variant methods to keep the page count focused
// on high-intent base methods across every industry.
export function generateStaticParams() {
  const baseMethods = METHODS.filter((m) => !/^(explicit|implicit|2d|3d|transient|steady-state|gpu-accelerated) /i.test(m.name));
  const params: { method: string; industry: string }[] = [];
  for (const m of baseMethods) for (const ind of INDUSTRIES) params.push({ method: m.slug, industry: ind.slug });
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ method: string; industry: string }> }): Promise<Metadata> {
  const { method, industry } = await params;
  const m = getMethod(method); const ind = getIndustry(industry);
  if (!m || !ind) return {};
  return {
    title: `${m.name} for ${ind.name} — Simulation Guide`,
    description: `How the ${m.name.toLowerCase()} is applied in ${ind.name.toLowerCase()}: ${ind.useCases.join(", ")}.`,
    alternates: { canonical: `/methods/${m.slug}/${ind.slug}` },
  };
}

export default async function MethodIndustryPage({ params }: { params: Promise<{ method: string; industry: string }> }) {
  const { method, industry } = await params;
  const m = getMethod(method); const ind = getIndustry(industry);
  if (!m || !ind) notFound();

  const faqs = [
    { q: `How is the ${m.name} used in ${ind.name.toLowerCase()}?`, a: `In ${ind.name.toLowerCase()}, the ${m.name.toLowerCase()} supports work such as ${ind.useCases.join(", ")}. ${m.summary}` },
    { q: `Can PolySim run this in the browser?`, a: `Yes — PolySim runs ${m.name.toLowerCase()} workflows in the browser with WebGPU, free for local use, with optional cloud scale.` },
  ];

  return (
    <PageShell
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Methods", path: "/methods" },
        { name: m.name, path: `/methods/${m.slug}` },
        { name: ind.name, path: `/methods/${m.slug}/${ind.slug}` },
      ]}
      jsonLd={faqLd(faqs)}
      eyebrow={`${m.category} · ${ind.name}`}
      title={`${m.name} for ${ind.name}`}
      lede={`Apply the ${m.name.toLowerCase()} to real ${ind.name.toLowerCase()} problems — in the browser, with AI assistance.`}
    >
      <Prose>
        <p>{m.detail}</p>
        <p>
          In {ind.name.toLowerCase()}, teams face challenges like {ind.challenges.join(", ").toLowerCase()}.
          The {m.name.toLowerCase()} directly supports use cases such as {ind.useCases.join(", ").toLowerCase()},
          and PolySim&apos;s AI Copilot can recommend settings and catch common setup errors before you run.
        </p>
      </Prose>

      <H2>Typical {ind.name} use cases</H2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {ind.useCases.map((u) => (
          <li key={u} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{u}</li>
        ))}
      </ul>

      <PremiumCTA product={premiumUpsell(`${m.slug}${ind.slug}`)} />
      <ProductGrid products={contextualProducts(`${m.slug}-${ind.slug}`, 6)} title="Recommended products" />
      <CrossLinks
        title={`More ${ind.name} simulation`}
        links={[
          { name: `${ind.name} overview`, href: `/for/${ind.slug}` },
          { name: `${m.name} overview`, href: `/methods/${m.slug}` },
        ]}
      />
    </PageShell>
  );
}
