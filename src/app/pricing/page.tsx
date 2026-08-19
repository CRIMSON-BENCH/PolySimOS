import type { Metadata } from "next";
import { PageShell, H2 } from "@/components/PageShell";
import { PricingTiers } from "@/components/PricingTiers";
import { SpecializedPackages } from "@/components/SpecializedPackages";
import { faqLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing — PolySim OS | Free Locally, Simple Plans",
  description: "Local rendering is free forever. Four simple plans — Free, Pro, Team, Enterprise — with 20% off annual. No quotes, no sales calls. Or unlock any solver for $2.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  const faqs = [
    { q: "Is PolySim really free?", a: "Yes — all 390+ solvers run locally in your browser, free forever. You only pay for Pro features (saves, data import, exports, AI) or cloud compute." },
    { q: "Do I have to subscribe?", a: "No. You can unlock any single solver for $2 or a full multi-solver workflow for $5 — one-time, no subscription. Pro just unlocks everything at once." },
    { q: "What's the difference between Pro and Team?", a: "Pro is for one person. Team adds a shared workspace, pooled compute, admin controls, and seats for a lab, class, or firm." },
    { q: "Do students and educators get a discount?", a: "Local use is free for everyone. Verified students and classrooms get additional discounts — just reach out." },
    { q: "Can I cancel anytime?", a: "Yes. Cancel from your dashboard anytime; access continues to the end of the billing period." },
    { q: "How does this compare to MATLAB or COMSOL?", a: "MATLAB toolboxes and COMSOL modules run into the thousands per year and need installs and licenses. PolySim starts free, runs in any browser, and tops out at flat, transparent plans." },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]}
      jsonLd={faqLd(faqs)}
      title="Simple, transparent pricing"
      lede="Local rendering is free forever. Scale to the cloud only when reality gets heavy — no quotes, no sales calls."
    >
      {/* iOS free-companion notice — shown ONLY inside the app (see globals.css). */}
      <div className="only-in-app rounded-2xl border border-cyan-300/40 bg-cyan-500/10 p-6 text-center">
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Everything in the app is free.</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">All 390+ simulators run at no cost, with no account required. Enjoy exploring.</p>
      </div>

      <div data-hide-in-app>
      <div className="mt-8"><PricingTiers /></div>

      <SpecializedPackages />

      <H2>How we compare</H2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-900">
              <th className="px-4 py-2.5 font-semibold">Tool</th>
              <th className="px-4 py-2.5 font-semibold">Entry price</th>
              <th className="px-4 py-2.5 font-semibold">Browser-native</th>
              <th className="px-4 py-2.5 font-semibold">Transparent</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["PolySim OS", "$0 (free local)", "Yes", "Yes"],
              ["MATLAB", "$119/yr student, toolboxes extra", "Limited", "Partly"],
              ["SimScale", "Free tier, then quote", "Yes", "No"],
              ["COMSOL", "~$3,495/yr + modules", "No", "Partly"],
              ["Ansys", "Quote (high)", "Mostly no", "No"],
            ].map((r) => (
              <tr key={r[0]} className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${r[0] === "PolySim OS" ? "bg-cyan-50 dark:bg-cyan-950/30" : ""}`}>
                {r.map((c, i) => <td key={i} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Pricing FAQ</H2>
      <div className="mt-4 max-w-3xl divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {faqs.map((f) => (
          <details key={f.q} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2.5 font-semibold text-slate-800 hover:text-cyan-700 dark:text-slate-200 dark:hover:text-cyan-300">
              <span>{f.q}</span>
              <span className="shrink-0 text-slate-400 transition group-open:rotate-180">▾</span>
            </summary>
            <div className="pb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.a}</div>
          </details>
        ))}
      </div>
      </div>
    </PageShell>
  );
}
