import type { Metadata } from "next";
import { GPUFluid3D } from "@/components/studio/GPUFluid3D";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "GPU 3D Volumetric Fluid (WebGPU) — Raymarched Smoke",
  description: "A 3D smoke volume simulated and volume-raymarched entirely on your GPU with WebGPU. Drag to orbit the camera around the flow. Free, in-browser.",
  alternates: { canonical: "/studio/gpu-fluid-3d" },
};

export default function Page() {
  return (
    <StudioPageShell slug="gpu-fluid-3d" name="GPU 3D Fluid" keyword="3D GPU fluid simulation"
      lede="A full 3D smoke volume, simulated and rendered on your GPU. A compute shader advects a 64³ density field while a raymarching shader draws it — orbit the camera to see it from any angle."
      about="Two GPU stages run every frame: a WGSL compute shader advects a 64³ (262,144-voxel) density field through a swirling velocity field, and a fragment shader casts a ray through the volume for every pixel, accumulating density front-to-back to render volumetric smoke with an orbit camera. This is real-time GPU volume simulation and rendering together — the kind of thing that normally needs a native graphics toolkit.">
      <GPUFluid3D />
    </StudioPageShell>
  );
}
