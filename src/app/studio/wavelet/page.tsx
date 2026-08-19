import type { Metadata } from "next";
import { WaveletStudio } from "@/components/studio/WaveletStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Wavelet Transform (Browser) — Multiresolution & Denoising", description: "Run a real Haar / Daubechies DWT in your browser: multi-level decomposition, a live scalogram, and wavelet threshold denoising. Free.", alternates: { canonical: "/studio/wavelet" } };
export default function Page() {
  return <StudioPageShell slug="wavelet" name="Wavelet Transform" keyword="wavelet transform multiresolution"
    lede="See a signal split into scales. A real discrete wavelet transform decomposes, denoises by thresholding detail coefficients, and reconstructs — all live in your browser."
    about="The discrete wavelet transform (DWT) runs a signal through a filter bank: a low-pass and high-pass filter followed by downsampling, repeated on the approximation to build the Mallat pyramid. Unlike the Fourier transform, wavelets localize in BOTH time and frequency, so a sharp edge shows up as a few large coefficients at a specific place and scale rather than being smeared across every frequency. This studio implements Haar and Daubechies-4 with periodic boundaries (the transform roundtrips to machine precision). Thresholding the detail coefficients — soft or hard — zeroes the many small coefficients that noise produces while keeping the few large ones that encode real edges, then the inverse DWT reconstructs a denoised signal. The scalogram shows coefficient magnitude across scale and position, so you can watch the multiresolution time-frequency tiling directly.">
    <WaveletStudio /></StudioPageShell>;
}
