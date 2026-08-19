import type { Metadata } from "next";
import { ZTransformStudio } from "@/components/studio/ZTransformStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Z-Transform Pole-Zero Explorer (Browser) — Digital Filters", description: "Drag poles and zeros on the z-plane and watch a digital filter's magnitude, phase, and impulse response update live. Check stability instantly. Free.", alternates: { canonical: "/studio/z-transform" } };
export default function Page() {
  return <StudioPageShell slug="z-transform" name="Z-Transform" keyword="z-transform pole zero digital filter"
    lede="Design digital filters by hand. Drag poles and zeros around the z-plane and watch the frequency response, phase, and impulse response react in real time."
    about="The z-transform maps a digital filter to its poles and zeros in the complex z-plane, and the transfer function H(z)=∏(z−z_i)/∏(z−p_i) follows directly from their positions. Poles pull the magnitude response up into resonant peaks; zeros push it down into nulls. Evaluating H on the unit circle z=e^{jω} gives the frequency response you hear. The filter is stable only while every pole lies strictly inside the unit circle — drag one outside and the impulse response blows up. Try the low-pass, high-pass, notch, resonator, and Butterworth-ish presets, then move a pole toward the circle to sharpen its resonant peak.">
    <ZTransformStudio /></StudioPageShell>;
}
