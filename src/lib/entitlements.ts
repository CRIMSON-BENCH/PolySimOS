"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Entitlements: what the current user has unlocked.
//
// TODAY (no auth wired): entitlements persist per-device in localStorage. A
// successful Stripe Checkout redirects through /unlocked which calls grant().
//
// UPGRADE PATH (once Supabase auth is connected): replace the two functions
// `readKeys()` and `grant()` with calls to a `/api/entitlements` route backed
// by the Supabase `entitlements` table (the Stripe webhook already writes to
// it). Nothing else in the app needs to change — every component reads through
// `useEntitlement()` / `hasEntitlement()`.
// ---------------------------------------------------------------------------

const STORE_KEY = "polysim.entitlements";

function readKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeKeys(keys: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify([...keys]));
    window.dispatchEvent(new Event("polysim:entitlements"));
  } catch {
    /* storage unavailable — ignore */
  }
}

/** True if the given entitlement key is unlocked (also true for any active plan). */
export function hasEntitlement(key: string): boolean {
  const keys = readKeys();
  if (keys.has(key)) return true;
  // Any Pro/Team/Business/Enterprise-style plan unlocks all solver + multi content.
  if ((key.startsWith("solver:") || key.startsWith("multi:")) && hasAnyPlan(keys)) return true;
  return false;
}

function hasAnyPlan(keys: Set<string>): boolean {
  for (const k of keys) if (k.startsWith("plan:")) return true;
  return false;
}

/** Grant one entitlement key (called after successful checkout). */
export function grant(key: string) {
  const keys = readKeys();
  keys.add(key);
  writeKeys(keys);
}

/** Reactive hook: re-renders when entitlements change. */
export function useEntitlement(key: string): boolean {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    const update = () => setUnlocked(hasEntitlement(key));
    update();
    window.addEventListener("polysim:entitlements", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("polysim:entitlements", update);
      window.removeEventListener("storage", update);
    };
  }, [key]);
  return unlocked;
}

/** On sign-out, drop subscription (plan:*) unlocks; keep one-time purchases. */
export function clearLocalPlanEntitlements() {
  const keys = readKeys();
  let changed = false;
  for (const k of [...keys]) if (k.startsWith("plan:")) { keys.delete(k); changed = true; }
  if (changed) writeKeys(keys);
}

/** Reactive hook returning all unlocked entitlement keys. */
export function useEntitlementKeys(): string[] {
  const [keys, setKeys] = useState<string[]>([]);
  useEffect(() => {
    const update = () => setKeys([...readKeys()]);
    update();
    window.addEventListener("polysim:entitlements", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("polysim:entitlements", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return keys;
}

/** Reactive hook for "does the user hold any paid plan". */
export function useHasPlan(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    const update = () => setHas(hasAnyPlan(readKeys()));
    update();
    window.addEventListener("polysim:entitlements", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("polysim:entitlements", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return has;
}
