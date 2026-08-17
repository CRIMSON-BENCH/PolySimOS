import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { countrySlugs, getCountryBySlug, institutionsByCountry } from "@/lib/institutions";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return countrySlugs().map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const name = getCountryBySlug(country);
  if (!name) return {};
  return {
    title: `Simulation Software for Universities in ${name}`,
    description: `Free, browser-based simulation for students and researchers across ${name}. Physics, engineering, chemistry, and math — no install, no license.`,
    alternates: { canonical: `/education/country/${country}` },
  };
}

export default async function CountryHub({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const name = getCountryBySlug(country);
  if (!name) notFound();
  const list = institutionsByCountry()[name] ?? [];
  const faqs = [
    { q: `Is PolySim free for universities in ${name}?`, a: `Yes — every simulator runs free in the browser. Verified students across ${name} get an enhanced plan with cloud projects and AI Copilot.` },
    { q: `Which ${name} institutions use browser simulation?`, a: `PolySim works for any institution in ${name}; we cover ${list.length}+ here, and any student can start free from their own laptop.` },
  ];
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Education", path: "/education" }, { name, path: `/education/country/${country}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow="Country hub"
      title={`Simulation Software for Universities in ${name}`}
      lede={`Students, educators, and researchers across ${name} can run real simulations in the browser — free to start, nothing to install on lab machines.`}
    >
      <H2>Institutions in {name}</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {list.map((i) => (
          <Link key={i.slug} href={`/education/${i.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{i.name}</Link>
        ))}
      </div>
      <Prose><p>PolySim OS gives every campus in {name} a browser-based simulation workspace across physics, biology, chemistry, mathematics, and engineering — no per-seat licenses, no lab installs, and shareable as live links for coursework and research.</p></Prose>
      <div className="mt-6"><Link href="/education" className="text-cyan-600 hover:underline dark:text-cyan-400">← All institutions worldwide</Link></div>
    </PageShell>
  );
}
