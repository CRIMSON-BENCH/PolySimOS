import type { Metadata } from "next";
import { FEA3DStudio } from "@/components/studio/FEA3DStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "3D FEA Space-Frame Simulator (Browser) | PolySim OS",
  description: "A real 3D finite-element space-frame solver in your browser. Load a tower and orbit around the deformed structure with members colored by axial force. Free.",
  alternates: { canonical: "/studio/fea-3d" },
};

export default function Page() {
  return (
    <StudioPageShell slug="fea-3d" name="3D FEA Space Frame" keyword="3D finite element analysis"
      lede="Structural analysis in three dimensions. Load a 3D tower and orbit around the deformed shape, with every member colored by whether it's in tension or compression."
      about="This extends the direct-stiffness method to 3D: each bar element has three translational degrees of freedom per node and a stiffness matrix built from its 3D direction cosines. PolySim assembles the global system, applies your supports and loads, solves for nodal displacements, and recovers axial member forces — the core of real space-frame and truss design.">
      <FEA3DStudio />
    </StudioPageShell>
  );
}
