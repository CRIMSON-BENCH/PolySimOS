import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2 } from "@/components/PageShell";
import { CATEGORIES, getCategory } from "@/lib/units";
import { UnitConverter } from "@/components/UnitConverter";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return {};
  return {
    title: `${c.name} Converter — ${c.units.map((u) => u.symbol).slice(0, 6).join(", ")}`,
    description: `Convert between ${c.name.toLowerCase()} units: ${c.units.map((u) => u.name).join(", ")}. Fast, accurate, and free.`,
    alternates: { canonical: `/convert/${c.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();
  const pairs = c.units.flatMap((a) => c.units.filter((b) => b.slug !== a.slug).map((b) => ({ a, b })));
  const faqs = [{ q: `How do I convert ${c.name.toLowerCase()} units?`, a: `Enter a value and pick the units above — PolySim converts instantly between ${c.units.map((u) => u.name).join(", ")}.` }];
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Converters", path: "/convert" }, { name: c.name, path: `/convert/${c.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow="Converter"
      title={`${c.name} Converter`}
      lede={`Convert between any ${c.name.toLowerCase()} units instantly. Base unit: ${c.base}.`}
    >
      <div className="mt-8"><UnitConverter category={c} /></div>
      <H2>Common {c.name.toLowerCase()} conversions</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {pairs.slice(0, 40).map(({ a, b }) => (
          <Link key={`${a.slug}-${b.slug}`} href={`/convert/${c.slug}/${a.slug}-to-${b.slug}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {a.symbol} → {b.symbol}
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
