import type { Metadata } from "next";
import { NewtonStudio } from "@/components/studio/NewtonStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Newton's Method Visualizer (Browser) — Root Finding", description: "See Newton's method converge on a root, tangent line by tangent line. Enter any function and starting point. Free.", alternates: { canonical: "/studio/newton" } };
export default function Page() {
  return <StudioPageShell slug="newton" name="Newton's Method" keyword="Newton's method"
    lede="Root-finding you can see. Newton's method slides down each tangent line to the x-axis and lands closer to a root every step."
    about="Given f(x), Newton's method iterates x → x − f(x)/f′(x). PolySim's CAS computes the derivative symbolically, and each tangent step is drawn so you can watch the quadratic convergence — and see how a bad starting guess can send it astray.">
    <NewtonStudio /></StudioPageShell>;
}
