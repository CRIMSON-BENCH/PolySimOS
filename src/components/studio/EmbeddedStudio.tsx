"use client";

import { STUDIO_COMPONENTS } from "./registry";
import { MultiStudioSteps } from "./MultiStudioSteps";
import { multiBySlug } from "@/lib/multi";

// Renders a live solver by slug for embedding on a use-case page. Handles both
// single solvers and multi-solver workflows (rendered as a chain).
export function EmbeddedStudio({ slug, kind }: { slug: string; kind: "solver" | "multi" }) {
  if (kind === "multi") {
    const m = multiBySlug(slug);
    if (m) return <MultiStudioSteps steps={m.steps} />;
  }
  const Studio = STUDIO_COMPONENTS[slug];
  if (!Studio) {
    return <div className="rounded-xl border border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-800">This simulation is being prepared.</div>;
  }
  return <Studio />;
}
