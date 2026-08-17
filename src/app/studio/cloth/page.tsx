import type { Metadata } from "next";
import { ClothStudio } from "@/components/studio/ClothStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Cloth & Spring-Mass Simulator (Browser)", description: "A real-time cloth simulation built from a spring-mass grid with Verlet integration and constraint relaxation. Drag it around. Free.", alternates: { canonical: "/studio/cloth" } };
export default function Page() {
  return <StudioPageShell slug="cloth" name="Cloth / Spring-Mass" keyword="cloth simulation"
    lede="Grab and swing a piece of cloth. It's a grid of masses linked by springs, pinned at the top and falling under gravity."
    about="Each node is integrated with position-based Verlet dynamics, and the distances between neighbors are corrected by several relaxation passes per frame — the standard technique behind real-time cloth and soft-body simulation in games and film.">
    <ClothStudio /></StudioPageShell>;
}
