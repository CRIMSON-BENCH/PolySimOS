import type { Metadata } from "next";
import { MDStudio } from "@/components/studio/MDStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Molecular Dynamics Simulator (Browser) — Lennard-Jones | PolySim OS",
  description: "A real 2D molecular-dynamics simulator with a Lennard-Jones potential and velocity-Verlet integration. Heat it up and watch the lattice melt. Free, in-browser.",
  alternates: { canonical: "/studio/molecular-dynamics" },
};

export default function Page() {
  return (
    <StudioPageShell slug="molecular-dynamics" name="Molecular Dynamics Simulator" keyword="molecular dynamics"
      lede="Atoms attract and repel through a Lennard-Jones potential. Raise the temperature and watch an ordered lattice melt into a liquid, then a gas."
      about="Each pair of atoms interacts via the Lennard-Jones 12-6 potential, integrated with velocity-Verlet in a periodic box using the minimum-image convention. A velocity-rescaling thermostat holds the target temperature. This is the same method used to study diffusion, phase transitions, and material properties from first principles.">
      <MDStudio />
    </StudioPageShell>
  );
}
