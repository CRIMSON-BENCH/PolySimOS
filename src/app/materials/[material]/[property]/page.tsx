import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2 } from "@/components/PageShell";
import { getMaterial, getProperty, materialPropertyPairs, formatProp, rankByProperty } from "@/lib/materials";
import { ProductGrid } from "@/components/ProductCard";
import { contextualProducts } from "@/lib/products";
import { ACCURACY_NOTE } from "@/lib/disclaimer";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return materialPropertyPairs();
}

export async function generateMetadata({ params }: { params: Promise<{ material: string; property: string }> }): Promise<Metadata> {
  const { material, property } = await params;
  const m = getMaterial(material); const p = getProperty(property);
  if (!m || !p) return {};
  return {
    title: `${p.label} of ${m.name} — ${formatProp(m, p)}`,
    description: `The ${p.label.toLowerCase()} of ${m.name} is approximately ${formatProp(m, p)}. ${p.blurb}`,
    alternates: { canonical: `/materials/${m.slug}/${p.slug}` },
  };
}

export default async function MaterialPropertyPage({ params }: { params: Promise<{ material: string; property: string }> }) {
  const { material, property } = await params;
  const m = getMaterial(material); const p = getProperty(property);
  if (!m || !p) notFound();

  const ranked = rankByProperty(p);
  const rank = ranked.findIndex((x) => x.slug === m.slug) + 1;
  const neighbors = ranked.slice(Math.max(0, rank - 4), rank + 3);

  const faqs = [
    { q: `What is the ${p.label.toLowerCase()} of ${m.name}?`, a: `The ${p.label.toLowerCase()} of ${m.name} is approximately ${formatProp(m, p)}. ${p.blurb}` },
  ];

  return (
    <PageShell
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Materials", path: "/materials" },
        { name: m.name, path: `/materials/${m.slug}` },
        { name: p.label, path: `/materials/${m.slug}/${p.slug}` },
      ]}
      jsonLd={faqLd(faqs)}
      eyebrow={`${m.category} · ${p.label}`}
      title={`${p.label} of ${m.name}`}
      lede={`The ${p.label.toLowerCase()} of ${m.name} is approximately ${formatProp(m, p)}. ${p.blurb}`}
      disclaimerNote={ACCURACY_NOTE}
    >
      <div className="mt-8 rounded-2xl border border-cyan-200 bg-cyan-50 p-6 text-center dark:border-cyan-900 dark:bg-cyan-950/40">
        <p className="text-sm text-slate-600 dark:text-slate-400">{p.label} of {m.name}</p>
        <p className="mt-1 text-4xl font-black text-cyan-700 dark:text-cyan-300">{formatProp(m, p)}</p>
        <p className="mt-2 text-xs text-slate-500">Ranked #{rank} of {ranked.length} materials by {p.label.toLowerCase()}</p>
      </div>

      <H2>Compared to nearby materials</H2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <tbody>
            {neighbors.map((x) => (
              <tr key={x.slug} className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${x.slug === m.slug ? "bg-cyan-50 dark:bg-cyan-950/30" : ""}`}>
                <td className="px-4 py-2.5">
                  <Link href={`/materials/${x.slug}/${p.slug}`} className="text-slate-700 hover:text-cyan-600 dark:text-slate-300">{x.name}</Link>
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">{formatProp(x, p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <Link href={`/materials/${m.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">← All properties of {m.name}</Link>
      </div>

      <ProductGrid products={contextualProducts(`${m.slug}-${p.slug}`, 6)} title="Related products" />
    </PageShell>
  );
}
