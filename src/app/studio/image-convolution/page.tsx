import type { Metadata } from "next";
import { ImageConvolutionStudio } from "@/components/studio/ImageConvolutionStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Image Convolution Kernels (Browser) — Filters & Edge Detection", description: "Apply 3×3 convolution kernels — blur, sharpen, Laplacian edge, emboss, Sobel — to a test image live in your browser. See the math and the pixels. Free.", alternates: { canonical: "/studio/image-convolution" } };
export default function Page() {
  return <StudioPageShell slug="image-convolution" name="Image Convolution" keyword="image convolution kernel filter"
    lede="The operation behind every blur, sharpen, and edge detector. Slide a 3×3 kernel over an image and watch the pixels transform."
    about="Convolution replaces each pixel with a weighted sum of its neighborhood, where the weights are the kernel. Blur kernels are positive weights that sum to 1, so they average away noise while preserving brightness; edge kernels (Laplacian, Sobel) sum to 0, so flat regions cancel and only intensity changes remain. It is the core primitive of image processing and the convolutional layers in modern neural networks — try each kernel on the same test image to see exactly what its weights do.">
    <ImageConvolutionStudio /></StudioPageShell>;
}
