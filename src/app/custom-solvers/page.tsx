import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, H2, Prose } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Custom Solver Sets — Bespoke Simulations Built for You",
  description: "We build custom, branded interactive solver sets for labs, companies, universities, and agencies — your equations, your workflow, embeddable and white-label. Get a quote.",
  alternates: { canonical: "/custom-solvers" },
};

const TIERS = [
  { name: "Single Custom Solver", price: "$2,500", blurb: "One bespoke simulator built to your spec — your equations, your parameters, your branding.", points: ["1 custom interactive solver", "Your model / equations", "Embeddable + shareable", "2 revision rounds"] },
  { name: "Solver Pack (5–10)", price: "from $9,900", blurb: "A themed set of solvers for a course, product line, or research group.", points: ["5–10 custom solvers", "Shared design system", "White-label option", "Priority delivery"] },
  { name: "Enterprise / Lab Suite", price: "Custom", blurb: "A full branded simulation suite, on your domain, with API access and on-prem options.", points: ["Unlimited solvers", "White-label on your domain", "API + SSO + on-prem", "Dedicated support & SLA"] },
];

export default function CustomSolversPage() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Custom Solvers", path: "/custom-solvers" }]}
      eyebrow="Services"
      title="Custom Solver Sets, Built for You"
      lede="You have the model. We turn it into a beautiful, interactive, embeddable simulator — first of its kind, on your brand. For labs, companies, universities, agencies, and first-responder teams."
    >
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {TIERS.map((t, i) => (
          <div key={t.name} className={`flex flex-col rounded-2xl border p-6 ${i === 1 ? "border-2 border-cyan-400 dark:border-cyan-500" : "border-slate-200 dark:border-slate-800"} bg-white dark:bg-slate-900`}>
            {i === 1 && <span className="mb-2 w-fit rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">Most popular</span>}
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{t.name}</h3>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{t.price}</p>
            <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{t.blurb}</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">{t.points.map((p) => <li key={p}>✓ {p}</li>)}</ul>
            <a href="mailto:custom@polysimos.com?subject=Custom%20Solver%20Set%20Inquiry" className="mt-4 rounded-lg bg-cyan-600 px-5 py-2.5 text-center font-semibold text-white transition hover:bg-cyan-700">Request a quote</a>
          </div>
        ))}
      </div>

      <H2>How it works</H2>
      <ol className="mt-4 space-y-3">
        {[["Tell us your model", "Share the equations, data, or process you want to make interactive — no code required."], ["We build it", "Our team builds real, numerically-correct solvers on the PolySim engine, in your brand."], ["Embed everywhere", "Drop them into your site, docs, LMS, or product with a single iframe — or run white-label on your own domain."], ["Iterate & scale", "Expand the set over time; add API access, SSO, and on-prem as you grow."]].map(([t, d], i) => (
          <li key={t} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">{i + 1}</span><div><p className="font-semibold text-slate-900 dark:text-slate-100">{t}</p><p className="text-sm text-slate-600 dark:text-slate-400">{d}</p></div></li>
        ))}
      </ol>

      <Prose>
        <p>Who we build for: <strong>national labs &amp; research institutes</strong> (custom CFD/FEA/surrogate tools), <strong>companies</strong> (product configurators, engineering calculators), <strong>universities &amp; schools</strong> (course-aligned lab sets), and <strong>first-responder &amp; public-safety agencies</strong> (fire-spread, dispersion, crash-reconstruction, and triage tools). Nothing like this has been offered before — bespoke, browser-native, interactive science, on your brand.</p>
      </Prose>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href="mailto:custom@polysimos.com?subject=Custom%20Solver%20Set%20Inquiry" className="rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white hover:bg-cyan-700">Start a project →</a>
        <Link href="/studio" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">See the 390+ live solvers</Link>
      </div>
    </PageShell>
  );
}
