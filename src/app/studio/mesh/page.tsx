import type { Metadata } from "next";
import { MeshStudio } from "@/components/studio/MeshStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Meshing & Boundary Conditions — Steady Heat Solver",
  description: "Paint boundary conditions onto a meshed domain and solve steady-state heat conduction (Laplace's equation) live in your browser. Free, no install.",
  alternates: { canonical: "/studio/mesh" },
};

export default function Page() {
  return (
    <StudioPageShell slug="mesh" name="Meshing + Boundary Conditions" keyword="finite element meshing"
      lede="Set up a heat-conduction problem the way an engineer does: paint hot and cold boundary conditions and insulating walls onto the domain, then watch it relax to steady state."
      about="The domain is discretized into a grid of cells. Cells you mark hot or cold become Dirichlet boundary conditions; walls are excluded from the solve. The steady-state temperature field is found by Gauss-Seidel relaxation of Laplace's equation (∇²u = 0) until the residual converges — the foundation of finite-element and finite-difference heat analysis.">
      <MeshStudio />
    </StudioPageShell>
  );
}
