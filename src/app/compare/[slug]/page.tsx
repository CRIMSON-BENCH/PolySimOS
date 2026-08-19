import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getComparison, getAllComparisonSlugs } from "@/lib/comparisons";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { ClipShowcase } from "@/components/ClipShowcase";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return {};
  return {
    title: `PolySim OS vs ${c.competitor} — Features & Pricing Compared`,
    description: `${c.tagline} Compare PolySim OS and ${c.competitor} on pricing, features, and scope.`,
    alternates: { canonical: `/compare/${c.slug}` },
  };
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  const faqs = [
    { q: `Is PolySim OS cheaper than ${c.competitor}?`, a: `${c.competitor} pricing: ${c.theirPricing} PolySim OS pricing: ${c.polysimPricing}.` },
    { q: `Should I switch from ${c.competitor} to PolySim?`, a: c.verdict },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Compare", path: "/compare/simscale" }, { name: `vs ${c.competitor}`, path: `/compare/${c.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow="Comparison"
      title={`PolySim OS vs ${c.competitor}`}
      lede={c.intro}
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-cyan-300 bg-cyan-50 p-5 dark:border-cyan-800 dark:bg-cyan-950/40">
          <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300">PolySim OS</p>
          <p className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">{c.polysimPricing}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-500">{c.competitor}</p>
          <p className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">{c.theirPricing}</p>
        </div>
      </div>

      <H2>See PolySim in action</H2>
      <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">Live, interactive simulators that run free in your browser — no install, no license.</p>
      <div className="mt-5">
        <ClipShowcase slugs={["fluid", "double-pendulum", "attractors", "dynamics", "bode-plot", "bloch-sphere"]} max={6} />
      </div>

      <H2>Feature comparison</H2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-900">
              <th className="px-4 py-2.5 font-semibold">Feature</th>
              <th className="px-4 py-2.5 font-semibold text-cyan-700 dark:text-cyan-400">PolySim OS</th>
              <th className="px-4 py-2.5 font-semibold text-slate-500">{c.competitor}</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r) => (
              <tr key={r.feature} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{r.feature}</td>
                <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{r.polysim}</td>
                <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{r.them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Where {c.competitor} is strong</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {c.theirStrengths.map((s) => <li key={s}>• {s}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Where PolySim wins</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {c.theirWeaknesses.map((s) => <li key={s}>• {s}</li>)}
          </ul>
        </div>
      </div>

      <Prose><p className="font-medium text-slate-800 dark:text-slate-200">{c.verdict}</p></Prose>

      <PremiumCTA product={premiumUpsell(c.slug)} heading={`Switching from ${c.competitor}?`} />
      <ProductGrid products={contextualProducts(c.slug, 6)} title="Popular products" />

      <div className="mt-8">
        <Link href={`/migrate/${c.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">See the {c.competitor} → PolySim migration guide →</Link>
      </div>
    </PageShell>
  );
}
