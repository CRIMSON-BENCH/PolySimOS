import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2 } from "@/components/PageShell";
import { CATEGORIES, getCategory, parsePair, convert, allPairs } from "@/lib/units";
import { UnitConverter } from "@/components/UnitConverter";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return allPairs();
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; pair: string }> }): Promise<Metadata> {
  const { category, pair } = await params;
  const c = getCategory(category); if (!c) return {};
  const p = parsePair(c, pair); if (!p) return {};
  return {
    title: `Convert ${p.from.name} to ${p.to.name} (${p.from.symbol} → ${p.to.symbol})`,
    description: `Convert ${p.from.name} to ${p.to.name} instantly. 1 ${p.from.symbol} = ${convert(1, p.from, p.to)} ${p.to.symbol}. Free ${c.name.toLowerCase()} converter.`,
    alternates: { canonical: `/convert/${c.slug}/${pair}` },
  };
}

export default async function PairPage({ params }: { params: Promise<{ category: string; pair: string }> }) {
  const { category, pair } = await params;
  const c = getCategory(category); if (!c) notFound();
  const p = parsePair(c, pair); if (!p) notFound();
  const one = convert(1, p.from, p.to);
  const oneStr = Math.abs(one) >= 1e6 || (Math.abs(one) < 1e-4 && one !== 0) ? one.toExponential(6) : String(Math.round(one * 1e9) / 1e9);
  const rows = [1, 2, 5, 10, 25, 50, 100, 1000];
  const faqs = [{ q: `How many ${p.to.name} in a ${p.from.name}?`, a: `1 ${p.from.name} (${p.from.symbol}) = ${oneStr} ${p.to.name} (${p.to.symbol}).` }];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Converters", path: "/convert" }, { name: c.name, path: `/convert/${c.slug}` }, { name: `${p.from.symbol}→${p.to.symbol}`, path: `/convert/${c.slug}/${pair}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow={`${c.name} converter`}
      title={`Convert ${p.from.name} to ${p.to.name}`}
      lede={`1 ${p.from.name} (${p.from.symbol}) = ${oneStr} ${p.to.name} (${p.to.symbol}).`}
    >
      <div className="mt-8"><UnitConverter category={c} fromSlug={p.from.slug} toSlug={p.to.slug} /></div>
      <H2>{p.from.name} → {p.to.name} table</H2>
      <div className="mt-4 max-w-md overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((v) => (
              <tr key={v} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{v} {p.from.symbol}</td>
                <td className="px-4 py-2 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">{Math.round(convert(v, p.from, p.to) * 1e6) / 1e6} {p.to.symbol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6"><Link href={`/convert/${c.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">← All {c.name.toLowerCase()} conversions</Link></div>
    </PageShell>
  );
}
