import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getInstitution, getAllInstitutionSlugs, DEPARTMENTS } from "@/lib/institutions";
import { getProduct } from "@/lib/products";
import { PremiumCTA } from "@/components/PremiumCTA";
import { ProductGrid } from "@/components/ProductCard";
import { contextualProducts } from "@/lib/products";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return getAllInstitutionSlugs().map((institution) => ({ institution }));
}

export async function generateMetadata({ params }: { params: Promise<{ institution: string }> }): Promise<Metadata> {
  const { institution } = await params;
  const i = getInstitution(institution);
  if (!i) return {};
  return {
    title: `Simulation Software for ${i.name} — PolySim OS`,
    description: `Free, browser-based simulation for students and researchers at ${i.name} (${i.location}). Physics, engineering, chemistry, and math — no install required.`,
    alternates: { canonical: `/education/${i.slug}` },
  };
}

export default async function InstitutionPage({ params }: { params: Promise<{ institution: string }> }) {
  const { institution } = await params;
  const i = getInstitution(institution);
  if (!i) notFound();

  const studentPlan = getProduct("student");
  const faqs = [
    { q: `Is PolySim free for ${i.name} students?`, a: `Yes — local simulation is free forever, and verified students get an enhanced plan with cloud projects and Copilot access.` },
    { q: `What can ${i.name} researchers do with PolySim?`, a: `Build reproducible, citable simulations across physics, engineering, chemistry, and math, run them in the browser, and publish interactive versions with a minted DOI.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Education", path: "/education" }, { name: i.name, path: `/education/${i.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow={`${i.kind} · ${i.location}`}
      title={`Simulation Software for ${i.name}`}
      lede={`Students, educators, and researchers at ${i.name} can run real simulations in the browser — free to start, with no lab install or license to manage.`}
    >
      <Prose>
        <p>
          Whether you are taking a first course in mechanics or running research-grade models, PolySim OS
          gives {i.name} a single browser-based workspace for physics, biology, chemistry, mathematics, and
          engineering. There is nothing to install on lab machines, and every student can work from their own
          laptop, free.
        </p>
      </Prose>

      <H2>Popular by department at {i.name}</H2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {DEPARTMENTS.map((d) => (
          <div key={d} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{d}:</span> coursework labs, problem sets, and research prototyping
          </div>
        ))}
      </div>

      {studentPlan && <PremiumCTA product={studentPlan} heading={`For ${i.name} students`} />}
      <ProductGrid products={contextualProducts(i.slug, 6)} title="Plans & tools" />

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/education" className="text-cyan-600 hover:underline dark:text-cyan-400">← All institutions</Link>
      </div>
    </PageShell>
  );
}
