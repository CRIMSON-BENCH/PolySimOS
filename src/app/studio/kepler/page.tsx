import type { Metadata } from "next";
import { KeplerStudio } from "@/components/studio/KeplerStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Kepler Orbit Simulator (Browser) — Elliptical Orbits", description: "Simulate two-body gravitational orbits and Kepler's laws. Set eccentricity to trace circles, ellipses, and escape hyperbolas. Free.", alternates: { canonical: "/studio/kepler" } };
export default function Page() {
  return <StudioPageShell slug="kepler" name="Kepler Orbits" keyword="orbital mechanics simulation"
    lede="Trace the shapes of gravity. Adjust the eccentricity to move between a circular orbit, an ellipse, and an escape trajectory — with the star at the focus."
    about="A test body moves under an inverse-square gravitational pull toward a central star placed at the focus. The initial speed is set from the eccentricity so the orbit closes into the conic sections Kepler described: circle, ellipse, parabola, and hyperbola.">
    <KeplerStudio /></StudioPageShell>;
}
