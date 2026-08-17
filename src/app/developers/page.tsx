import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Prose, H2 } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Developers — PolySim OS API, SDK & Webhooks",
  description: "Build on PolySim OS: a REST API, typed SDK, webhooks, embeddable widgets, and an MCP server so AI agents can run simulations.",
  alternates: { canonical: "/developers" },
};

export default function DevelopersPage() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Developers", path: "/developers" }]}
      title="Build on PolySim OS"
      lede="A simulation platform you can call, embed, and extend — from a REST API to an MCP server for AI agents."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["REST API", "Run saved models with parameters and fetch results as JSON.", "/developers"],
          ["SDK", "Typed JavaScript and Python clients for the API.", "/developers/sdk"],
          ["Webhooks", "Get notified on run-complete and threshold events.", "/developers/webhooks"],
        ].map(([t, d, href]) => (
          <Link key={t} href={href} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{t}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{d}</p>
          </Link>
        ))}
      </div>
      <H2>Simulation as an API</H2>
      <Prose>
        <p>Save a model in the Studio, then call it with new parameters from your own code. Ideal for optimization loops, dashboards, and embedding live simulation in your product.</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-lime-400"><code>{`curl -X POST https://api.polysimos.com/v1/run \\
  -H "Authorization: Bearer $POLYSIM_KEY" \\
  -d '{"model":"lorenz","params":{"rho":28}}'`}</code></pre>
      </Prose>
    </PageShell>
  );
}
