import type { Metadata } from "next";
import { RayOpticsStudio } from "@/components/studio/RayOpticsStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Ray Optics & Lens Simulator (Browser)", description: "Trace principal rays through a converging or diverging lens to locate the image. Explore the thin-lens equation interactively. Free.", alternates: { canonical: "/studio/ray-optics" } };
export default function Page() {
  return <StudioPageShell slug="ray-optics" name="Ray Optics / Lenses" keyword="ray optics lens simulation"
    lede="See how a lens forms an image. Trace the principal rays through a converging or diverging lens and watch the image flip from real to virtual as you move the object."
    about="Using the thin-lens equation, 1/v − 1/u = 1/f, this tool traces the principal rays — parallel-then-through-focus and straight-through-center — to locate the image. Move the object inside the focal length to see a magnified, upright virtual image, or beyond it for a real, inverted one, exactly as in a physics lab.">
    <RayOpticsStudio /></StudioPageShell>;
}
