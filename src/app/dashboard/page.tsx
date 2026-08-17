import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Dashboard — PolySim OS", description: "Your projects, purchases, subscriptions, and compute usage.", alternates: { canonical: "/dashboard" } };

export default function DashboardPage() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Dashboard", path: "/dashboard" }]} title="Your Dashboard" lede="Projects, purchases, subscription status, and compute usage in one place.">
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Projects", "Open the Studio to create one", "/studio"],
          ["Purchases", "Your one-time products", "/tools"],
          ["Subscription", "Manage your plan", "/pricing"],
          ["Compute Tokens", "Top up anytime", "/tools/starter-token-pack"],
        ].map(([t, d, href]) => (
          <Link key={t} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <p className="font-bold text-slate-900 dark:text-slate-100">{t}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{d}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-500">Sign in to see your live data. Connect Supabase to activate accounts, storage, and usage tracking.</p>
    </PageShell>
  );
}
