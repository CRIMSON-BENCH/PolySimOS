import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { AUDIENCES, getAudience } from "@/lib/audiences";
import { getSimTopic, SIM_TOPICS } from "@/lib/simulate";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  const params: { audience: string; topic: string }[] = [];
  for (const a of AUDIENCES) for (const t of SIM_TOPICS) params.push({ audience: a.slug, topic: t.slug });
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ audience: string; topic: string }> }): Promise<Metadata> {
  const { audience, topic } = await params;
  const a = getAudience(audience); const t = getSimTopic(topic);
  if (!a || !t) return {};
  return {
    title: `${t.name} for ${a.name} — Simulate It in Your Browser`,
    description: `A ${a.name.toLowerCase()}' guide to ${t.name.toLowerCase()}: ${t.summary} Run it free in your browser.`,
    alternates: { canonical: `/guides/${a.slug}/${t.slug}` },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ audience: string; topic: string }> }) {
  const { audience, topic } = await params;
  const a = getAudience(audience); const t = getSimTopic(topic);
  if (!a || !t) notFound();
  const faqs = [
    { q: `How can a ${a.name.slice(0, -1).toLowerCase()} simulate ${t.name.toLowerCase()}?`, a: `Open the ${t.name} studio and it runs free in your browser — ${a.benefit}` },
  ];
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Guides", path: `/guides/${a.slug}` }, { name: a.name, path: `/guides/${a.slug}` }, { name: t.name, path: `/guides/${a.slug}/${t.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow={`For ${a.name} · ${t.domainName}`}
      title={`${t.name} for ${a.name}`}
      lede={`${t.summary}`}
    >
      {t.studio && (
        <Link href={t.studio} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-lime-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-lime-400">
          ▶ Launch the live {t.name} simulator
        </Link>
      )}
      <Prose>
        <p>Whether you&apos;re {a.frame}, PolySim OS makes {t.name.toLowerCase()} something you can run and tweak, not just read about. {a.benefit}</p>
      </Prose>
      <H2>Keep exploring</H2>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/simulate/${t.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">Full {t.name} guide →</Link>
        <Link href={`/guides/${a.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">More guides for {a.name} →</Link>
      </div>
    </PageShell>
  );
}
