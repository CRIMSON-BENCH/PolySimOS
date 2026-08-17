import Link from "next/link";

const MARQUEE: { name: string; href: string }[] = [
  { name: "Node Graph", href: "/studio/graph" },
  { name: "2D Fluid (CFD)", href: "/studio/fluid" },
  { name: "3D N-Body", href: "/studio/3d" },
  { name: "FEA Truss", href: "/studio/fea" },
  { name: "Symbolic Math", href: "/studio/cas" },
  { name: "Function Grapher", href: "/studio/grapher" },
];

// Funnels SEO content pages to the live simulators.
export function StudioPromo({ links, heading }: { links?: { name: string; href: string }[]; heading?: string }) {
  const items = (links && links.length ? links : MARQUEE).slice(0, 8);
  return (
    <section className="mt-12 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-lime-50 p-6 dark:border-cyan-900/60 dark:from-cyan-950/40 dark:to-lime-950/20">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">▶ Run it, don&apos;t just read it</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{heading ?? "Try these live simulators — free, in your browser"}</h2>
        </div>
        <Link href="/studio" className="shrink-0 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">Open the Studio →</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-lg border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-600 hover:text-white dark:border-cyan-800 dark:bg-slate-900 dark:text-cyan-300">
            ▶ {l.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
