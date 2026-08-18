import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { PyConsole } from "@/components/PyConsole";

export const metadata: Metadata = {
  title: "Python Console — Run NumPy, SciPy & Matplotlib in Your Browser",
  description: "A full Python console (NumPy, SciPy, Matplotlib) running entirely in your browser via WebAssembly. No install, no server, free. Paste any solver's 'Copy as Python' snippet and run it live.",
  alternates: { canonical: "/console" },
};

export default function ConsolePage() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Python Console", path: "/console" }]}
      title="Python console — in your browser"
      lede="Real Python with NumPy, SciPy, and Matplotlib, running 100% client-side via WebAssembly. Nothing to install, nothing sent to a server. Paste the “Copy as Python” snippet from any of our 365 solvers and run it live."
    >
      <PyConsole />

      <div className="mt-10 rounded-2xl border border-slate-200 p-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">How this works</h2>
        <p>
          The first Run downloads Pyodide — CPython compiled to WebAssembly (~10&nbsp;MB, cached afterward) — then executes your
          code in a sandbox inside the tab. Imports like <code>numpy</code>, <code>scipy</code>, and <code>matplotlib</code> are
          auto-installed on demand. Because it&apos;s all local, your code and data never leave your machine, and it costs us
          nothing to run — the same &ldquo;free, browser-native&rdquo; principle as every solver on PolySim.
        </p>
      </div>
    </PageShell>
  );
}
