import type { Metadata } from "next";
import { IsingStudio } from "@/components/studio/IsingStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Ising Model Simulator (Browser) — Phase Transition", description: "A 2D Ising model with Metropolis Monte Carlo. Tune temperature through the critical point and watch magnetization vanish. Free, in-browser.", alternates: { canonical: "/studio/ising" } };
export default function Page() {
  return (
    <StudioPageShell slug="ising" name="Ising Model" keyword="Ising model simulation"
      lede="Watch a magnet lose its magnetism. Cool the lattice and spins align into domains; heat it past the critical point and order dissolves into noise."
      about="The 2D Ising model is simulated with the Metropolis Monte Carlo algorithm: spins flip with a probability set by the energy change and temperature. It exhibits a genuine phase transition at the critical temperature (≈ 2.27 J/k_B) — a cornerstone of statistical mechanics you can watch happen live.">
      <IsingStudio />
    </StudioPageShell>
  );
}
