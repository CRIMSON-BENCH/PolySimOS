import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SIM_TOPICS } from "@/lib/simulate";

export const metadata: Metadata = {
  title: "How to Simulate Anything in Your Browser | PolySim OS Guides",
  description: "Step-by-step guides to simulate physics, biology, chemistry, math, and engineering phenomena in your browser — many with a live, runnable model.",
  alternates: { canonical: "/simulate" },
};

export default function SimulateIndex() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Simulate", path: "/simulate" }]}
      title="Simulation Guides"
      lede="Pick a phenomenon and learn exactly how to model it in the browser — with a live demo wherever we have one."
    >
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SIM_TOPICS.map((t) => (
          <Link key={t.slug} href={`/simulate/${t.slug}`} className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{t.name}</h2>
              {t.studio && <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-700 dark:bg-lime-950 dark:text-lime-300">LIVE</span>}
            </div>
            <p className="mt-1 text-xs text-slate-400">{t.domainName}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
