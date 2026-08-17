import type { Metadata } from "next";
import { LissajousStudio } from "@/components/studio/LissajousStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Lissajous Curve Generator (Browser)", description: "Generate Lissajous figures from two perpendicular sine waves. Adjust frequency ratio and phase to morph the curves. Free.", alternates: { canonical: "/studio/lissajous" } };
export default function Page() {
  return <StudioPageShell slug="lissajous" name="Lissajous Curves" keyword="Lissajous curves"
    lede="The elegant loops you see on an oscilloscope. Combine two perpendicular oscillations and vary their frequency ratio and phase."
    about="A Lissajous figure plots x = sin(a·t + δ) against y = sin(b·t). The integer ratio a:b sets how many lobes appear, and the phase δ continuously morphs the shape. They visualize the relationship between two harmonic oscillations — used historically to measure unknown frequencies.">
    <LissajousStudio /></StudioPageShell>;
}
