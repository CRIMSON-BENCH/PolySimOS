import type { Metadata } from "next";
import { GPUNBody } from "@/components/studio/GPUNBody";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "GPU N-Body Simulator (WebGPU) — Thousands of Bodies",
  description: "Thousands of mutually-attracting bodies, with every pairwise gravitational force computed on your GPU using workgroup tiling. Real O(n²) N-body in the browser.",
  alternates: { canonical: "/studio/gpu-nbody" },
};

export default function Page() {
  return (
    <StudioPageShell slug="gpu-nbody" name="GPU N-Body" keyword="GPU N-body simulation"
      lede="A galaxy of thousands of bodies, each pulling on every other. The full O(n²) gravitational interaction runs on your GPU — millions of force calculations per frame."
      about="The compute shader uses workgroup-shared-memory tiling: each tile of body positions is cooperatively loaded into fast on-chip memory, then every thread accumulates gravitational acceleration from that tile before moving to the next. This is the standard GPU N-body pattern, and it lets a browser tab compute millions of pairwise forces per frame — well beyond what the CPU N-body studios can reach.">
      <GPUNBody />
    </StudioPageShell>
  );
}
