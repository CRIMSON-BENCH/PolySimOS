import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getModel, getAllModelSlugs } from "@/lib/models";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { faqLd } from "@/lib/seo";
import { StudioPromo } from "@/components/StudioPromo";

export function generateStaticParams() {
  return getAllModelSlugs().map((model) => ({ model }));
}

export async function generateMetadata({ params }: { params: Promise<{ model: string }> }): Promise<Metadata> {
  const { model } = await params;
  const m = getModel(model);
  if (!m) return {};
  return {
    title: `${m.name} — Formula, Meaning & Live Simulation`,
    description: `${m.summary} ${m.detail.slice(0, 100)}`,
    alternates: { canonical: `/models/${m.slug}` },
  };
}

export default async function ModelPage({ params }: { params: Promise<{ model: string }> }) {
  const { model } = await params;
  const m = getModel(model);
  if (!m) notFound();

  const faqs = [
    { q: `What is the ${m.name}?`, a: m.detail },
    { q: `Can I simulate the ${m.name}?`, a: m.studio ? `Yes — launch the live ${m.name} simulator to run it interactively in your browser.` : `You can model the ${m.name} in PolySim's node graph and run it locally for free.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Models", path: "/models" }, { name: m.name, path: `/models/${m.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow={m.field}
      title={m.name}
      lede={m.summary}
    >
      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-6 dark:border-slate-800">
        <p className="text-center font-mono text-lg text-lime-400">{m.formula}</p>
      </div>

      {m.studio && (
        <Link href={m.studio} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-lime-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-lime-400">
          ▶ Run the {m.name} live
        </Link>
      )}

      <H2>What it means</H2>
      <Prose><p>{m.detail}</p></Prose>

      <H2>Variables</H2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <tbody>
            {m.variables.map((v) => (
              <tr key={v.sym} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-2.5 font-mono font-semibold text-cyan-700 dark:text-cyan-400">{v.sym}</td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{v.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PremiumCTA product={premiumUpsell(m.slug)} />
      <ProductGrid products={contextualProducts(m.slug, 6)} title="Related products" />
      <StudioPromo links={m.studio ? [{ name: `Run the ${m.name}`, href: m.studio }] : undefined} />
    </PageShell>
  );
}
