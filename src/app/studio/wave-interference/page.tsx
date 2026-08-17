import type { Metadata } from "next";
import { WaveInterferenceStudio } from "@/components/studio/WaveInterferenceStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Wave Interference Simulator (Browser) — Ripple Tank", description: "Two-source wave interference in your browser. Adjust frequency and separation to see constructive and destructive fringes. Free.", alternates: { canonical: "/studio/wave-interference" } };
export default function Page() {
  return <StudioPageShell slug="wave-interference" name="Wave Interference" keyword="wave interference simulation"
    lede="Two point sources, one ripple tank. Watch constructive and destructive interference fringes form and shift as you tune the waves."
    about="Two sources emit circular waves whose amplitudes add at every point. Where crests meet crests you get bright constructive fringes; where crest meets trough they cancel. It's the same physics behind the double-slit experiment and diffraction gratings.">
    <WaveInterferenceStudio /></StudioPageShell>;
}
