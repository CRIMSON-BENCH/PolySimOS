import type { Metadata } from "next";
import { LinearTransformStudio } from "@/components/studio/LinearTransformStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "2D Linear Transformation Visualizer (Browser) — Linear Algebra", description: "See how a 2×2 matrix warps the plane: transformed grid, unit square, and unit circle, with live determinant, trace, and real eigenvectors. Free.", alternates: { canonical: "/studio/linear-transform" } };
export default function Page() {
  return <StudioPageShell slug="linear-transform" name="Linear Transformation" keyword="2D linear transformation matrix"
    lede="See a 2×2 matrix as geometry. Drag the entries and watch the plane stretch, rotate, shear, and flip — with eigenvectors and determinant drawn live."
    about="Every 2×2 matrix [[a, b], [c, d]] is a linear transformation of the plane: it sends the basis vectors î and ĵ to new positions and drags the whole grid with them. This studio maps the unit square to a parallelogram (whose signed area is the determinant), the unit circle to an ellipse, and — when the eigenvalues of λ² − (a+d)λ + (ad−bc) = 0 are real — draws the invariant eigenvector directions the transform only scales. A determinant above 1 expands area, between 0 and 1 shrinks it, below 0 flips orientation, and exactly 0 collapses the plane onto a line.">
    <LinearTransformStudio /></StudioPageShell>;
}
