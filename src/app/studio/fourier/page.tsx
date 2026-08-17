import type { Metadata } from "next";
import { FourierStudio } from "@/components/studio/FourierStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Fourier Series Builder (Browser) — Synthesize Waves", description: "Build square, sawtooth, and triangle waves from sine harmonics and watch the Fourier series converge. Interactive and free.", alternates: { canonical: "/studio/fourier" } };
export default function Page() {
  return (
    <StudioPageShell slug="fourier" name="Fourier Series Builder" keyword="Fourier series"
      lede="Add up sine waves and watch them become a square, sawtooth, or triangle wave. This is the Fourier series, built by hand."
      about="Any periodic wave can be written as a sum of sinusoids. This tool adds harmonics one at a time so you can see the partial sums converge to the target wave — and watch the Gibbs phenomenon ring near the discontinuities of a square wave.">
      <FourierStudio />
    </StudioPageShell>
  );
}
