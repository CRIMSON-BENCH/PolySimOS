import type { Metadata } from "next";
import { TaylorStudio } from "@/components/studio/TaylorStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Taylor Series Visualizer (Browser) — Polynomial Approximation", description: "See how a Taylor series approximates any function. Adjust the order and center and watch the polynomial hug the curve. Free.", alternates: { canonical: "/studio/taylor" } };
export default function Page() {
  return <StudioPageShell slug="taylor" name="Taylor Series Visualizer" keyword="Taylor series"
    lede="Watch a polynomial grow to fit a curve. Increase the order and the Taylor series hugs your function ever more closely around the center."
    about="The Taylor series builds a polynomial from a function's derivatives at a single point. This tool computes those derivatives symbolically with PolySim's CAS, then plots the approximation against the true function — so you can see convergence, and where it breaks down far from the center.">
    <TaylorStudio /></StudioPageShell>;
}
