import type { Metadata } from "next";
import { BeatsStudio } from "@/components/studio/BeatsStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Beats & Wave Superposition Simulator (Browser)", description: "Add two close-frequency tones and watch the beat envelope throb at their difference frequency. Free.", alternates: { canonical: "/studio/beats" } };
export default function Page() { return <StudioPageShell slug="beats" name="Beats & Superposition" keyword="acoustic beats" lede="Two tones nearly in tune add up to a wave that swells and fades — the beats a musician listens for when tuning an instrument." about="When two waves of slightly different frequency superpose, their sum is modulated by an envelope that oscillates at the difference of the two frequencies. This beating is used to tune instruments and to detect tiny frequency differences with great precision."><BeatsStudio /></StudioPageShell>; }
