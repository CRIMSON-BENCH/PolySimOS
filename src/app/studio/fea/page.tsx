import type { Metadata } from "next";
import { FEAStudio } from "@/components/studio/FEAStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "FEA Truss Simulator (Browser) — Stress & Deflection",
  description: "A real finite-element truss solver in your browser: apply a load and see member forces (tension/compression) and the deformed shape. Direct stiffness method. Free.",
  alternates: { canonical: "/studio/fea" },
};

export default function Page() {
  return (
    <StudioPageShell slug="fea" name="FEA Truss Simulator" keyword="finite element analysis"
      lede="Load a truss and watch it deform. Members turn blue in tension and pink in compression, scaled by how hard they're working."
      about="This is the direct-stiffness method used in real structural FEA. Each bar contributes a stiffness matrix in global coordinates; PolySim assembles the global system, applies your supports and loads, and solves the linear system for nodal displacements — then back-computes axial force in every member. The displayed shape is the true (scaled) deformed geometry.">
      <FEAStudio />
    </StudioPageShell>
  );
}
