import type { Metadata } from "next";
import { DynamicsStudio } from "@/components/studio/DynamicsStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Dynamical Systems Simulator — Lorenz, SIR, Pendulum, Reaction–Diffusion",
  description:
    "Explore ODE and PDE systems live in your browser: the Lorenz attractor, SIR epidemic model, damped-driven pendulum, predator–prey, Van der Pol, and Gray–Scott reaction–diffusion. Free.",
  alternates: { canonical: "/studio/dynamics" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="dynamics"
      name="Dynamical Systems Simulator"
      lede="Integrate classic ODE and PDE systems in real time — chaos, epidemics, oscillators, ecosystems, and Turing patterns — and see how parameters reshape the dynamics."
      about="Ordinary differential equations are integrated with a fixed-step fourth-order Runge–Kutta (RK4) scheme; the Gray–Scott reaction–diffusion system uses an explicit finite-difference Laplacian on a periodic grid. Each system exposes its real parameters, so you can drive a pendulum into chaos, tune an epidemic's R₀, or move Gray–Scott between spots, stripes, and mazes."
      keyword="dynamical systems simulation"
    >
      <DynamicsStudio />
    </StudioPageShell>
  );
}
