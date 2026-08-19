import type { Metadata } from "next";
import { MatrixEliminationStudio } from "@/components/studio/MatrixEliminationStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Gaussian Elimination & LU Decomposition (Browser) — Linear Algebra", description: "Step through real Gaussian elimination with partial pivoting. Watch L, U, and the permutation P build up, with pivots, row swaps, and det(A). Free.", alternates: { canonical: "/studio/matrix-elimination" } };
export default function Page() {
  return <StudioPageShell slug="matrix-elimination" name="Gaussian Elimination" keyword="Gaussian elimination LU decomposition"
    lede="Watch a 4×4 matrix reduce to upper-triangular form one row operation at a time — the algorithm behind every linear solve, factorization, and determinant."
    about="Gaussian elimination with partial pivoting factors a matrix as PA = LU: the permutation P records the row swaps that keep the pivot as large as possible (crucial for numerical stability), the multipliers fill the unit-lower-triangular L, and the reduced rows become the upper-triangular U. Step through each swap and row operation, watch the active pivot highlighted in cyan, and see the determinant emerge as the signed product of U's diagonal. A zero pivot with nothing to swap in signals a singular matrix — no unique factorization, no inverse, det(A) = 0.">
    <MatrixEliminationStudio /></StudioPageShell>;
}
