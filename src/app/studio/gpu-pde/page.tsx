import type { Metadata } from "next";
import { GPUPDE } from "@/components/studio/GPUPDE";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "GPU PDE Solver (WebGPU) — Steady Heat & Poisson | PolySim OS",
  description: "Solve a partial differential equation on your GPU: steady-state heat/Poisson via Jacobi iteration across a high-resolution grid. Paint sources and watch it converge. Free.",
  alternates: { canonical: "/studio/gpu-pde" },
};

export default function Page() {
  return (
    <StudioPageShell slug="gpu-pde" name="GPU PDE Solver" keyword="GPU PDE solver"
      lede="Watch a partial differential equation solve itself on your GPU. Paint hot and cold sources and the steady-state field converges via thousands of Jacobi sweeps per second."
      about="This is the linear-solve core of finite-element and finite-difference analysis, run entirely on the GPU. A WGSL compute shader performs Jacobi relaxation of Laplace's equation across a 384×384 grid — tens of Jacobi sweeps every frame — with Dirichlet boundary conditions you paint interactively. The same matrix-free GPU approach scales to the large linear systems behind real CFD and structural solvers.">
      <GPUPDE />
    </StudioPageShell>
  );
}
