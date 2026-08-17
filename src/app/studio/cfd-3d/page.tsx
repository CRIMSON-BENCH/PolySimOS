import type { Metadata } from "next";
import { CFD3DStudio } from "@/components/studio/CFD3DStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "3D CFD Simulator (Browser) — 3D Navier–Stokes",
  description: "A real 3D computational-fluid-dynamics simulator in your browser: a dye plume rising through incompressible 3D flow, with scrubbable z-slices. Free, no install.",
  alternates: { canonical: "/studio/cfd-3d" },
};

export default function Page() {
  return (
    <StudioPageShell slug="cfd-3d" name="3D CFD" keyword="3D CFD simulation"
      lede="Fluid dynamics in three dimensions. A dye plume rises and rolls through a fully 3D incompressible flow — scrub through z-slices to see inside the volume."
      about="This extends Jos Stam's Stable Fluids method to a full 3D grid: three velocity components and dye density are diffused, advected with a 3D semi-Lagrangian scheme, and made incompressible by a Jacobi pressure-projection step that enforces a divergence-free field. It's genuine 3D Navier–Stokes, running on your device — the kind of volumetric CFD that normally needs a workstation.">
      <CFD3DStudio />
    </StudioPageShell>
  );
}
