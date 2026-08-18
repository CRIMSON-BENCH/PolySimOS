"use client";

import { useHasPlan } from "@/lib/entitlements";

// Renders upsell content only for users WITHOUT an active paid plan.
// Pro/Team/Enterprise members never see upgrade prompts.
export function ProGatedUpsell({ children }: { children: React.ReactNode }) {
  const hasPlan = useHasPlan();
  if (hasPlan) return null;
  return <>{children}</>;
}
