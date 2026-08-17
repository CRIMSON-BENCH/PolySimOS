import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { CONSTANTS } from "@/lib/units";

export const metadata: Metadata = {
  title: "Physical Constants Reference — c, G, h, k_B & More",
  description: "A clean reference of the fundamental physical constants used in science and simulation: speed of light, gravitational constant, Planck constant, and more.",
  alternates: { canonical: "/constants" },
};

export default function ConstantsIndex() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Constants", path: "/constants" }]} title="Physical Constants" lede="The fundamental constants of nature — values, units, and what they mean.">
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {CONSTANTS.map((c) => (
          <Link key={c.slug} href={`/constants/${c.slug}`} className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <div>
              <h2 className="font-semibold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{c.name}</h2>
              <p className="font-mono text-sm text-slate-500">{c.symbol} = {c.value} {c.unit}</p>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
