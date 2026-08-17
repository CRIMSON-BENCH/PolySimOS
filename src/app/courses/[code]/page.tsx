import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getCourse, getAllCourseSlugs, COURSES } from "@/lib/courses";
import { getProduct } from "@/lib/products";
import { PremiumCTA } from "@/components/PremiumCTA";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return getAllCourseSlugs().map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const c = getCourse(code);
  if (!c) return {};
  return {
    title: `${c.code} ${c.name} — Simulations & Labs`,
    description: `Runnable simulations for ${c.code} ${c.name}: ${c.topics.join(", ")}. Free, browser-based, no install.`,
    alternates: { canonical: `/courses/${c.slug}` },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = getCourse(code);
  if (!c) notFound();
  const studentPlan = getProduct("student");
  const faqs = [
    { q: `Are there free simulations for ${c.code}?`, a: `Yes — every simulator linked here runs free in your browser, no install. ${c.name} covers ${c.topics.join(", ")}.` },
    { q: `Can I use these to teach ${c.name}?`, a: `Absolutely. Share any simulation as a live link or embed it in your course page; educators get classroom tools too.` },
  ];
  const related = COURSES.filter((x) => x.level === c.level && x.slug !== c.slug).slice(0, 6);

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Courses", path: "/courses" }, { name: `${c.code} ${c.name}`, path: `/courses/${c.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow={`${c.code} · ${c.level}`}
      title={`${c.name} — Simulations`}
      lede={c.blurb}
    >
      <H2>Run these for {c.code}</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {c.studios.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-lg bg-lime-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-lime-400">▶ {s.label}</Link>
        ))}
      </div>

      <H2>Topics covered</H2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {c.topics.map((t) => <li key={t} className="rounded-full bg-cyan-50 px-3 py-1 text-sm text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">{t}</li>)}
      </ul>

      <Prose><p>PolySim OS turns {c.name.toLowerCase()} from equations on a page into simulations you can run and tweak. Every tool works in the browser — ideal for problem sets, lab reports, and lecture demos.</p></Prose>

      {studentPlan && <PremiumCTA product={studentPlan} heading={`Student plan for ${c.code}`} />}

      {related.length > 0 && (
        <>
          <H2>Related courses</H2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((r) => <Link key={r.slug} href={`/courses/${r.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{r.code} {r.name}</Link>)}
          </div>
        </>
      )}
    </PageShell>
  );
}
