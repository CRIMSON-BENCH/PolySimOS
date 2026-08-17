import type { Metadata } from "next";
import { Heat3DStudio } from "@/components/studio/Heat3DStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "3D Heat Diffusion Simulator (Browser)",
  description: "Solve the 3D heat equation on a volumetric grid in your browser. Orbit the hot-voxel cloud or scrub through z-slices. Free, no install.",
  alternates: { canonical: "/studio/heat-3d" },
};

export default function Page() {
  return (
    <StudioPageShell slug="heat-3d" name="3D Heat Diffusion" keyword="3D heat simulation"
      lede="Heat diffusing through a solid volume, in three dimensions. Orbit the glowing hot region or step through cross-sectional slices."
      about="The temperature field lives on a full 3D grid and evolves by an explicit finite-difference discretization of the 3D heat equation (∂u/∂t = α∇³u), summing the six-neighbour Laplacian each step. You can render it as a projected cloud of hot voxels with an orbit camera, or inspect any horizontal z-slice — the two ways engineers read volumetric thermal results.">
      <Heat3DStudio />
    </StudioPageShell>
  );
}
