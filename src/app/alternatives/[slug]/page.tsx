import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getComparison, getAllComparisonSlugs } from "@/lib/comparisons";
import { PremiumCTA } from "@/components/PremiumCTA";
import { premiumUpsell } from "@/lib/products";
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
    title: `The Best ${c.competitor} Alternative — PolySim OS`,
    description: `A browser-based, affordable alternative to ${c.competitor}. ${c.tagline} See features, pricing, and how to switch.`,
    alternates: { canonical: `/alternatives/${c.slug}` },
  };
}

export default async function AlternativePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();
  const faqs = [
    { q: `Is there a free alternative to ${c.competitor}?`, a: `Yes — PolySim OS runs free in your browser for local simulation. ${c.competitor} pricing: ${c.theirPricing}` },
    { q: `Why switch from ${c.competitor} to PolySim OS?`, a: c.verdict },
  ];
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Alternatives", path: "/alternatives" }, { name: c.competitor, path: `/alternatives/${c.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow="Alternative"
      title={`The Best ${c.competitor} Alternative`}
      lede={`${c.intro}`}
    >
      <H2>Why teams switch from {c.competitor}</H2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {c.theirWeaknesses.map((w) => <li key={w} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{w}</li>)}
      </ul>
      <H2>What you get with PolySim OS</H2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-900"><th className="px-4 py-2.5 font-semibold">Feature</th><th className="px-4 py-2.5 font-semibold text-cyan-700 dark:text-cyan-400">PolySim OS</th><th className="px-4 py-2.5 font-semibold text-slate-500">{c.competitor}</th></tr></thead>
          <tbody>
            {c.rows.map((r) => <tr key={r.feature} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{r.feature}</td><td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{r.polysim}</td><td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{r.them}</td></tr>)}
          </tbody>
        </table>
      </div>
      <H2>See PolySim in action</H2>
      <div className="mt-5"><ClipShowcase slugs={["fluid", "double-pendulum", "attractors", "dynamics", "bode-plot", "bloch-sphere"]} max={6} /></div>

      <Prose><p className="font-medium text-slate-800 dark:text-slate-200">{c.verdict}</p></Prose>
      <PremiumCTA product={premiumUpsell(c.slug)} heading={`Ready to leave ${c.competitor}?`} />
      <div className="mt-6 flex flex-wrap gap-4">
        <Link href={`/compare/${c.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">Full comparison →</Link>
        <Link href={`/migrate/${c.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">Migration guide →</Link>
      </div>
    </PageShell>
  );
}
