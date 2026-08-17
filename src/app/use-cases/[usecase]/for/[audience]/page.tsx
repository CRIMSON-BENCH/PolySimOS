import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FEATURED, getUseCase, siblingUseCases } from "@/lib/usecases";
import { AUDIENCES, getAudience } from "@/lib/audiences";
import { EmbeddedStudio } from "@/components/studio/EmbeddedStudio";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Disclaimer } from "@/components/Disclaimer";
import { JsonLd } from "@/components/JsonLd";
import { CrossLinks } from "@/components/CrossLinks";
import { softwareAppLd, faqLd } from "@/lib/seo";
import { UnlockSolverSlot, UnlockMultiSlot, UpgradeSlot, ExportSlot } from "@/components/monetization/Slots";

// ISR: seed a small cross of featured use cases × audiences; rest on-demand.
export const dynamicParams = true;
export const revalidate = 604800;
export function generateStaticParams() {
  const params: { usecase: string; audience: string }[] = [];
  for (const u of FEATURED.slice(0, 60)) for (const a of AUDIENCES) params.push({ usecase: u.slug, audience: a.slug });
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ usecase: string; audience: string }> }): Promise<Metadata> {
  const { usecase, audience } = await params;
  const u = getUseCase(usecase); const a = getAudience(audience);
  if (!u || !a) return {};
  return { title: `${u.title} — for ${a.name}`, description: `${u.title}, made for ${a.name.toLowerCase()} ${a.frame}. Free, interactive, runs in your browser.`, alternates: { canonical: `/use-cases/${u.slug}/for/${a.slug}` } };
}

export default async function Page({ params }: { params: Promise<{ usecase: string; audience: string }> }) {
  const { usecase, audience } = await params;
  const u = getUseCase(usecase); const a = getAudience(audience);
  if (!u || !a) notFound();

  const siblings = siblingUseCases(u).map((s) => ({ name: s.title, href: `/use-cases/${s.slug}` }));
  const faqs = [
    { q: `Is this good for ${a.name.toLowerCase()}?`, a: `Yes — this version of "${u.title}" is framed for ${a.name.toLowerCase()} ${a.frame}. ${a.benefit}` },
    { q: `Do I need to install anything?`, a: `No. It runs in any modern browser, free, with no account required.` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={[softwareAppLd({ name: `${u.title} — for ${a.name}`, description: `Interactive simulator for ${u.app}, for ${a.name}`, path: `/use-cases/${u.slug}/for/${a.slug}` }), faqLd(faqs)]} />
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Use Cases", path: "/use-cases" }, { name: u.title, path: `/use-cases/${u.slug}` }, { name: `for ${a.name}`, path: `/use-cases/${u.slug}/for/${a.slug}` }]} />
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">For {a.name} · {u.toolName}</div>
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{u.title}</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-600 dark:text-slate-400">
        Built for {a.name.toLowerCase()} {a.frame}. {a.benefit} Simulate {u.app} live below — adjust the inputs and watch it respond, right in your browser.
      </p>

      <div className="mt-8"><EmbeddedStudio slug={u.toolSlug} kind={u.kind} /></div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {u.kind === "multi" ? <UnlockMultiSlot slug={u.toolSlug} name={u.toolName} /> : <UnlockSolverSlot slug={u.toolSlug} name={u.toolName} />}
        <UpgradeSlot next={`/use-cases/${u.slug}/for/${a.slug}`} />
        <ExportSlot next={`/use-cases/${u.slug}/for/${a.slug}`} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2 text-sm">
        <span className="text-slate-500">Also for:</span>
        {AUDIENCES.filter((x) => x.slug !== a.slug).map((x) => (
          <Link key={x.slug} href={`/use-cases/${u.slug}/for/${x.slug}`} className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-cyan-300">{x.name}</Link>
        ))}
        <Link href={`/use-cases/${u.slug}`} className="rounded-full px-3 py-1 font-medium text-cyan-700 hover:underline dark:text-cyan-300">General version →</Link>
      </div>

      {siblings.length > 0 && <CrossLinks title={`More with ${u.toolName}`} links={siblings} />}

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Frequently asked questions</h2>
        <dl className="mt-4 space-y-4">{faqs.map((f) => (<div key={f.q}><dt className="font-semibold text-slate-800 dark:text-slate-200">{f.q}</dt><dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.a}</dd></div>))}</dl>
      </section>
      <Disclaimer />
    </div>
  );
}
