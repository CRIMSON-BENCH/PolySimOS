import type { Metadata } from "next";
import { ParticleStudio } from "@/components/studio/ParticleStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Particle & N-Body Simulator (Browser) — Gravity, Orbits, Collisions",
  description:
    "A real-time particle and N-body physics simulator that runs in your browser. Simulate gravity, orbital mechanics, and elastic collisions with a symplectic integrator. Free, no install.",
  alternates: { canonical: "/studio/particles" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="particles"
      name="Particle / N-Body Simulator"
      lede="Simulate gravity, orbital mechanics, and impulse-based collisions in real time. Switch between an orbital system and a colliding gas, and watch kinetic energy evolve."
      about="This engine integrates Newtonian mechanics with a semi-implicit (symplectic) Euler scheme and resolves circle–circle collisions with impulse-based response and positional correction. Pairwise gravity uses softening to avoid singularities, so orbits stay stable over long runs."
      keyword="particle simulation"
    >
      <ParticleStudio />
    </StudioPageShell>
  );
}
