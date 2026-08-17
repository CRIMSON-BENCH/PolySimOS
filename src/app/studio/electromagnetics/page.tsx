import type { Metadata } from "next";
import { EMStudio } from "@/components/studio/EMStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Electrostatics Simulator (Browser) — Fields & Potential",
  description: "Place point charges and see the electric potential heatmap and field lines update live. A real 2D electrostatics simulator in your browser. Free.",
  alternates: { canonical: "/studio/electromagnetics" },
};

export default function Page() {
  return (
    <StudioPageShell slug="electromagnetics" name="Electrostatics Simulator" keyword="electromagnetics simulation"
      lede="Build a charge configuration and watch the electric potential and field lines emerge. Click to add positive or negative charges."
      about="The field is computed by superposition: every point charge contributes a 1/r potential and a 1/r² field, summed across the grid. The heatmap shows potential (red positive, blue negative) and the white curves are field lines traced by integrating along the electric field from each positive charge — the same physics behind capacitor and sensor design.">
      <EMStudio />
    </StudioPageShell>
  );
}
