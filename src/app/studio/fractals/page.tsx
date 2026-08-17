import type { Metadata } from "next";
import { FractalStudio } from "@/components/studio/FractalStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Mandelbrot & Julia Fractal Explorer (Browser)", description: "Explore the Mandelbrot and Julia sets with an interactive escape-time fractal renderer. Zoom infinitely into the boundary of chaos. Free.", alternates: { canonical: "/studio/fractals" } };
export default function Page() {
  return (
    <StudioPageShell slug="fractals" name="Fractal Explorer" keyword="fractal explorer"
      lede="Zoom into the Mandelbrot and Julia sets — infinitely detailed structure born from one simple iteration, z → z² + c."
      about="Each pixel is colored by how quickly the iteration z → z² + c escapes to infinity (the escape-time algorithm). The Mandelbrot set maps the c-plane; the Julia set fixes c and maps the starting z-plane. Click to zoom into the fractal boundary, where structure repeats at every scale.">
      <FractalStudio />
    </StudioPageShell>
  );
}
