import type { Metadata } from "next";
import Link from "next/link";
import { DOMAIN_LIST, domainUseCases, domainCount, USECASE_COUNT } from "@/lib/usecases";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const DOMAIN_LABEL: Record<string, string> = {
  physics: "Physics & Mechanics", math: "Mathematics", structural: "Structural & Civil", aerospace: "Aerospace & Flight",
  complex: "Complex Systems", weather: "Weather & Climate", statistics: "Statistics & Data", sports: "Sports Analytics",
  robotics: "Robotics & Control", quantum: "Quantum & Modern Physics", optics: "Optics & Photonics", optimization: "Optimization & OR",
  nuclear: "Nuclear & Radiation", materials: "Materials", manufacturing: "Manufacturing", graphs: "Networks & Graphs",
  geospatial: "Geospatial & Navigation", responders: "First Responders", finance: "Finance & Quant", energy: "Energy & Power",
  electrical: "Electronics & Signals", economics: "Economics & Markets", earth: "Earth & Climate", crypto: "Cryptography",
  chemistry: "Chemistry", cs: "Computer Science & AI", biology: "Biology & Medicine", astronomy: "Astronomy & Space", acoustics: "Acoustics & Sound",
};

export const metadata: Metadata = {
  title: "Simulation Use Cases — Thousands of Real Problems, Solved Live",
  description: `Browse ${USECASE_COUNT.toLocaleString()}+ real-world simulation use cases — from bridge beams to epidemic spread to option pricing — each running live in your browser, free.`,
  alternates: { canonical: "/use-cases" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Use Cases", path: "/use-cases" }]} />
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">Simulation Use Cases</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-600 dark:text-slate-400">
        {USECASE_COUNT.toLocaleString()}+ real problems, each mapped to a live solver you can run right now — no install, no account. Pick a field to explore.
      </p>
      {DOMAIN_LIST.map((d) => {
        const items = domainUseCases(d, 12);
        if (!items.length) return null;
        return (
          <section key={d} className="mt-10">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-cyan-700 dark:text-cyan-400">{DOMAIN_LABEL[d] ?? d}</h2>
              <span className="text-sm text-slate-400">{domainCount(d).toLocaleString()} use cases</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((u) => (
                <Link key={u.slug} href={`/use-cases/${u.slug}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900/40">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{u.title}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
