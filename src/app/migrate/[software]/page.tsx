import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2 } from "@/components/PageShell";
import { MIGRATION_SLUGS, getMigration } from "@/lib/migrations";
import { getProduct } from "@/lib/products";
import { PremiumCTA } from "@/components/PremiumCTA";
import { ProductGrid } from "@/components/ProductCard";
import { contextualProducts } from "@/lib/products";
import { howToLd, faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return MIGRATION_SLUGS.map((software) => ({ software }));
}

export async function generateMetadata({ params }: { params: Promise<{ software: string }> }): Promise<Metadata> {
  const { software } = await params;
  const m = getMigration(software);
  if (!m) return {};
  return {
    title: `Migrate from ${m.from} to PolySim OS — Step-by-Step Guide`,
    description: `How to move your simulations from ${m.from} to PolySim OS in five steps, and why teams are switching.`,
    alternates: { canonical: `/migrate/${software}` },
  };
}

export default async function MigratePage({ params }: { params: Promise<{ software: string }> }) {
  const { software } = await params;
  const m = getMigration(software);
  if (!m) notFound();

  const migrationService = getProduct("migration-service");
  const faqs = [
    { q: `Is migrating from ${m.from} hard?`, a: `No — most models map cleanly, and PolySim's AI Copilot can rebuild much of the setup from a description. Our Migration Service can also do it for you.` },
    { q: `Will my results match ${m.from}?`, a: `PolySim uses established numerical methods; validate against a known ${m.from} benchmark to confirm equivalence before relying on results.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Migrate", path: "/migrate" }, { name: m.from, path: `/migrate/${software}` }]}
      jsonLd={[howToLd({ name: `Migrate from ${m.from} to PolySim OS`, description: `Move simulations from ${m.from} to PolySim OS.`, steps: m.steps }), faqLd(faqs)]}
      eyebrow="Migration guide"
      title={`Migrate from ${m.from} to PolySim OS`}
      lede={`A clean, five-step path to move your ${m.from} work to the browser — and stop paying for a desktop license.`}
    >
      <H2>Why teams leave {m.from}</H2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {m.reasons.map((r) => (
          <li key={r} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{r}</li>
        ))}
      </ul>

      <H2>Migration in five steps</H2>
      <ol className="mt-6 space-y-4">
        {m.steps.map((s, i) => (
          <li key={s.name} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">{i + 1}</span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {migrationService && <PremiumCTA product={migrationService} heading="Let us migrate it for you" />}
      <ProductGrid products={contextualProducts(`migrate-${software}`, 6)} title="Helpful products" />

      <div className="mt-8">
        <Link href={`/compare/${software}`} className="text-cyan-600 hover:underline dark:text-cyan-400">← Compare PolySim OS vs {m.from}</Link>
      </div>
    </PageShell>
  );
}
