import type { Metadata } from "next";
import { FabricateStudio } from "@/components/studio/FabricateStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Fabricate — Design → DXF / STL / Bill of Materials | PolySim OS",
  description:
    "Design a parametric plate or bracket and export the exact files to make it: DXF for laser/CNC/waterjet, STL for 3D printing, and a bill of materials with fastener specs and supplier links. Turn a simulation into a real, orderable part.",
  alternates: { canonical: "/studio/fabricate" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="fabricate"
      name="Fabricate"
      keyword="design to DXF STL bill of materials"
      lede="Turn a design into a real, orderable part: set the dimensions and hole pattern, then export the exact DXF (laser/CNC), STL (3D print), and a bill of materials with fasteners."
      about="Fabricate closes the last gap between simulation and a physical object. Design a parametric plate or mounting bracket — width, height, thickness, hole diameter, and layout — and export production-ready files: a DXF with exact geometry and circular holes for laser cutting, CNC, or waterjet; a watertight STL to 3D-print; and a bill of materials listing the stock (with estimated mass and cost by material) plus correctly-sized bolts, nuts, and washers with supplier search links. It's a prototyping aid — always verify fit and load with real testing before relying on a part."
    >
      <FabricateStudio />
    </StudioPageShell>
  );
}
