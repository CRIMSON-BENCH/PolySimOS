import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found — PolySim OS", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-3xl font-black text-white shadow-lg">P</div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">404</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100 sm:text-4xl">This page ran off the canvas</h1>
      <p className="mt-3 max-w-md text-slate-600 dark:text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or moved. But 390+ live simulators are one click away.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/studio" className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">Browse the Studio →</Link>
        <Link href="/" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Home</Link>
        <Link href="/matlab-alternative" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">MATLAB alternative</Link>
      </div>
    </div>
  );
}
