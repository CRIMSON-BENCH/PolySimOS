import type { Metadata } from "next";
import { DLAStudio } from "@/components/studio/DLAStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Diffusion-Limited Aggregation Simulator (Browser)", description: "Grow a branching fractal by diffusion-limited aggregation — random walkers stick to a seed to form dendrites like frost and coral. Free.", alternates: { canonical: "/studio/dla" } };
export default function Page() {
  return <StudioPageShell slug="dla" name="Diffusion-Limited Aggregation" keyword="diffusion limited aggregation"
    lede="Watch a fractal grow itself. Particles wander in from the edges and freeze the instant they touch the cluster, building delicate branching dendrites."
    about="Diffusion-limited aggregation (DLA) releases particles that random-walk until they contact the growing cluster and stick. Because outer tips shield inner regions, the structure branches into a fractal with dimension ≈ 1.71 — the same process behind frost, mineral dendrites, coral, and electrical discharge patterns.">
    <DLAStudio /></StudioPageShell>;
}
