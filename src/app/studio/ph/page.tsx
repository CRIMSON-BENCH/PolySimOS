import type { Metadata } from "next";
import { PHStudio } from "@/components/studio/PHStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "pH Calculator & Scale (Browser)", description: "Calculate pH and pOH from concentration and see where a solution sits on the pH scale. Free, interactive chemistry.", alternates: { canonical: "/studio/ph" } };
export default function Page() { return <StudioPageShell slug="ph" name="pH & pOH Calculator" keyword="pH calculator" lede="pH is the logarithm of hydrogen-ion concentration. Slide the concentration and see the pH, pOH, and where the solution lands on the color scale." about="pH = -log[H+], so every unit is a tenfold change in acidity. This calculator converts between concentration, pH, and pOH and places the result on the familiar 0-14 scale, the everyday language of chemistry, biology, and medicine."><PHStudio /></StudioPageShell>; }
