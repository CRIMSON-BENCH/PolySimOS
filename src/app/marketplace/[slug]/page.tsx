import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2 } from "@/components/PageShell";
import { getListing, getAllListingSlugs, LISTINGS } from "@/lib/marketplace";
import { BuyButton } from "@/components/BuyButton";
import { productLd } from "@/lib/seo";

export function generateStaticParams() { return getAllListingSlugs().map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const l = getListing(slug);
  if (!l) return {};
  return { title: `${l.title} — ${l.kind}`, description: l.blurb, alternates: { canonical: `/marketplace/${l.slug}` } };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getListing(slug);
  if (!l) notFound();
  const related = LISTINGS.filter((x) => x.kind === l.kind && x.slug !== l.slug).slice(0, 3);

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Marketplace", path: "/marketplace" }, { name: l.title, path: `/marketplace/${l.slug}` }]}
      jsonLd={l.price > 0 ? productLd({ name: l.title, description: l.blurb, price: l.price, path: `/marketplace/${l.slug}` }) : undefined}
      eyebrow={`${l.kind} · @${l.author}`}
      title={l.title}
      lede={l.blurb}
    >
      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span>{l.downloads.toLocaleString()} uses</span><span className="font-bold text-cyan-700 dark:text-cyan-300">{l.price === 0 ? "Free to fork" : `$${l.price}`}</span>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {l.studio && <Link href={l.studio} className="rounded-lg bg-lime-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-lime-400">▶ Open &amp; fork</Link>}
        {l.price > 0 ? <div className="w-56"><BuyButton slug="community-model-marketplace" label="Buy" price={`$${l.price}`} /></div> : <Link href="/signup" className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Save to library</Link>}
      </div>

      <H2>About this {l.kind.toLowerCase()}</H2>
      <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-400">{l.blurb} Published by @{l.author}. Fork it to make your own version, or use it as-is — everything runs in your browser.</p>

      {related.length > 0 && (
        <>
          <H2>More {l.kind.toLowerCase()}s</H2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.slug} href={`/marketplace/${r.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{r.title}</Link>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
