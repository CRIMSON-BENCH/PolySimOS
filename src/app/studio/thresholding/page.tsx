import type { Metadata } from "next";
import { ThresholdingStudio } from "@/components/studio/ThresholdingStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Image Thresholding (Browser) — Otsu & Adaptive Segmentation", description: "Segment images in your browser: global, Otsu (auto), and adaptive local thresholding. See the histogram, the computed threshold, and foreground %. Free.", alternates: { canonical: "/studio/thresholding" } };
export default function Page() {
  return <StudioPageShell slug="thresholding" name="Image Thresholding" keyword="Otsu adaptive thresholding segmentation"
    lede="Turn a grayscale image into a clean binary mask. Compare a manual global cut, Otsu's automatic optimal threshold, and adaptive local thresholding — live."
    about="Thresholding is the simplest image segmentation: label each pixel foreground or background by comparing its intensity to a threshold. A single global threshold works only when the histogram is cleanly bimodal. Otsu's method computes the optimal global threshold automatically by choosing the value T that maximizes the between-class variance σ_b²(T)=w₀w₁(µ₀−µ₁)² — the split that best separates the two intensity populations. But under uneven illumination no single T is correct everywhere, so adaptive (local) thresholding compares each pixel to the mean of its own neighborhood instead. Switch on the 'Uneven lighting' preset to watch global and Otsu break down while adaptive holds up.">
    <ThresholdingStudio /></StudioPageShell>;
}
