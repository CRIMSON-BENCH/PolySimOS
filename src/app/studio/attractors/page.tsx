import type { Metadata } from "next";
import { AttractorStudio } from "@/components/studio/AttractorStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Strange Attractor Gallery (3D, Browser) — Lorenz, Rössler & More", description: "Explore five famous strange attractors in interactive 3D: Lorenz, Rössler, Thomas, Aizawa, and Halvorsen. Drag to orbit. Free.", alternates: { canonical: "/studio/attractors" } };
export default function Page() {
  return <StudioPageShell slug="attractors" name="Strange Attractor Gallery" keyword="strange attractor"
    lede="Five iconic strange attractors, rendered in 3D. Each is a chaotic system whose trajectory never repeats yet stays forever bounded."
    about="Each attractor is a set of three coupled ODEs integrated to trace a single never-repeating trajectory, drawn in 3D with an orbit camera. From the Lorenz butterfly to the Aizawa torus, these are the geometric fingerprints of deterministic chaos.">
    <AttractorStudio /></StudioPageShell>;
}
