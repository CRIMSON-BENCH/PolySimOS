"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useEntitlementKeys } from "@/lib/entitlements";

function labelFor(key: string): { kind: string; name: string } {
  const [type, ...rest] = key.split(":");
  const slug = rest.join(":");
  const pretty = slug.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
  if (type === "solver") return { kind: "Solver", name: pretty };
  if (type === "multi") return { kind: "Workflow", name: pretty };
  if (type === "plan") return { kind: "Plan", name: pretty };
  return { kind: "Product", name: pretty };
}

export function DashboardPanel() {
  const { user, loading, configured, signOut } = useAuth();
  const keys = useEntitlementKeys();

  if (loading) return <p className="mt-8 text-sm text-slate-500">Loading your account…</p>;

  if (!user) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <p className="font-semibold text-slate-900 dark:text-slate-100">You&apos;re not signed in</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {configured
            ? "Sign in to sync your unlocks, subscription, and saved work across every device."
            : "Accounts activate once Supabase keys are added. Your unlocks are saved on this device in the meantime."}
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/login" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Log in</Link>
          <Link href="/signup" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Sign up free</Link>
        </div>
      </div>
    );
  }

  const plans = keys.filter((k) => k.startsWith("plan:"));
  const unlocks = keys.filter((k) => k.startsWith("solver:") || k.startsWith("multi:") || k.startsWith("product:"));

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-sm text-slate-500">Signed in as</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{user.email}</p>
        </div>
        <button onClick={signOut} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Sign out</button>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Your plan</h2>
        {plans.length ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {plans.map((k) => <li key={k} className="rounded-full bg-cyan-600/10 px-3 py-1 text-sm font-medium text-cyan-700 dark:text-cyan-300">{labelFor(k).name}</li>)}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Free plan. <Link href="/pricing" className="text-cyan-600 hover:underline dark:text-cyan-400">See Pro →</Link></p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Your unlocks ({unlocks.length})</h2>
        {unlocks.length ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unlocks.map((k) => {
              const { kind, name } = labelFor(k);
              return <div key={k} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><span className="text-xs font-semibold uppercase text-slate-400">{kind}</span><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{name}</p></div>;
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">No unlocks yet. Every solver and workflow has a one-time unlock, or go Pro for all of them.</p>
        )}
      </div>
    </div>
  );
}
