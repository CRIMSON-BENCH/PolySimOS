import type { Metadata } from "next";
import { GaussianProcessStudio } from "@/components/studio/GaussianProcessStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Gaussian Process Regression (Browser) — Kriging & Uncertainty", description: "Interactive 1D Gaussian process regression. Click to add data, tune the RBF length-scale, signal variance, and noise, and watch the posterior mean, 95% band, and sample functions update live. Free.", alternates: { canonical: "/studio/gaussian-process" } };
export default function Page() {
  return <StudioPageShell slug="gaussian-process" name="Gaussian Process" keyword="Gaussian process regression kriging"
    lede="Regression that knows what it doesn't know. Fit a distribution over functions to your data and watch the uncertainty band widen wherever evidence runs out."
    about="Gaussian process regression (also called kriging) places a prior over functions defined by an RBF kernel k(x,x')=σ²exp(−(x−x')²/2ℓ²), then conditions on your observations to get a posterior. The posterior mean interpolates the data while the 95% confidence band collapses at each point and widens in the gaps — an honest map of where the model has evidence and where it is guessing. The length-scale ℓ controls how far each point's influence reaches: short ℓ gives a wiggly fit, long ℓ a smooth one. Everything runs client-side with a from-scratch Cholesky solve of the kernel system — no libraries.">
    <GaussianProcessStudio /></StudioPageShell>;
}
