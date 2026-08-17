import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { MIGRATION_SLUGS, getMigration } from "@/lib/migrations";

export const metadata: Metadata = {
  title: "Migrate to PolySim OS — Switch from COMSOL, Ansys, MATLAB & More",
  description: "Step-by-step guides to move your simulation work from legacy desktop tools to PolySim OS — and stop paying for expensive licenses.",
  alternates: { canonical: "/migrate" },
};

export default function MigrateIndex() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Migrate", path: "/migrate" }]}
      title="Migrate to PolySim OS"
      lede="Leave the desktop license behind. Here's how to bring your models across, cleanly."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {MIGRATION_SLUGS.map((s) => {
          const m = getMigration(s)!;
          return (
            <Link key={s} href={`/migrate/${s}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
              <h2 className="font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">Switch from {m.from}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">A guided path from {m.from} to PolySim OS in five steps.</p>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
