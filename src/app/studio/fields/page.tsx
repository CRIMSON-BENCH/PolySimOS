import type { Metadata } from "next";
import { FieldStudio } from "@/components/studio/FieldStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Heat & Wave Equation Simulator (Browser PDE)",
  description:
    "Solve the 2D heat equation and the 1D wave equation live in your browser with explicit finite differences. Click to add heat or pluck the string. Free, no install.",
  alternates: { canonical: "/studio/fields" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="fields"
      name="Heat & Wave Fields"
      lede="Two of the most important PDEs in physics, solved live: diffuse heat across a 2D plate, or send waves down a string. Interact directly with the field."
      about="The heat equation is solved with an explicit finite-difference scheme on a 2D grid, stable while the diffusivity stays within the CFL limit. The wave equation uses a second-order-in-time explicit stencil with light damping. Both run entirely on your device — click to inject heat or pluck the string and watch the PDE respond."
      keyword="PDE simulation"
    >
      <FieldStudio />
    </StudioPageShell>
  );
}
