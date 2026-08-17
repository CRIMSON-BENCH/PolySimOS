import type { Metadata } from "next";
import { CellularAutomataStudio } from "@/components/studio/CellularAutomataStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Cellular Automata Simulator — Rule 30, 110 & Conway's Life", description: "Explore elementary cellular automata (all 256 Wolfram rules) and Conway's Game of Life in your browser. Free, interactive.", alternates: { canonical: "/studio/cellular-automata" } };
export default function Page() {
  return <StudioPageShell slug="cellular-automata" name="Cellular Automata" keyword="cellular automata"
    lede="Simple local rules, astonishing global behavior. Explore every elementary Wolfram rule and Conway's Game of Life."
    about="Cellular automata update each cell from its neighbors by a fixed rule. Elementary automata (256 rules) range from trivial to chaotic (Rule 30) to Turing-complete (Rule 110); Conway's Game of Life produces gliders and self-replicating structures from just four rules — landmark examples of emergent complexity.">
    <CellularAutomataStudio /></StudioPageShell>;
}
