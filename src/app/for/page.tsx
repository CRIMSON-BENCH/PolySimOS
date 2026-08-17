import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { INDUSTRIES } from "@/lib/industries";

export const metadata: Metadata = {
  title: "Simulation by Industry — Aerospace, Automotive, Biotech, Energy & More",
  description: "See how PolySim OS is used across industries, from aerospace and automotive to biotech, energy, and beyond. Browser-native simulation for every sector.",
  alternates: { canonical: "/for" },
};

export default function IndustriesIndex() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Industries", path: "/for" }]}
      title="Simulation for Every Industry"
      lede="Purpose-built workflows for the problems your sector actually faces."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((i) => (
          <Link key={i.slug} href={`/for/${i.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <h2 className="font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{i.name}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{i.summary}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
