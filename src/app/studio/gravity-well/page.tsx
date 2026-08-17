import type { Metadata } from "next";
import { GravityWellStudio } from "@/components/studio/GravityWellStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Gravity Well Simulator (Browser) — Curved Spacetime", description: "The rubber-sheet picture of gravity: a mass warps a 3D grid while a body orbits in the curved surface. Drag to orbit the view. Free.", alternates: { canonical: "/studio/gravity-well" } };
export default function Page() {
  return <StudioPageShell slug="gravity-well" name="Gravity Well" keyword="gravity well simulation"
    lede="See gravity as geometry. A central mass dents a 3D grid into a well, and a body orbits within the curved surface — the classic visualization of curved spacetime."
    about="The grid height follows a gravitational potential (∝ M/r), rendered in 3D with an orbit camera, while a test body orbits the central mass under an inverse-square force. It's an intuition-builder for how mass curves space in general relativity.">
    <GravityWellStudio /></StudioPageShell>;
}
