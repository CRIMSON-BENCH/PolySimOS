import type { Metadata } from "next";
import { RandomWalkStudio } from "@/components/studio/RandomWalkStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Random Walk & Diffusion Simulator (Browser)", description: "Watch hundreds of random walkers spread from a point as √time — the microscopic origin of diffusion and Brownian motion. Free.", alternates: { canonical: "/studio/random-walk" } };
export default function Page() {
  return <StudioPageShell slug="random-walk" name="Random Walk & Diffusion" keyword="random walk simulation"
    lede="Hundreds of walkers take random steps from a single point. The cloud spreads as the square root of time — diffusion, built from randomness."
    about="Each walker steps in a random direction each frame. Individually unpredictable, collectively they obey a precise law: mean-squared displacement grows linearly with time (⟨r²⟩ ∝ t). This is the microscopic basis of Brownian motion, heat diffusion, and the diffusion equation.">
    <RandomWalkStudio /></StudioPageShell>;
}
