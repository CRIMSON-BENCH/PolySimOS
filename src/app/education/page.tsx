import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { institutionsByCountry } from "@/lib/institutions";
import { getProduct } from "@/lib/products";
import { PremiumCTA } from "@/components/PremiumCTA";

export const metadata: Metadata = {
  title: "Simulation Software for Universities & Colleges",
  description: "Browser-native simulation for students, educators, and researchers. See how PolySim OS fits your institution's physics, engineering, and math courses — free to start.",
  alternates: { canonical: "/education" },
};

export default function EducationIndex() {
  const byCountry = institutionsByCountry();
  const kit = getProduct("educator-classroom-kit");
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Education", path: "/education" }]}
      title="PolySim OS for Education"
      lede="No installs, no lab licenses, no per-seat shock. Real simulation your students can run on any laptop — free to start, with classroom tools for educators."
    >
      {kit && <PremiumCTA product={kit} heading="Set up your classroom" />}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/courses" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">Browse by course →</Link>
        <Link href="/curriculum" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">Browse by curriculum (AP/IB/A-Level) →</Link>
      </div>
      {Object.entries(byCountry).map(([country, list]) => (
        <div key={country} className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">{country}</h2>
          <div className="flex flex-wrap gap-2">
            {list.map((i) => (
              <Link key={i.slug} href={`/education/${i.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {i.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </PageShell>
  );
}
