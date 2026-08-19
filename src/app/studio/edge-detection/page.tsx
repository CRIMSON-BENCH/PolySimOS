import type { Metadata } from "next";
import { EdgeDetectionStudio } from "@/components/studio/EdgeDetectionStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Edge Detection (Sobel, Prewitt, Canny) — Browser Image Processing", description: "Run Sobel, Prewitt, and the full Canny pipeline on a test image, live in your browser. Tune Gaussian blur and hysteresis thresholds. Free.", alternates: { canonical: "/studio/edge-detection" } };
export default function Page() {
  return <StudioPageShell slug="edge-detection" name="Edge Detection" keyword="Sobel Canny edge detection"
    lede="Classic edge detectors made visible. Compare Sobel, Prewitt, and the full Canny pipeline on a procedural test image — no upload, no install."
    about="Edge detection finds where image brightness changes sharply. Sobel and Prewitt convolve the image with 3×3 derivative kernels and report the gradient magnitude √(Gx²+Gy²) — bright where intensity jumps. Canny goes further: it blurs with a Gaussian to suppress noise, computes Sobel gradients, thins the ridges to single-pixel edges with non-maximum suppression, then applies a double threshold plus hysteresis so faint-but-connected contours survive while isolated noise is dropped. Slide the σ and low/high thresholds to see the classic accuracy-vs-noise trade-off, and step through each Canny stage.">
    <EdgeDetectionStudio /></StudioPageShell>;
}
