import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { getInstitution, getDepartmentBySlug, institutionDepartmentPairs, DEPARTMENTS } from "@/lib/institutions";
import { getProduct } from "@/lib/products";
import { PremiumCTA } from "@/components/PremiumCTA";
import { faqLd } from "@/lib/seo";
import { slugify } from "@/lib/seo";

export function generateStaticParams() {
  return institutionDepartmentPairs();
}

// Which studios/topics matter for each department.
const FOCUS: Record<string, { label: string; href: string }[]> = {
  "Mechanical Engineering": [
    { label: "FEA Truss", href: "/studio/fea" }, { label: "3D FEA Space Frame", href: "/studio/fea-3d" }, { label: "3D CFD", href: "/studio/cfd-3d" }, { label: "Dynamical Systems", href: "/studio/dynamics" }, { label: "Meshing + BCs", href: "/studio/mesh" },
  ],
  "Aerospace Engineering": [
    { label: "2D Fluid (CFD)", href: "/studio/fluid" }, { label: "3D CFD", href: "/studio/cfd-3d" }, { label: "3D N-Body / Orbits", href: "/studio/3d" }, { label: "3D FEA", href: "/studio/fea-3d" },
  ],
  "Electrical Engineering": [
    { label: "Electrostatics", href: "/studio/electromagnetics" }, { label: "Dynamical Systems", href: "/studio/dynamics" }, { label: "Symbolic Math", href: "/studio/cas" }, { label: "Vector Fields", href: "/studio/vector-field" },
  ],
  "Chemical Engineering": [
    { label: "2D Fluid (CFD)", href: "/studio/fluid" }, { label: "Reaction–Diffusion", href: "/studio/dynamics" }, { label: "Molecular Dynamics", href: "/studio/molecular-dynamics" }, { label: "Meshing + BCs", href: "/studio/mesh" },
  ],
  "Civil Engineering": [
    { label: "FEA Truss", href: "/studio/fea" }, { label: "3D FEA Space Frame", href: "/studio/fea-3d" }, { label: "Meshing + BCs", href: "/studio/mesh" },
  ],
  "Physics": [
    { label: "Particle / N-Body", href: "/studio/particles" }, { label: "3D N-Body", href: "/studio/3d" }, { label: "Particle-Mesh N-Body", href: "/studio/gpu-nbody-pm" }, { label: "Heat & Wave", href: "/studio/fields" }, { label: "Electrostatics", href: "/studio/electromagnetics" },
  ],
  "Applied Mathematics": [
    { label: "Symbolic Math (CAS)", href: "/studio/cas" }, { label: "Dynamical Systems", href: "/studio/dynamics" }, { label: "Notebook", href: "/studio/notebook" }, { label: "Vector Fields", href: "/studio/vector-field" }, { label: "Optimization + UQ", href: "/studio/optimize" },
  ],
  "Materials Science": [
    { label: "Molecular Dynamics", href: "/studio/molecular-dynamics" }, { label: "FEA Truss", href: "/studio/fea" }, { label: "Materials Database", href: "/materials" },
  ],
  "Biomedical Engineering": [
    { label: "2D Fluid (CFD)", href: "/studio/fluid" }, { label: "Dynamical Systems", href: "/studio/dynamics" }, { label: "Molecular Dynamics", href: "/studio/molecular-dynamics" },
  ],
  "Computer Science": [
    { label: "GPU Compute (WebGPU)", href: "/studio/gpu" }, { label: "Node Graph", href: "/studio/graph" }, { label: "AI Surrogate", href: "/studio/surrogate" }, { label: "Notebook", href: "/studio/notebook" },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ institution: string; department: string }> }): Promise<Metadata> {
  const { institution, department } = await params;
  const i = getInstitution(institution); const d = getDepartmentBySlug(department);
  if (!i || !d) return {};
  return {
    title: `Simulation Software for ${d} at ${i.name}`,
    description: `Free, browser-based simulation for ${d} students and researchers at ${i.name}. Runnable ${d.toLowerCase()} labs — no install, no license.`,
    alternates: { canonical: `/education/${i.slug}/${department}` },
  };
}

export default async function InstitutionDepartmentPage({ params }: { params: Promise<{ institution: string; department: string }> }) {
  const { institution, department } = await params;
  const i = getInstitution(institution); const d = getDepartmentBySlug(department);
  if (!i || !d) notFound();
  const focus = FOCUS[d] ?? [];
  const studentPlan = getProduct("student");

  const faqs = [
    { q: `Is PolySim free for ${d} students at ${i.name}?`, a: `Yes — every simulator runs free in the browser. Verified students get an enhanced plan with cloud projects and AI Copilot access.` },
    { q: `What can ${d} students simulate?`, a: `Common ${d.toLowerCase()} workflows include ${focus.slice(0, 3).map((f) => f.label).join(", ")} — all runnable directly in the browser.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Education", path: "/education" }, { name: i.name, path: `/education/${i.slug}` }, { name: d, path: `/education/${i.slug}/${department}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow={`${i.kind} · ${i.location}`}
      title={`Simulation for ${d} at ${i.name}`}
      lede={`${d} students and researchers at ${i.name} can run real, course-aligned simulations in the browser — free to start, nothing to install on lab machines.`}
    >
      <H2>{d} simulators to start with</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {focus.map((f) => (
          <Link key={f.href} href={f.href} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {f.label}
          </Link>
        ))}
      </div>

      <Prose>
        <p>Whether it&apos;s a first {d.toLowerCase()} course or graduate research, PolySim OS gives {i.name} a browser-based workspace with no lab installs and no per-seat license. Every student works from their own laptop, and coursework can be shared as a live, interactive link.</p>
      </Prose>

      {studentPlan && <PremiumCTA product={studentPlan} heading={`For ${i.name} ${d.toLowerCase()} students`} />}

      <H2>Other departments at {i.name}</H2>
      <div className="mt-4 flex flex-wrap gap-2">
        {DEPARTMENTS.filter((x) => x !== d).map((x) => (
          <Link key={x} href={`/education/${i.slug}/${slugify(x)}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {x}
          </Link>
        ))}
      </div>
      <div className="mt-6"><Link href={`/education/${i.slug}`} className="text-cyan-600 hover:underline dark:text-cyan-400">← All of {i.name}</Link></div>
    </PageShell>
  );
}
