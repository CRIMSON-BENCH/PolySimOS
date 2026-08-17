import { getComparison } from "./comparisons";

// Migration guides target the desktop/legacy tools people actively switch from.
export const MIGRATION_SLUGS = ["comsol", "ansys", "matlab", "wolfram-mathematica", "simscale"];

export interface Migration {
  slug: string;
  from: string;
  steps: { name: string; text: string }[];
  reasons: string[];
}

export function getMigration(slug: string): Migration | undefined {
  if (!MIGRATION_SLUGS.includes(slug)) return undefined;
  const c = getComparison(slug);
  if (!c) return undefined;
  return {
    slug,
    from: c.competitor,
    reasons: c.theirWeaknesses,
    steps: [
      { name: "Export your model definition", text: `Gather the geometry, materials, boundary conditions, and solver settings from your ${c.competitor} project.` },
      { name: "Recreate the domain in PolySim", text: "Use the visual node graph, or let the AI Copilot rebuild the setup from a plain-English description or pasted parameters." },
      { name: "Map materials & boundary conditions", text: "Assign properties from the PolySim materials database and set equivalent boundary conditions." },
      { name: "Validate against a known case", text: `Run a benchmark you already trust from ${c.competitor} and compare results side by side.` },
      { name: "Scale and share", text: "Run locally for free, scale to the cloud for large jobs, and publish an interactive, citable version." },
    ],
  };
}
