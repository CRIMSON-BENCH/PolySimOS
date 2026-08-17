import type { Metadata } from "next";
import { BoidsStudio } from "@/components/studio/BoidsStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Boids Flocking Simulator (Browser) — Emergent Behavior", description: "Watch lifelike flocking emerge from three simple rules — alignment, cohesion, separation. Tune each and see the flock respond. Free.", alternates: { canonical: "/studio/boids" } };
export default function Page() {
  return <StudioPageShell slug="boids" name="Boids Flocking" keyword="boids flocking simulation"
    lede="No leader, no plan — just three local rules per bird, and a whole flock comes alive. Tune alignment, cohesion, and separation."
    about="Craig Reynolds' boids model gives each agent three steering rules based only on nearby neighbors: align with their heading, steer toward their center, and avoid crowding. From these local rules, global flocking emerges — a landmark example of self-organization and swarm intelligence.">
    <BoidsStudio /></StudioPageShell>;
}
