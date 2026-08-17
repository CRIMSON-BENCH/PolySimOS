import type { Metadata } from "next";
import { Surface3DStudio } from "@/components/studio/Surface3DStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "3D Surface Plotter (Browser) — z = f(x, y)", description: "Plot any two-variable function z = f(x, y) as an interactive 3D wireframe surface. Drag to orbit. Free, in-browser.", alternates: { canonical: "/studio/surface-3d" } };
export default function Page() {
  return (
    <StudioPageShell slug="surface-3d" name="3D Surface Plotter" keyword="3D function plotter"
      lede="Type a function of two variables and see it as a 3D surface you can orbit — from saddles to ripples to Gaussians."
      about="The expression z = f(x, y) is parsed by PolySim's symbolic engine and evaluated across a grid, then drawn as a depth-sorted wireframe with a perspective orbit camera. It's the fastest way to build intuition for multivariable functions, gradients, and critical points.">
      <Surface3DStudio />
    </StudioPageShell>
  );
}
