import type { Metadata } from "next";
import { CurveFittingStudio } from "@/components/studio/CurveFittingStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Nonlinear Curve Fitting (Browser) — Gauss–Newton Least Squares", description: "Fit exponential, logistic, Gaussian, power, and sinusoid models to noisy data with Gauss–Newton least squares. Watch it converge. Free, in-browser.", alternates: { canonical: "/studio/curve-fitting" } };
export default function Page() {
  return <StudioPageShell slug="curve-fitting" name="Curve Fitting" keyword="curve fitting nonlinear model"
    lede="Fit a nonlinear model to noisy data and watch least squares converge. Choose an exponential, logistic, Gaussian, power, or sinusoid curve and see the parameters lock on."
    about="Unlike a straight-line or polynomial fit, a nonlinear model has no closed-form least-squares solution — it must be found by iteration. This studio runs Gauss–Newton with Levenberg–Marquardt damping: at each step it builds the residual vector, computes the Jacobian numerically, and solves the normal equations Δβ = (JᵀJ)⁻¹Jᵀr to update the parameters. Adjust the noise level and sample count, then watch the fitted curve snap onto the data over successive iterations. Because it is iterative, the final fit depends on the starting guess — the same reason real-world nonlinear regression can land in a bad local minimum.">
    <CurveFittingStudio /></StudioPageShell>;
}
