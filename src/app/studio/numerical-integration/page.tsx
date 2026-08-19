import type { Metadata } from "next";
import { NumericalIntegrationStudio } from "@/components/studio/NumericalIntegrationStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Numerical Integration Calculator (Browser) — Simpson & Trapezoid", description: "Estimate a definite integral with Left/Right Riemann, Midpoint, Trapezoid, and Simpson's rule. See the shaded panels, the exact value, and the error collapse. Free.", alternates: { canonical: "/studio/numerical-integration" } };
export default function Page() {
  return <StudioPageShell slug="numerical-integration" name="Numerical Integration" keyword="numerical integration Simpson trapezoid"
    lede="Quadrature made visible. Approximate the area under a curve with five classic rules and watch how fast each one converges to the true integral."
    about="Numerical integration (quadrature) estimates a definite integral by sampling f(x) and summing simple shapes: flat-topped rectangles (Left, Right, and Midpoint Riemann sums), straight-line trapezoids, or parabolic arcs (Simpson's rule). The plot shades the exact regions each method uses. Compare the estimate against the analytic value to see the error orders in action — trapezoid converges as O(h²) while Simpson reaches O(h⁴), so Simpson buys several extra digits of accuracy for smooth functions at the same number of subintervals.">
    <NumericalIntegrationStudio /></StudioPageShell>;
}
