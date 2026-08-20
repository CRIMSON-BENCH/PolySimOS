import type { Metadata } from "next";
import { DesignOptimizerStudio } from "@/components/studio/DesignOptimizerStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Design Optimizer — Spec → Lightest Part | PolySim OS",
  description:
    "State a load and deflection/safety-factor requirement and PolySim sizes a beam cross-section and picks the material that meets it at minimum mass or cost — then hands off to Fabricate. Design to spec, in your browser.",
  alternates: { canonical: "/studio/design-optimizer" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="design-optimizer"
      name="Design Optimizer"
      keyword="design to spec beam optimization lightest"
      lede="From requirement to part: state the load and how much it may deflect, and PolySim sizes the cross-section and chooses the material that meets the spec at minimum mass or cost."
      about="Design Optimizer turns a performance requirement into a concrete, buildable part. Set the load, span, allowable deflection, and safety factor, and it sizes a cantilever cross-section for every candidate material — aluminum, steels, titanium, acrylic, wood, carbon fiber — using real beam mechanics (δ = FL³/3EI, σ = 6FL/bh², I = bh³/12), enforcing both the deflection and yield constraints, then ranks them by mass or cost and recommends the winner with its exact dimensions and true safety factor. Hand the result to Fabricate for the cut/print files and bill of materials. It's a first-cut sizing aid — always confirm with full FEA and physical testing before relying on a part."
    >
      <DesignOptimizerStudio />
    </StudioPageShell>
  );
}
