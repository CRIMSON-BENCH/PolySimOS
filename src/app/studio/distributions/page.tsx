import type { Metadata } from "next";
import { DistributionsStudio } from "@/components/studio/DistributionsStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Probability Distribution Explorer (Browser)", description: "Visualize the normal, exponential, Poisson, and binomial distributions. Adjust parameters and see mean and variance update live. Free.", alternates: { canonical: "/studio/distributions" } };
export default function Page() {
  return <StudioPageShell slug="distributions" name="Probability Distributions" keyword="probability distribution"
    lede="Shape the classic distributions by hand. Adjust the parameters of the normal, exponential, Poisson, and binomial distributions and watch mean and variance respond."
    about="Each distribution's probability density (or mass) function is plotted live as you change its parameters, with the mean and variance computed exactly. It's the fastest way to build intuition for the distributions behind statistics, uncertainty quantification, and Monte-Carlo methods.">
    <DistributionsStudio /></StudioPageShell>;
}
