import type { Metadata } from "next";
import { HistogramEqualizationStudio } from "@/components/studio/HistogramEqualizationStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Histogram Equalization (Browser) — Image Contrast Enhancement", description: "Enhance a low-contrast image in your browser. Compute the intensity histogram and CDF, then equalize, stretch, or gamma-correct — side by side. Free.", alternates: { canonical: "/studio/histogram-equalization" } };
export default function Page() {
  return <StudioPageShell slug="histogram-equalization" name="Histogram Equalization" keyword="histogram equalization contrast"
    lede="Rescue a washed-out image by reshaping its intensity distribution. Watch the histogram and cumulative curve drive real contrast enhancement, live."
    about="Histogram equalization builds the intensity histogram of an image, forms its cumulative distribution function (CDF), and uses that CDF as a transfer function s = (L-1)·CDF(r) to spread crowded intensity levels across the full 0–255 range. Compare it against a linear min–max contrast stretch and a gamma tone curve on the same low-contrast, dark, washed-out, or bimodal test image — and see why equalization boosts local detail but can amplify noise in flat regions.">
    <HistogramEqualizationStudio /></StudioPageShell>;
}
