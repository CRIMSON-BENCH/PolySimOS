import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getSchool, getAllSchoolSlugs } from "@/lib/schools";
import { getProduct } from "@/lib/products";
import { PremiumCTA } from "@/components/PremiumCTA";
import { faqLd } from "@/lib/seo";

export function generateStaticParams() {
  return getAllSchoolSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getSchool(slug);
  if (!s) return {};
  return {
    title: `STEM Simulations for ${s.name}`,
    description: `Free, browser-based physics, chemistry, and math simulations for ${s.name} (${s.location}). AP/IB/A-Level aligned, no install.`,
    alternates: { canonical: `/schools/${s.slug}` },
  };
}

const LABS = [
  { label: "Projectile & Mechanics", href: "/studio/particles" },
  { label: "Electrostatics", href: "/studio/electromagnetics" },
  { label: "Waves & Oscillations", href: "/studio/fields" },
  { label: "Chaos & Dynamics", href: "/studio/dynamics" },
  { label: "Symbolic Math", href: "/studio/cas" },
];

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getSchool(slug);
  if (!s) notFound();
  const kit = getProduct("educator-classroom-kit");
  const faqs = [
    { q: `Is PolySim free for ${s.name} students?`, a: `Yes — every simulation runs free in the browser, no install on school devices. Educators get classroom tools too.` },
    { q: `Is it aligned to AP / IB / A-Level?`, a: `Yes — see our curriculum pages for labs mapped to AP Physics, IB, A-Level, NGSS, and GCSE units.` },
  ];
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "High Schools", path: "/schools" }, { name: s.name, path: `/schools/${s.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow={s.location}
      title={`STEM Simulations for ${s.name}`}
      lede={`Bring physics, chemistry, and math to life for ${s.name} students — real simulations that run on any school laptop, free.`}
    >
      <H2>Classroom-ready labs</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {LABS.map((l) => <Link key={l.href} href={l.href} className="rounded-lg bg-lime-500/90 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-lime-400">▶ {l.label}</Link>)}
      </div>
      <Prose><p>No installs, no lab licenses — {s.name} students open a browser and start simulating. Every lab is shareable as a live link for homework, and aligned to the AP, IB, and A-Level curricula.</p></Prose>
      {kit && <PremiumCTA product={kit} heading={`Classroom kit for ${s.name}`} />}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/curriculum" className="text-cyan-600 hover:underline dark:text-cyan-400">Curriculum-aligned labs →</Link>
        <Link href="/schools" className="text-cyan-600 hover:underline dark:text-cyan-400">All high schools →</Link>
      </div>
    </PageShell>
  );
}
