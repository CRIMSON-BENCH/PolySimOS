import type { Metadata } from "next";
import { GPUNBodyPM } from "@/components/studio/GPUNBodyPM";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Particle-Mesh N-Body (WebGPU) — 100k+ Bodies | PolySim OS",
  description: "Gravitational N-body at massive scale in your browser: 100,000+ bodies via the GPU particle-mesh method (grid mass deposit, Poisson solve, gradient forces). Free.",
  alternates: { canonical: "/studio/gpu-nbody-pm" },
};

export default function Page() {
  return (
    <StudioPageShell slug="gpu-nbody-pm" name="Particle-Mesh N-Body" keyword="large-scale N-body simulation"
      lede="Gravity at galaxy scale — over 100,000 bodies at once. Instead of computing every pair, the particle-mesh method solves gravity on a grid, so huge N stays interactive."
      about="Each frame the GPU deposits every particle's mass onto a grid (atomic adds), solves the gravitational Poisson equation ∇²φ = ρ with Jacobi iteration, then pushes each particle along the negative potential gradient. Because the cost is O(N + G²·iterations) rather than O(N²), it scales to hundreds of thousands of bodies — the same particle-mesh approach used in cosmological structure-formation simulations.">
      <GPUNBodyPM />
    </StudioPageShell>
  );
}
