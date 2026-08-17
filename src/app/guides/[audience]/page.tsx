import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { AUDIENCES, getAudience } from "@/lib/audiences";
import { SIM_TOPICS } from "@/lib/simulate";

export function generateStaticParams() {
  return AUDIENCES.map((a) => ({ audience: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ audience: string }> }): Promise<Metadata> {
  const { audience } = await params;
  const a = getAudience(audience);
  if (!a) return {};
  return {
    title: `Simulation Guides for ${a.name}`,
    description: `Browser-based simulation guides for ${a.name.toLowerCase()}: ${a.benefit}`,
    alternates: { canonical: `/guides/${a.slug}` },
  };
}

export default async function AudienceHub({ params }: { params: Promise<{ audience: string }> }) {
  const { audience } = await params;
  const a = getAudience(audience);
  if (!a) notFound();
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Guides", path: `/guides/${a.slug}` }, { name: a.name, path: `/guides/${a.slug}` }]} title={`Simulation Guides for ${a.name}`} lede={a.benefit}>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SIM_TOPICS.map((t) => (
          <Link key={t.slug} href={`/guides/${a.slug}/${t.slug}`} className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <h2 className="font-semibold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{t.name}</h2>
            <p className="mt-1 text-xs text-slate-400">{t.domainName}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {AUDIENCES.filter((x) => x.slug !== a.slug).map((x) => <Link key={x.slug} href={`/guides/${x.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">For {x.name}</Link>)}
      </div>
    </PageShell>
  );
}
