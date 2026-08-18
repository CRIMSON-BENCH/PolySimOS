"use client";

import { useState } from "react";
import Link from "next/link";
import { useEntitlement, useHasPlan } from "@/lib/entitlements";
import { useAuth } from "@/lib/auth";
import {
  SOLVER_UNLOCK_PREFIX,
  MULTI_UNLOCK_PREFIX,
  SOLVER_UNLOCK_PRICE,
  MULTI_UNLOCK_PRICE,
  entKey,
} from "@/lib/pricing";

// Shared checkout initiator. `sku` is what /api/checkout resolves; `next` is
// where to return after a successful purchase (the current page).
async function startCheckout(sku: string, next: string, cycle?: "month" | "year", email?: string | null) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: sku, next, cycle, email }),
  });
  const data = await res.json();
  if (data.url) window.location.href = data.url as string;
  else throw new Error(data.error || "Checkout is not configured yet.");
}

function CheckoutCTA({ sku, label, sublabel, next, cycle }: { sku: string; label: string; sublabel?: string; next: string; cycle?: "month" | "year" }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      <button
        onClick={async () => {
          setLoading(true); setErr("");
          try { await startCheckout(sku, next, cycle, user?.email); }
          catch (e) { setErr((e as Error).message); }
          finally { setLoading(false); }
        }}
        disabled={loading}
        className="w-full rounded-lg bg-cyan-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
      >
        {loading ? "Starting checkout…" : label}
      </button>
      {sublabel && !err && <p className="mt-1.5 text-center text-xs text-slate-500">{sublabel}</p>}
      {err && <p className="mt-1.5 text-center text-xs text-amber-600 dark:text-amber-400">{err}</p>}
    </div>
  );
}

function Card({ children, tone = "cyan" }: { children: React.ReactNode; tone?: "cyan" | "slate" }) {
  const border = tone === "cyan" ? "border-cyan-300/50" : "border-slate-200 dark:border-slate-800";
  const bg = tone === "cyan" ? "bg-gradient-to-br from-cyan-500/10 to-transparent" : "bg-slate-50 dark:bg-slate-900/40";
  return <div data-hide-in-app className={`rounded-2xl border ${border} ${bg} p-5`}>{children}</div>;
}

/** (1) Unlock this single solver for $2 — hides itself once unlocked. */
export function UnlockSolverSlot({ slug, name }: { slug: string; name: string }) {
  const unlocked = useEntitlement(entKey.solver(slug));
  if (unlocked) return null;
  return (
    <Card>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Unlock the full {name} solver</div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Advanced parameters, saved presets, and clean high-res exports — yours for life.</p>
      <div className="mt-3">
        <CheckoutCTA sku={`${SOLVER_UNLOCK_PREFIX}${slug}`} next={`/studio/${slug}`} label={`Unlock — $${SOLVER_UNLOCK_PRICE} one-time`} sublabel="Or get every solver with Pro. Credited toward Pro within 30 days." />
      </div>
    </Card>
  );
}

/** (1b) Unlock this multi-solver workflow for $5. */
export function UnlockMultiSlot({ slug, name }: { slug: string; name: string }) {
  const unlocked = useEntitlement(entKey.multi(slug));
  if (unlocked) return null;
  return (
    <Card>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Unlock the {name} workflow</div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Save the full chain, export a combined report, and re-run it any time.</p>
      <div className="mt-3">
        <CheckoutCTA sku={`${MULTI_UNLOCK_PREFIX}${slug}`} next={`/multi/${slug}`} label={`Unlock workflow — $${MULTI_UNLOCK_PRICE} one-time`} sublabel="Included in every Pro plan." />
      </div>
    </Card>
  );
}

