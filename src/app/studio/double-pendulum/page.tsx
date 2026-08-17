import type { Metadata } from "next";
import { DoublePendulumStudio } from "@/components/studio/DoublePendulumStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Double Pendulum Simulator (Browser) — Chaos", description: "A real double-pendulum simulator with exact equations of motion and RK4 integration. Watch deterministic chaos unfold. Free, in-browser.", alternates: { canonical: "/studio/double-pendulum" } };
export default function Page() {
  return (
    <StudioPageShell slug="double-pendulum" name="Double Pendulum" keyword="double pendulum simulation"
      lede="Two linked pendulums, one chaotic dance. A tiny nudge to the start sends the motion somewhere completely different."
      about="The double pendulum's exact nonlinear equations of motion are integrated with a fourth-order Runge–Kutta scheme. It is the classic demonstration of deterministic chaos: fully determined by its equations, yet practically unpredictable because infinitesimal differences in initial conditions grow exponentially.">
      <DoublePendulumStudio />
    </StudioPageShell>
  );
}
