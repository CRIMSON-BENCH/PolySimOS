import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2 } from "@/components/PageShell";
import { CONSTANTS, getConstant } from "@/lib/units";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return CONSTANTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getConstant(slug);
  if (!c) return {};
  return {
    title: `${c.name} (${c.symbol}) — Value & Meaning`,
    description: `${c.name}: ${c.symbol} = ${c.value} ${c.unit}. ${c.blurb}`,
    alternates: { canonical: `/constants/${c.slug}` },
  };
}

export default async function ConstantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getConstant(slug);
  if (!c) notFound();
  const faqs = [{ q: `What is the value of the ${c.name.toLowerCase()}?`, a: `${c.name} (${c.symbol}) ≈ ${c.value} ${c.unit}. ${c.blurb}` }];
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Constants", path: "/constants" }, { name: c.name, path: `/constants/${c.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow="Physical constant"
      title={c.name}
      lede={c.blurb}
    >
      <div className="mt-8 rounded-2xl border border-cyan-200 bg-cyan-50 p-6 text-center dark:border-cyan-900 dark:bg-cyan-950/40">
        <p className="font-mono text-2xl font-black text-cyan-700 dark:text-cyan-300">{c.symbol} = {c.value} {c.unit}</p>
      </div>
      <H2>Other constants</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {CONSTANTS.filter((x) => x.slug !== c.slug).slice(0, 12).map((x) => (
          <Link key={x.slug} href={`/constants/${x.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{x.name}</Link>
        ))}
      </div>
    </PageShell>
  );
}
