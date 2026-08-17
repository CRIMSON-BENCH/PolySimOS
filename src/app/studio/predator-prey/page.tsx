import type { Metadata } from "next";
import { PredatorPreyStudio } from "@/components/studio/PredatorPreyStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Spatial Predator–Prey Simulator (Browser)", description: "An agent-based predator–prey ecology on a grid. Watch traveling waves of prey and predators — patterns the classic equations miss. Free.", alternates: { canonical: "/studio/predator-prey" } };
export default function Page() {
  return <StudioPageShell slug="predator-prey" name="Spatial Predator–Prey" keyword="predator prey simulation"
    lede="Predators chase prey across a landscape. Unlike the well-mixed equations, space creates chasing waves, refuges, and boom-bust patches."
    about="This agent-based model puts prey and predators on a grid: prey reproduce into empty cells, predators convert adjacent prey and starve without food. Spatial structure produces spiral and traveling waves that the classic Lotka–Volterra equations — which assume perfect mixing — cannot capture.">
    <PredatorPreyStudio /></StudioPageShell>;
}
