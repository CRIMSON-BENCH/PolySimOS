import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { materialsByCategory, PROPERTIES } from "@/lib/materials";
import { ACCURACY_NOTE } from "@/lib/disclaimer";

export const metadata: Metadata = {
  title: "Materials Database — Properties for Simulation | PolySim OS",
  description: "A searchable materials database with density, Young's modulus, thermal conductivity, and more — the property inputs your simulations need.",
  alternates: { canonical: "/materials" },
};

export default function MaterialsIndex() {
  const byCat = materialsByCategory();
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Materials", path: "/materials" }]}
      title="Materials Database"
      lede="Property data for hundreds of materials — ready to drop into your simulation."
      disclaimerNote={ACCURACY_NOTE}
    >
      <div className="mt-6 flex flex-wrap gap-2">
        {PROPERTIES.map((p) => (
          <span key={p.slug} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{p.label}</span>
        ))}
      </div>
      {Object.entries(byCat).map(([cat, list]) => (
        <div key={cat} className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">{cat}s</h2>
          <div className="flex flex-wrap gap-2">
            {list.map((m) => (
              <Link key={m.slug} href={`/materials/${m.slug}`} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {m.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </PageShell>
  );
}
