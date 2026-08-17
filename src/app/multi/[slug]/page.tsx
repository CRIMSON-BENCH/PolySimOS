import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MULTIS, multiBySlug } from "@/lib/multi";
import { MultiStudioSteps } from "@/components/studio/MultiStudioSteps";
import { UnlockMultiSlot, UpgradeSlot, ExportSlot, CloudRunSlot, CustomBuildSlot } from "@/components/monetization/Slots";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Disclaimer } from "@/components/Disclaimer";
import { JsonLd } from "@/components/JsonLd";
import { CrossLinks } from "@/components/CrossLinks";
import { softwareAppLd, faqLd } from "@/lib/seo";

export function generateStaticParams() { return MULTIS.map((m) => ({ slug: m.s })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const m = multiBySlug(slug); if (!m) return {};
  return { title: `${m.n} — Multi-Solver Workflow`, description: `${m.n}: ${m.t}. A guided workflow chaining ${m.steps.length} PolySim solvers end-to-end. Free, interactive.`, alternates: { canonical: `/multi/${m.s}` } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const m = multiBySlug(slug); if (!m) notFound();
  const related = MULTIS.filter((x) => x.p === m.p && x.s !== m.s).slice(0, 8).map((x) => ({ name: x.n, href: `/multi/${x.s}` }));
  const faqs = [
    { q: `What is the ${m.n} multi-solver?`, a: `${m.n} is a guided workflow that chains ${m.steps.length} individual PolySim solvers into one end-to-end analysis, piping each result into the next step.` },
    { q: `Is it free to use?`, a: `Yes. Every step runs entirely in your browser using real numerics — no install, no account, no cloud cost. Custom or private solver packs are available as a paid service.` },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={[softwareAppLd({ name: m.n, description: m.t, path: `/multi/${m.s}` }), faqLd(faqs)]} />
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Multi-Solvers", path: "/multi" }, { name: m.n, path: `/multi/${m.s}` }]} />
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{m.p} Pack · Multi-Solver</div>
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{m.n}</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-600 dark:text-slate-400">{m.t}. This multi-solver chains {m.steps.length} solvers into a single guided workflow — run each step in order and carry the result forward.</p>

      <section className="mt-6 max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Workflow steps</div>
        <ol className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-400">
          {m.steps.map((s, i) => (<li key={s} className="flex items-center gap-2">{i > 0 && <span className="text-slate-400">→</span>}<Link href={`/studio/${s}`} className="rounded-md bg-white px-2 py-1 font-medium text-cyan-700 shadow-sm hover:underline dark:bg-slate-800 dark:text-cyan-300">{s}</Link></li>))}
        </ol>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UnlockMultiSlot slug={m.s} name={m.n} />
        <UpgradeSlot next={`/multi/${m.s}`} />
        <ExportSlot next={`/multi/${m.s}`} />
        <CloudRunSlot next={`/multi/${m.s}`} />
      </div>

      <div className="mt-10"><MultiStudioSteps steps={m.steps} /></div>

      <div className="mt-14 max-w-3xl"><CustomBuildSlot /></div>

      <CrossLinks title={`More in the ${m.p} pack`} links={related} />

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Frequently asked questions</h2>
        <dl className="mt-4 space-y-4">{faqs.map((f) => (<div key={f.q}><dt className="font-semibold text-slate-800 dark:text-slate-200">{f.q}</dt><dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.a}</dd></div>))}</dl>
      </section>
      <Disclaimer />
    </div>
  );
}