/** (2) Contextual plan upgrade — monthly / annual (20% off) toggle. */
export function UpgradeSlot({ next = "/pricing", plan = "pro-unlimited", monthly = 29 }: { next?: string; plan?: string; monthly?: number }) {
  const [cycle, setCycle] = useState<"month" | "year">("year");
  const annual = Math.round(monthly * 12 * 0.8);
  return (
    <Card>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Go Pro — every solver, unlimited saves & exports</div>
      <div className="mt-3 inline-flex rounded-lg border border-slate-300 p-0.5 text-xs dark:border-slate-700">
        <button onClick={() => setCycle("month")} className={`rounded-md px-3 py-1 font-medium ${cycle === "month" ? "bg-cyan-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Monthly</button>
        <button onClick={() => setCycle("year")} className={`rounded-md px-3 py-1 font-medium ${cycle === "year" ? "bg-cyan-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Annual · save 20%</button>
      </div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {cycle === "month" ? <><span className="font-bold text-slate-900 dark:text-slate-100">${monthly}</span>/mo</> : <><span className="font-bold text-slate-900 dark:text-slate-100">${annual}</span>/yr <span className="text-xs">(≈ ${(annual / 12).toFixed(0)}/mo)</span></>}
      </div>
      <div className="mt-3">
        <CheckoutCTA sku={plan} cycle={cycle} next={next} label={cycle === "year" ? `Get Pro Annual — $${annual}/yr` : `Get Pro — $${monthly}/mo`} />
      </div>
    </Card>
  );
}

/** (3) Run bigger / in the cloud — compute tokens. */
export function CloudRunSlot({ next }: { next: string }) {
  return (
    <Card tone="slate">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Need a bigger run?</div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Push high-resolution and long-horizon jobs to cloud GPUs with Compute Tokens.</p>
      <div className="mt-3"><CheckoutCTA sku="gpu-minute-pack-small" next={next} label="Buy GPU-Minute Pack — $5" /></div>
    </Card>
  );
}

/** (4) Upload your own data. */
export function DataUploadSlot({ next }: { next: string }) {
  return (
    <Card tone="slate">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Use your own data</div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Import CSV / HDF5 / NetCDF and drive this model with your measurements.</p>
      <div className="mt-3"><CheckoutCTA sku="dataset-import-credit" next={next} label="Add Data Import — $3" /></div>
    </Card>
  );
}

/** (5) Export a branded report / figures. */
export function ExportSlot({ next }: { next: string }) {
  return (
    <Card tone="slate">
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Export a report</div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Turn this result into a formatted, citation-ready PDF with figures and tables.</p>
      <div className="mt-3"><CheckoutCTA sku="latex-report-auto-generator" next={next} label="Generate Report — $6" /></div>
    </Card>
  );
}

/** Compact, low-key monetization line — replaces the big 4-card grid.
 * One small contextual unlock button + a quiet link to full pricing. */
export function MonetizationBar({ kind, slug, name, next }: { kind: "solver" | "multi"; slug: string; name: string; next: string }) {
  const { user } = useAuth();
  const hasPlan = useHasPlan();
  const unlocked = useEntitlement(kind === "multi" ? entKey.multi(slug) : entKey.solver(slug));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const price = kind === "multi" ? MULTI_UNLOCK_PRICE : SOLVER_UNLOCK_PRICE;
  const sku = `${kind === "multi" ? MULTI_UNLOCK_PREFIX : SOLVER_UNLOCK_PREFIX}${slug}`;
  void name;
  // Pro/Team members: no upsell at all — they already have everything.
  if (hasPlan) return null;
  return (
    <div data-hide-in-app className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {unlocked ? (
        <span className="font-medium text-emerald-600 dark:text-emerald-400">✓ Unlocked — thanks!</span>
      ) : (
        <button
          onClick={async () => { setLoading(true); setErr(""); try { await startCheckout(sku, next, undefined, user?.email); } catch (e) { setErr((e as Error).message); } finally { setLoading(false); } }}
          disabled={loading}
          className="rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
        >
          {loading ? "…" : `Unlock this ${kind === "multi" ? "workflow" : "solver"} — $${price}`}
        </button>
      )}
      {!unlocked && (
        <span className="text-slate-500 dark:text-slate-400">
          or <Link href="/pricing" className="font-medium text-cyan-700 hover:underline dark:text-cyan-300">unlock everything with Pro →</Link>
        </span>
      )}
      {err && <span className="text-xs text-amber-600 dark:text-amber-400">{err}</span>}
    </div>
  );
}

/** (6) Build me a custom / private version. */
export function CustomBuildSlot() {
  return (
    <Card>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Need a private, branded version?</div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">We build custom solvers and workflows for labs, firms, agencies, and courses — your parameters, your branding, your data.</p>
      <Link href="/custom-solvers" className="mt-3 inline-block rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white">Explore Custom Solver Sets →</Link>
    </Card>
  );
}
