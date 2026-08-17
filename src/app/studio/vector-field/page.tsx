import type { Metadata } from "next";
import { VectorFieldStudio } from "@/components/studio/VectorFieldStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Vector Field Visualizer (Browser) — Plot F(x,y) | PolySim OS",
  description: "Type any two-component vector field F(x,y) = (u, v) and see it plotted as a live quiver diagram. Rotation, source, saddle, spiral presets. Free.",
  alternates: { canonical: "/studio/vector-field" },
};

export default function Page() {
  return (
    <StudioPageShell slug="vector-field" name="Vector Field Visualizer" keyword="vector field visualization"
      lede="Enter the two components of a vector field and see it come alive as a quiver plot, colored and scaled by magnitude. Explore rotations, sources, saddles, and spirals."
      about="Both components are parsed by PolySim's symbolic engine and evaluated across a grid of (x, y) points. Each arrow points along the field direction and is scaled and colored by magnitude — the standard way to visualize flow fields, force fields, and the phase space of 2D dynamical systems.">
      <VectorFieldStudio />
    </StudioPageShell>
  );
}
