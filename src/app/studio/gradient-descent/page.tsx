import type { Metadata } from "next";
import { GradientDescentStudio } from "@/components/studio/GradientDescentStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Gradient Descent Visualizer (Browser) — Optimization", description: "Watch gradient descent with momentum roll down loss landscapes — bowl, saddle, Rosenbrock, and ripple. Tune learning rate and momentum. Free.", alternates: { canonical: "/studio/gradient-descent" } };
export default function Page() {
  return <StudioPageShell slug="gradient-descent" name="Gradient Descent" keyword="gradient descent visualization"
    lede="The workhorse of machine learning, made visible. Watch a ball follow the gradient downhill across different loss landscapes."
    about="Gradient descent with momentum follows the negative gradient of a 2D loss surface toward a minimum. Try the Rosenbrock valley to see why optimization is hard, and push the learning rate too high to watch it overshoot and diverge — the same dynamics that govern training neural networks.">
    <GradientDescentStudio /></StudioPageShell>;
}
