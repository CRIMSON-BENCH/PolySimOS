import type { Metadata } from "next";
import { MatrixStudio } from "@/components/studio/MatrixStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Matrix Calculator (Browser) — Multiply, Determinant, Inverse", description: "A fast matrix calculator: multiply, add, transpose, determinant, and inverse via Gauss-Jordan elimination. Free, in-browser.", alternates: { canonical: "/studio/matrix" } };
export default function Page() {
  return (
    <StudioPageShell slug="matrix" name="Matrix Calculator" keyword="matrix calculator"
      lede="Multiply matrices, take determinants and inverses, and transpose — all in the browser, powered by a real linear-algebra engine."
      about="Operations run on PolySim's linear-algebra core: matrix multiplication, addition, transpose, determinant via LU decomposition, and inverse via Gauss-Jordan elimination with partial pivoting. Enter matrices as rows of space-separated numbers and pick an operation.">
      <MatrixStudio />
    </StudioPageShell>
  );
}
