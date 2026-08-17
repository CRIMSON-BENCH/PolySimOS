import { getProduct } from "./products";
import { multiBySlug } from "./multi";

// Central price rules for the micro-unlocks and subscription cadences.
// One-time impulse unlocks: any single solver = $2, any multi-solver = $5.
// Annual subscriptions are 20% off the monthly-equivalent (monthly × 12 × 0.8).
export const SOLVER_UNLOCK_PRICE = 2;
export const MULTI_UNLOCK_PRICE = 5;
export const ANNUAL_DISCOUNT = 0.2;

export const SOLVER_UNLOCK_PREFIX = "unlock-solver:";
export const MULTI_UNLOCK_PREFIX = "unlock-multi:";

export type ResolvedSku = {
  name: string;
  description: string;
  amount: number; // cents
  mode: "payment" | "subscription";
  interval?: "month" | "year";
  grantKey: string; // entitlement key granted on success
  metadata: Record<string, string>;
};

const pretty = (slug: string) =>
  slug.split("-").map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");

/** Annual price (in whole dollars) for a monthly rate, at 20% off. */
export function annualPrice(monthly: number): number {
  return Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT));
}

/** Entitlement keys (kept in one place so client + server agree). */
export const entKey = {
  solver: (slug: string) => `solver:${slug}`,
  multi: (slug: string) => `multi:${slug}`,
  plan: (slug: string) => `plan:${slug}`,
  product: (slug: string) => `product:${slug}`,
};

/**
 * Resolve a checkout SKU string into concrete line-item data.
 * Supports three shapes:
 *   - `unlock-solver:<solver-slug>`  → $2 one-time
 *   - `unlock-multi:<multi-slug>`    → $5 one-time
 *   - any catalog product slug (from products.ts), with optional annual cadence
 */
export function resolveSku(slug: string, cycle?: "month" | "year"): ResolvedSku | null {
  if (slug.startsWith(SOLVER_UNLOCK_PREFIX)) {
    const s = slug.slice(SOLVER_UNLOCK_PREFIX.length);
    if (!s) return null;
    return {
      name: `Unlock: ${pretty(s)}`,
      description: `Lifetime unlock of the ${pretty(s)} solver — advanced parameters, saved presets, and clean exports.`,
      amount: SOLVER_UNLOCK_PRICE * 100,
      mode: "payment",
      grantKey: entKey.solver(s),
      metadata: { kind: "solver-unlock", slug: s },
    };
  }

  if (slug.startsWith(MULTI_UNLOCK_PREFIX)) {
    const s = slug.slice(MULTI_UNLOCK_PREFIX.length);
    if (!s) return null;
    const m = multiBySlug(s);
    const name = m ? m.n : pretty(s);
    return {
      name: `Unlock: ${name} workflow`,
      description: `Lifetime unlock of the ${name} multi-solver workflow${m ? ` — ${m.steps.length} chained solvers` : ""}.`,
      amount: MULTI_UNLOCK_PRICE * 100,
      mode: "payment",
      grantKey: entKey.multi(s),
      metadata: { kind: "multi-unlock", slug: s },
    };
  }

  const p = getProduct(slug);
  if (!p || p.price === 0) return null;

  if (p.billing === "subscription") {
    const wantYear = cycle === "year";
    return {
      name: wantYear ? `${p.name} (Annual)` : p.name,
      description: p.blurb,
      amount: (wantYear ? annualPrice(p.price) : p.price) * 100,
      mode: "subscription",
      interval: wantYear ? "year" : "month",
      grantKey: entKey.plan(slug),
      metadata: { kind: "subscription", slug, cycle: wantYear ? "year" : "month" },
    };
  }

  return {
    name: p.name,
    description: p.blurb,
    amount: Math.round(p.price * 100),
    mode: "payment",
    grantKey: entKey.product(slug),
    metadata: { kind: "product", slug },
  };
}
