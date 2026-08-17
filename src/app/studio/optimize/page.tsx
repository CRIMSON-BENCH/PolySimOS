import type { Metadata } from "next";
import { OptimizeStudio } from "@/components/studio/OptimizeStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Optimization & Uncertainty Simulator (Browser)",
  description: "Minimize any function with gradient descent and propagate input uncertainty with Monte-Carlo — see the minimum and the output distribution live. Free.",
  alternates: { canonical: "/studio/optimize" },
};

export default function Page() {
  return (
    <StudioPageShell slug="optimize" name="Optimization + Uncertainty" keyword="optimization and uncertainty quantification"
      lede="Find the minimum of a function by gradient descent, then quantify how uncertainty in the input propagates to the output — the two workflows behind real engineering design."
      about="Gradient descent uses a numerical gradient to walk downhill to a local minimum, drawing its path on the curve. Monte-Carlo uncertainty quantification then samples the input from a normal distribution around that optimum and reports the mean, standard deviation, and 5–95% band of the output — exactly how engineers turn a nominal design into a robust one.">
      <OptimizeStudio />
    </StudioPageShell>
  );
}
