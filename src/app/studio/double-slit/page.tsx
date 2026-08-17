import type { Metadata } from "next";
import { DoubleSlitStudio } from "@/components/studio/DoubleSlitStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Double-Slit Experiment Simulator (Browser)", description: "Simulate the double-slit experiment: interference fringes modulated by single-slit diffraction. Tune slit separation, width, and wavelength. Free.", alternates: { canonical: "/studio/double-slit" } };
export default function Page() {
  return <StudioPageShell slug="double-slit" name="Double-Slit Experiment" keyword="double slit experiment"
    lede="The experiment at the heart of quantum weirdness. See how two slits create bright and dark interference fringes, shaped by each slit's diffraction envelope."
    about="The screen intensity combines two-slit interference, cos²(πd·sinθ/λ), with the single-slit diffraction envelope, sinc²(πa·sinθ/λ). Change the slit separation, slit width, and wavelength to watch the fringe spacing and envelope respond exactly as in the real experiment.">
    <DoubleSlitStudio /></StudioPageShell>;
}
