import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, H2 } from "@/components/PageShell";
import { getProductsByCategory, priceLabel } from "@/lib/products";
import { BuyButton } from "@/components/BuyButton";
import { faqLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing — PolySim OS | Free Locally, Transparent Plans",
  description: "Local rendering is free forever. Scale to the cloud with flat, transparent plans from $5/mo — no quotes, no sales calls. Compare with SimScale, COMSOL, and Ansys.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  const consumer = getProductsByCategory("consumer-sub");
  const business = getProductsByCategory("business-sub");

  const faqs = [
    { q: "Is PolySim really free?", a: "Yes — local simulation and rendering are free forever. You only pay for cloud compute (Compute Tokens) or premium plan features." },
    { q: "Do you offer education discounts?", a: "Verified students get a dedicated $5/mo plan, and educators get classroom tools. Local use is free for everyone." },
    { q: "Can I cancel anytime?", a: "Yes. Subscriptions can be cancelled anytime from your dashboard, effective at the end of the billing period." },
    { q: "How does this compare to COMSOL or Ansys?", a: "COMSOL's base license starts around $3,495/yr plus per-module fees; Ansys is typically quote-only and far higher. PolySim starts free, with flat plans from $5/mo." },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]}
      jsonLd={faqLd(faqs)}
      title="Simple, transparent pricing"
      lede="Local rendering is free forever. Scale to the cloud only when reality gets heavy — no quotes, no sales calls."
    >
      <H2>For individuals & researchers</H2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {consumer.map((p) => (
          <div key={p.slug} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{priceLabel(p)}</p>
            <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{p.blurb}</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {p.includes.map((i) => <li key={i}>✓ {i}</li>)}
            </ul>
            <div className="mt-4"><BuyButton slug={p.slug} label="Subscribe" price={priceLabel(p)} /></div>
          </div>
        ))}
      </div>

      <H2>For teams & institutions</H2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {business.map((p) => (
          <div key={p.slug} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{priceLabel(p)}</p>
            <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">{p.blurb}</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {p.includes.map((i) => <li key={i}>✓ {i}</li>)}
            </ul>
            <div className="mt-4">
              {p.name === "Enterprise" ? (
                <Link href="/for-business" className="block w-full rounded-lg border border-slate-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Contact sales</Link>
              ) : (
                <BuyButton slug={p.slug} label="Subscribe" price={priceLabel(p)} />
              )}
            </div>
          </div>
        ))}
      </div>

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
              ["SimScale", "Free tier, then quote", "Yes", "No"],
              ["COMSOL", "~$3,495/yr + modules", "No", "Partly"],
              ["Ansys", "Quote (high)", "Mostly no", "No"],
              ["MATLAB", "$119/yr student", "Limited", "Partly"],
            ].map((r) => (
              <tr key={r[0]} className={`border-b border-slate-100 last:border-0 dark:border-slate-800 ${r[0] === "PolySim OS" ? "bg-cyan-50 dark:bg-cyan-950/30" : ""}`}>
                {r.map((c, i) => <td key={i} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Pricing FAQ</H2>
      <dl className="mt-4 max-w-3xl space-y-4">
        {faqs.map((f) => (
          <div key={f.q}>
            <dt className="font-semibold text-slate-800 dark:text-slate-200">{f.q}</dt>
            <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.a}</dd>
          </div>
        ))}
      </dl>
    </PageShell>
  );
}
