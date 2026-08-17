import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { MODELS } from "@/lib/models";

export const metadata: Metadata = {
  title: "Equations & Models — Navier–Stokes, Schrödinger, Lorenz & More",
  description: "A reference of the fundamental equations of science and engineering, each with a plain-language explanation and, where possible, a live simulation.",
  alternates: { canonical: "/models" },
};

export default function ModelsIndex() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Models", path: "/models" }]}
      title="Equations & Models"
      lede="The equations that describe reality — explained, and many of them runnable live in your browser."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {MODELS.map((m) => (
          <Link key={m.slug} href={`/models/${m.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{m.name}</h2>
              {m.studio && <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold text-lime-700 dark:bg-lime-950 dark:text-lime-300">LIVE</span>}
            </div>
            <p className="mt-1 font-mono text-xs text-cyan-700 dark:text-cyan-400">{m.formula}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{m.summary}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
