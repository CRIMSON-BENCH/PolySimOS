import type { Metadata } from "next";
import { ComplexStudio } from "@/components/studio/ComplexStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Complex Function Visualizer (Browser) — Domain Coloring", description: "Visualize complex functions f(z) with domain coloring: hue shows phase, brightness shows magnitude. See zeros, poles, and branch cuts. Free.", alternates: { canonical: "/studio/complex" } };
export default function Page() {
  return <StudioPageShell slug="complex" name="Complex Function Visualizer" keyword="complex function visualization"
    lede="Complex functions live in four dimensions — domain coloring squeezes them onto the plane so you can actually see them. Hue is phase; brightness is magnitude."
    about="Every point of the complex plane is colored by the output of f(z): the hue encodes the argument (phase) and the brightness encodes the magnitude. Zeros appear as dark points and poles as bright ones, making the structure of functions like 1/z and (z²−1)/(z²+1) immediately visible.">
    <ComplexStudio /></StudioPageShell>;
}
