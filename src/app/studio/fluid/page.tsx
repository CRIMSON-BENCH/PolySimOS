import type { Metadata } from "next";
import { FluidStudio } from "@/components/studio/FluidStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "2D Fluid Simulator (Browser CFD) — Real-Time Navier–Stokes",
  description:
    "An interactive 2D computational-fluid-dynamics (CFD) simulator in your browser. Drag to inject dye and velocity into a real incompressible Navier–Stokes solver. Free, no install.",
  alternates: { canonical: "/studio/fluid" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="fluid"
      name="2D Fluid Simulator (CFD)"
      lede="Stir a real fluid in your browser. Click and drag to inject dye and momentum into an incompressible Navier–Stokes field and watch vortices, mixing, and turbulence emerge."
      about="This solver implements Jos Stam's Stable Fluids method: semi-Lagrangian advection for unconditional stability, Gauss–Seidel diffusion for viscosity, and a Jacobi pressure-projection step that enforces incompressibility (a divergence-free velocity field). It's the same algorithm family behind film-VFX fluids and browser CFD demos, running live on a grid on your device."
      keyword="fluid simulation"
    >
      <FluidStudio />
    </StudioPageShell>
  );
}
