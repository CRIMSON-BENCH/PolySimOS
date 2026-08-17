import type { Metadata } from "next";
import { GPUFluid } from "@/components/studio/GPUFluid";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "WebGPU Fluid Simulator — GPU Smoke in the Browser",
  description: "A high-resolution fluid/smoke field advected entirely on your GPU with WebGPU compute shaders. Drag to inject smoke into the flow. Free.",
  alternates: { canonical: "/studio/gpu-fluid" },
};

export default function Page() {
  return (
    <StudioPageShell slug="gpu-fluid" name="WebGPU Fluid" keyword="GPU fluid simulation"
      lede="Stir a high-resolution smoke field that lives entirely on your GPU. A compute shader advects density through a swirling velocity field every frame — drag to add more."
      about="Each cell of a 256×256 density field is updated by a WGSL compute shader that traces the flow backward in time (semi-Lagrangian advection) and samples the previous frame with bilinear interpolation, then a fullscreen fragment shader renders it — a full GPU compute+render loop with ping-pong storage buffers. This is the browser doing the kind of grid simulation that used to require a desktop and a dedicated GPU toolkit.">
      <GPUFluid />
    </StudioPageShell>
  );
}
