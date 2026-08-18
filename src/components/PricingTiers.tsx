"use client";

import { useState } from "react";
import Link from "next/link";

type Tier = { name: string; slug: string | null; monthly: number | null; tagline: string; popular?: boolean; cta: string; href?: string; features: string[] };

const TIERS: Tier[] = [
  { name: "Free", slug: null, monthly: 0, tagline: "For learning & tinkering", cta: "Start free", href: "/signup",
    features: ["All 370+ solvers, free forever", "Runs locally in your browser", "Basic exports", "Save your work with an account"] },
  { name: "Pro", slug: "pro-unlimited", monthly: 29, tagline: "For serious individual work", popular: true, cta: "Get Pro",
    features: ["Everything in Free", "Every solver & multi-solver unlocked", "Unlimited saved projects & presets", "Import your own data (CSV / HDF5)", "Watermark-free exports", "AI copilot & priority compute"] },
  { name: "Team", slug: "team-starter", monthly: 129, tagline: "For labs, classes & firms", cta: "Get Team",
    features: ["Everything in Pro, for 5 seats", "Shared team workspace", "Pooled cloud compute", "Admin controls & usage analytics", "Priority support"] },
  { name: "Enterprise", slug: null, monthly: null, tagline: "For orgs & institutions", cta: "Contact sales", href: "/for-business",
    features: ["Unlimited seats", "SSO / SAML & audit logs", "Custom solver builds", "On-prem / bring-your-own-compute", "SLA & dedicated support"] },
];

export function PricingTiers() {
  const [cycle, setCycle] = useState<"month" | "year">("year");
  const priceFor = (m: number) => (cycle === "year" ? Math.round(m * 12 * 0.8) : m);

  async function buy(slug: string) {
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, cycle, next: "/dashboard" }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url as string;
      else alert(data.error || "Checkout isn't configured yet.");
    } catch { alert("Something went wrong starting checkout."); }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-center">
        <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm dark:border-slate-700">
          <button onClick={() => setCycle("month")} className={cycle === "month" ? "rounded-md bg-cyan-600 px-4 py-1.5 font-semibold text-white" : "px-4 py-1.5 font-medium text-slate-600 dark:text-slate-300"}>Monthly</button>
          <button onClick={() => setCycle("year")} className={cycle === "year" ? "rounded-md bg-cyan-600 px-4 py-1.5 font-semibold text-white" : "px-4 py-1.5 font-medium text-slate-600 dark:text-slate-300"}>Annual · save 20%</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {TIERS.map((t) => (
          <div key={t.name} className={`flex flex-col rounded-2xl border bg-white p-6 dark:bg-slate-900 ${t.popular ? "border-cyan-400 ring-2 ring-cyan-400/30 dark:border-cyan-500" : "border-slate-200 dark:border-slate-800"}`}>
            {t.popular && <span className="mb-2 inline-block w-fit rounded-full bg-cyan-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Most popular</span>}
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{t.tagline}</p>
            <div className="mt-4 flex min-h-[3.5rem] flex-col justify-center">
              {t.monthly === 0 ? (
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">Free</span>
              ) : t.monthly === null ? (
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">Custom</span>
              ) : (
                <>
                  <div><span className="text-3xl font-black text-slate-900 dark:text-slate-100">${priceFor(t.monthly)}</span><span className="text-slate-500">/{cycle === "year" ? "yr" : "mo"}</span></div>
                  {cycle === "year" && <div className="text-xs text-slate-500">≈ ${Math.round(t.monthly * 0.8)}/mo, billed yearly</div>}
                </>
              )}
            </div>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {t.features.map((f) => <li key={f} className="flex gap-2"><span className="mt-0.5 shrink-0 text-cyan-500">✓</span>{f}</li>)}
            </ul>
            <div className="mt-6">
              {t.slug ? (
                <button onClick={() => buy(t.slug!)} className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 font-semibold text-white transition hover:bg-cyan-700">{t.cta}</button>
              ) : (
                <Link href={t.href!} className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{t.cta}</Link>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">Or skip subscriptions — unlock any single solver for <span className="font-semibold">$2</span> or a full workflow for <span className="font-semibold">$5</span>, one-time.</p>
    </div>
  );
}
