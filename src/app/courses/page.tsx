import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { COURSES } from "@/lib/courses";

export const metadata: Metadata = {
  title: "Simulations by Course — Physics, Math & Engineering Labs",
  description: "Course-aligned simulations for common university courses: mechanics, calculus, differential equations, fluid mechanics, FEA, circuits, and more. Free, in-browser.",
  alternates: { canonical: "/courses" },
};

export default function CoursesIndex() {
  const byLevel: Record<string, typeof COURSES> = {};
  for (const c of COURSES) (byLevel[c.level] ??= []).push(c);
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Courses", path: "/courses" }]} title="Simulations by Course" lede="Find runnable, course-aligned simulations for the classes you're taking or teaching.">
      {Object.entries(byLevel).map(([level, list]) => (
        <div key={level} className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">{level}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <Link key={c.slug} href={`/courses/${c.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{c.code}</p>
                <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{c.name}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{c.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </PageShell>
  );
}
