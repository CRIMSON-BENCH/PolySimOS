import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { CATEGORIES } from "@/lib/units";

export const metadata: Metadata = {
  title: "Unit Converters — Length, Pressure, Energy, Temperature & More",
  description: "Fast, accurate unit converters for every quantity in science and engineering: length, mass, pressure, energy, power, temperature, and more. Free.",
  alternates: { canonical: "/convert" },
};

export default function ConvertIndex() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Converters", path: "/convert" }]} title="Unit Converters" lede="Accurate conversions for every quantity you use in simulation — pick a category.">
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/convert/${c.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <h2 className="font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{c.name}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{c.units.length} units · base {c.base}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8"><Link href="/constants" className="text-cyan-600 hover:underline dark:text-cyan-400">Physical constants reference →</Link></div>
    </PageShell>
  );
}
