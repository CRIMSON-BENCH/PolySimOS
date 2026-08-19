import type { Metadata } from "next";
import { ODEMethodsStudio } from "@/components/studio/ODEMethodsStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "ODE Solver Methods — Euler vs Heun vs RK4 (Free, Browser)", description: "Compare Euler, Heun (RK2), and RK4 integrating an ODE against its analytic solution. Tune step size, watch Euler diverge, and see why RK4 wins. Free.", alternates: { canonical: "/studio/ode-methods" } };
export default function Page() {
  return <StudioPageShell slug="ode-methods" name="ODE Solver Methods" keyword="Euler RK4 ODE solver comparison"
    lede="Watch Euler, Heun (RK2), and RK4 race the true solution of an ODE. Push the step size and see which methods keep up — and which fall apart."
    about="Each method advances dy/dx = f(x, y) forward in fixed steps of size h, but they differ in how they estimate the slope over each step. Euler uses one slope evaluation (O(h) global error), Heun averages two (O(h²)), and RK4 blends four (O(h⁴)). Overlaid against the known analytic solution, the gap is obvious: at large h Euler drifts or — on a stiff ODE — blows up entirely, while RK4 stays glued to the true curve. Halving the step cuts Euler's error roughly 2×, Heun's 4×, and RK4's 16×, the payoff of higher-order accuracy that makes RK4 the workhorse of numerical ODE solving.">
    <ODEMethodsStudio /></StudioPageShell>;
}
