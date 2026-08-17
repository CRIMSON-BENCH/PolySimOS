import type { Metadata } from "next";
import { PercolationStudio } from "@/components/studio/PercolationStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Percolation Simulator (Browser) — Phase Transition", description: "Explore site percolation: increase the open probability and watch a spanning cluster suddenly appear near the critical threshold. Free.", alternates: { canonical: "/studio/percolation" } };
export default function Page() {
  return <StudioPageShell slug="percolation" name="Percolation" keyword="percolation simulation"
    lede="When does a maze suddenly become passable? Raise the fraction of open cells and watch a connected path snap into existence at the critical threshold."
    about="In site percolation each cell is open with probability p. Fluid poured on top flows through connected open cells. Below the critical probability (≈ 0.593 for a square lattice) it never reaches the bottom; above it, a spanning cluster appears almost surely — a sharp phase transition central to materials science and network theory.">
    <PercolationStudio /></StudioPageShell>;
}
