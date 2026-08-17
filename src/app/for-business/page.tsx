import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Prose, H2 } from "@/components/PageShell";
import { getProductsByCategory, priceLabel } from "@/lib/products";

export const metadata: Metadata = {
  title: "PolySim OS for Business — Teams, API, White-Label & Enterprise",
  description: "Team plans, API access, white-label embedding, and enterprise on-prem deployment. Bring browser-native simulation to your organization.",
  alternates: { canonical: "/for-business" },
};

export default function ForBusinessPage() {
  const business = getProductsByCategory("business-sub");
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "For Business", path: "/for-business" }]}
      title="PolySim OS for Business"
      lede="From five-person teams to global institutions — collaborative simulation, an API to build on, and enterprise-grade deployment."
    >
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {business.map((p) => (
          <Link key={p.slug} href={`/tools/${p.slug}`} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
            <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{priceLabel(p)}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{p.blurb}</p>
          </Link>
        ))}
      </div>
      <H2>Why organizations choose PolySim</H2>
      <Prose>
        <p>Deploy simulation to your whole team without per-seat license shock or IT installs. Collaborate in real time, embed PolySim in your own product, and keep sensitive work on-prem with our enterprise tier.</p>
        <p>Talk to us about volume pricing, procurement, security review, and custom deployment at <a href="mailto:sales@polysimos.com" className="text-cyan-600 hover:underline dark:text-cyan-400">sales@polysimos.com</a>.</p>
      </Prose>
    </PageShell>
  );
}
