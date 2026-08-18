import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { USECASES, getUseCase, siblingUseCases, relatedByApp } from "@/lib/usecases";
import { AUDIENCES } from "@/lib/audiences";
import { EmbeddedStudio } from "@/components/studio/EmbeddedStudio";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Disclaimer } from "@/components/Disclaimer";
import { JsonLd } from "@/components/JsonLd";
import { CrossLinks } from "@/components/CrossLinks";
import { softwareAppLd, faqLd } from "@/lib/seo";
import { MonetizationBar } from "@/components/monetization/Slots";

// ISR: pre-build a seed at build time; the rest render on first visit + cache.
export const dynamicParams = true;
export const revalidate = 604800; // 7 days
export function generateStaticParams() {
  return USECASES.slice(0, 600).map((u) => ({ usecase: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ usecase: string }> }): Promise<Metadata> {
  const { usecase } = await params;
  const u = getUseCase(usecase);
  if (!u) return {};
  const title = `${u.title} — Free Interactive Simulator`;
  return { title, description: `${u.title}: run it live in your browser with real numerics — no install. Adjust inputs, see results instantly, export your work.`, alternates: { canonical: `/use-cases/${u.slug}` } };
}

export default async function Page({ params }: { params: Promise<{ usecase: string }> }) {
  const { usecase } = await params;
  const u = getUseCase(usecase);
  if (!u) notFound();

  const siblings = siblingUseCases(u).map((s) => ({ name: s.title, href: `/use-cases/${s.slug}` }));
  const related = relatedByApp(u).map((s) => ({ name: s.title, href: `/use-cases/${s.slug}` }));
  const faqs = [
    { q: `How do I simulate ${u.app}?`, a: `Open this page and use the live ${u.toolName} tool below — set your inputs and the simulation runs instantly in your browser using real numerics. No install, no account needed.` },
    { q: `Is it free?`, a: `Yes. The simulation runs free in your browser. A one-time unlock or a Pro plan adds advanced parameters, saved presets, data import, and clean exports.` },
    { q: `Can I use my own numbers?`, a: `Absolutely — every input is adjustable, and with data import you can drive ${u.app} from your own measurements.` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={[softwareAppLd({ name: u.title, description: `Interactive simulator for ${u.app}`, path: `/use-cases/${u.slug}` }), faqLd(faqs)]} />
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Use Cases", path: "/use-cases" }, { name: u.title, path: `/use-cases/${u.slug}` }]} />
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">Use case · powered by {u.toolName}</div>
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{u.title}</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-600 dark:text-slate-400">
        Simulate {u.app} live in your browser. This runs the real {u.toolName} solver — adjust the inputs, watch it respond instantly, and export the result. No install, no account.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="text-slate-500">For:</span>
        {AUDIENCES.map((a) => (
          <Link key={a.slug} href={`/use-cases/${u.slug}/for/${a.slug}`} className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-cyan-300">{a.name}</Link>
        ))}
      </div>

      <div className="mt-8"><EmbeddedStudio slug={u.toolSlug} kind={u.kind} /></div>

      <MonetizationBar kind={u.kind} slug={u.toolSlug} name={u.toolName} next={`/use-cases/${u.slug}`} />

      <section className="mt-10 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">About this simulation</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          The full <Link href={`/studio/${u.toolSlug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">{u.toolName}</Link> tool models {u.app} with the same numerics engineers and scientists use — running entirely client-side. Change any parameter and the result updates in real time, so you can build intuition, check a design, or teach the concept without spreadsheets or installs.
        </p>
      </section>

      {siblings.length > 0 && <CrossLinks title={`More you can do with ${u.toolName}`} links={siblings} />}
      {related.length > 0 && <CrossLinks title={`Other ways to simulate ${u.app}`} links={related} />}

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Frequently asked questions</h2>
        <dl className="mt-4 space-y-4">{faqs.map((f) => (<div key={f.q}><dt className="font-semibold text-slate-800 dark:text-slate-200">{f.q}</dt><dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.a}</dd></div>))}</dl>
      </section>
      <Disclaimer />
    </div>
  );
}
