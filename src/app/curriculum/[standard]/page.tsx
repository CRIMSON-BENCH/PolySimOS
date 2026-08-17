import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getStandard, getAllStandardSlugs, STANDARDS } from "@/lib/curriculum";
import { getProduct } from "@/lib/products";
import { PremiumCTA } from "@/components/PremiumCTA";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return getAllStandardSlugs().map((standard) => ({ standard }));
}

export async function generateMetadata({ params }: { params: Promise<{ standard: string }> }): Promise<Metadata> {
  const { standard } = await params;
  const s = getStandard(standard);
  if (!s) return {};
  return {
    title: `${s.name} Simulations — Labs for Every Unit`,
    description: `Free, curriculum-aligned simulations for ${s.name} (${s.region}): ${s.units.join(", ")}.`,
    alternates: { canonical: `/curriculum/${s.slug}` },
  };
}

export default async function StandardPage({ params }: { params: Promise<{ standard: string }> }) {
  const { standard } = await params;
  const s = getStandard(standard);
  if (!s) notFound();
  const kit = getProduct("educator-classroom-kit");
  const faqs = [
    { q: `Are these simulations aligned to ${s.name}?`, a: `Yes — they map to ${s.name} units including ${s.units.join(", ")}, and each runs free in the browser.` },
    { q: `Can I use these in my classroom?`, a: `Yes. Share any simulation as a live link or embed it, and use the educator classroom kit for rosters and assignments.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Curriculum", path: "/curriculum" }, { name: s.name, path: `/curriculum/${s.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow={s.region}
      title={`${s.name} — Simulations`}
      lede={s.blurb}
    >
      <H2>Runnable labs for {s.name}</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {s.studios.map((st) => (
          <Link key={st.href} href={st.href} className="rounded-lg bg-lime-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-lime-400">▶ {st.label}</Link>
        ))}
      </div>

      <H2>Units covered</H2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {s.units.map((u) => <li key={u} className="rounded-full bg-cyan-50 px-3 py-1 text-sm text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">{u}</li>)}
      </ul>

      <Prose><p>PolySim OS gives {s.name} teachers and students browser-based simulations for every major unit — no installs, no lab licenses, and shareable as live links for homework or lecture demos.</p></Prose>

      {kit && <PremiumCTA product={kit} heading={`Classroom kit for ${s.name}`} />}

      <H2>Other curricula</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {STANDARDS.filter((x) => x.slug !== s.slug).map((x) => <Link key={x.slug} href={`/curriculum/${x.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{x.name}</Link>)}
      </div>
    </PageShell>
  );
}
