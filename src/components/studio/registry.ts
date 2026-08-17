import type { ComponentType } from "react";
import { NodeEditor } from "./NodeEditor";
import { ParticleStudio } from "./ParticleStudio";
import { FluidStudio } from "./FluidStudio";
import { DynamicsStudio } from "./DynamicsStudio";
import { FieldStudio } from "./FieldStudio";
import { CasStudio } from "./CasStudio";
import { SurrogateStudio } from "./SurrogateStudio";
import { Studio3D } from "./Studio3D";
import { FEAStudio } from "./FEAStudio";
import { FEA3DStudio } from "./FEA3DStudio";
import { EMStudio } from "./EMStudio";
import { MDStudio } from "./MDStudio";
import { MeshStudio } from "./MeshStudio";
import { Heat3DStudio } from "./Heat3DStudio";
import { CFD3DStudio } from "./CFD3DStudio";
import { VectorFieldStudio } from "./VectorFieldStudio";
import { OptimizeStudio } from "./OptimizeStudio";
import { Notebook } from "./Notebook";
import { GPUParticles } from "./GPUParticles";
import { GPUFluid } from "./GPUFluid";
import { GPUNBody } from "./GPUNBody";
import { GPUPDE } from "./GPUPDE";
import { GPUFluid3D } from "./GPUFluid3D";
import { GPUNBodyPM } from "./GPUNBodyPM";

// Slug → studio component. Used by the /embed/[slug] chromeless route.
export const STUDIO_COMPONENTS: Record<string, ComponentType> = {
  graph: NodeEditor,
  particles: ParticleStudio,
  fluid: FluidStudio,
  dynamics: DynamicsStudio,
  fields: FieldStudio,
  cas: CasStudio,
  surrogate: SurrogateStudio,
  "3d": Studio3D,
  fea: FEAStudio,
  "fea-3d": FEA3DStudio,
  electromagnetics: EMStudio,
  "molecular-dynamics": MDStudio,
  mesh: MeshStudio,
  "heat-3d": Heat3DStudio,
  "cfd-3d": CFD3DStudio,
  "vector-field": VectorFieldStudio,
  optimize: OptimizeStudio,
  notebook: Notebook,
  gpu: GPUParticles,
  "gpu-fluid": GPUFluid,
  "gpu-nbody": GPUNBody,
  "gpu-pde": GPUPDE,
  "gpu-fluid-3d": GPUFluid3D,
  "gpu-nbody-pm": GPUNBodyPM,
};

export const STUDIO_SLUGS = Object.keys(STUDIO_COMPONENTS);
