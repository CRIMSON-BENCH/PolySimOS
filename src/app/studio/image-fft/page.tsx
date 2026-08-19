import type { Metadata } from "next";
import { ImageFFTStudio } from "@/components/studio/ImageFFTStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "2D Image FFT (Browser) — Fourier Transform & Frequency Filtering", description: "Compute the 2D Fourier transform of an image in your browser, view the centered log-magnitude spectrum, and low/high/band-pass filter it live. Free.", alternates: { canonical: "/studio/image-fft" } };
export default function Page() {
  return <StudioPageShell slug="image-fft" name="2D Image FFT" keyword="2D Fourier transform image frequency"
    lede="See any image as a landscape of frequencies. Take its 2D Fourier transform, then blur, sharpen, or isolate features by masking frequencies and inverting."
    about="A real radix-2 FFT runs row-then-column to compute the 2D discrete Fourier transform of a 128×128 image. The magnitude spectrum is fftshift-centered so the DC term sits in the middle, with low frequencies near the center and high frequencies at the edges. Masking frequencies by radius — low-pass keeps the center, high-pass keeps the edges, band-pass keeps a ring — and running the inverse FFT shows how each band contributes: low frequencies carry smooth overall structure, high frequencies carry edges and detail. This is the core of image compression (JPEG), denoising, and filtering.">
    <ImageFFTStudio /></StudioPageShell>;
}
