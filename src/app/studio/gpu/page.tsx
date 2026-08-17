import type { Metadata } from "next";
import { GPUParticles } from "@/components/studio/GPUParticles";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "WebGPU Particle Simulator — GPU Compute in the Browser",
  description: "Hundreds of thousands of particles simulated on your GPU with real WebGPU compute shaders, at interactive frame rates. Move your cursor to steer the swarm. Free.",
  alternates: { canonical: "/studio/gpu" },
};

export default function Page() {
  return (
    <StudioPageShell slug="gpu" name="GPU Compute (WebGPU)" keyword="GPU simulation"
      lede="Near-native speed in the browser. A WGSL compute shader updates hundreds of thousands of particles on your GPU every frame — move your cursor and the whole cloud responds."
      about="This studio runs a genuine WebGPU pipeline: particle state lives in a GPU storage buffer, a compute shader integrates attraction and swirl forces in parallel across every particle, and a render pipeline draws them with additive blending — no data round-trip to the CPU. It's the same class of GPU-compute technology behind desktop simulators, running in a browser tab. Where WebGPU isn't available, the rest of PolySim still runs on the CPU.">
      <GPUParticles />
    </StudioPageShell>
  );
}
