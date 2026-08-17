import type { Metadata } from "next";
import { MagneticPendulumStudio } from "@/components/studio/MagneticPendulumStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Magnetic Pendulum Simulator (Browser) — Fractal Basins", description: "A pendulum over three magnets: a chaotic system whose basins of attraction form a fractal. Click to drop the bob anywhere. Free.", alternates: { canonical: "/studio/magnetic-pendulum" } };
export default function Page() {
  return <StudioPageShell slug="magnetic-pendulum" name="Magnetic Pendulum" keyword="magnetic pendulum chaos"
    lede="Three magnets, one swinging bob, and pure chaos. Which magnet it settles on depends so delicately on where it starts that the map of outcomes is a fractal."
    about="The bob feels a restoring pull toward center, attraction to three magnets, and friction. Because tiny changes in the starting point can flip the final magnet, the basins of attraction interleave into an infinitely detailed fractal — a beautiful, tangible demonstration of sensitive dependence on initial conditions.">
    <MagneticPendulumStudio /></StudioPageShell>;
}
