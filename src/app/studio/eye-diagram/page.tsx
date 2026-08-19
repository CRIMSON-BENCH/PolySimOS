import type { Metadata } from "next";
import { EyeDiagramStudio } from "@/components/studio/EyeDiagramStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Eye Diagram Simulator (Browser) — Signal Integrity", description: "Build a live eye diagram: pulse-shape a bit stream (NRZ or raised-cosine), add noise and timing jitter, and watch ISI open or close the eye. Free.", alternates: { canonical: "/studio/eye-diagram" } };
export default function Page() {
  return <StudioPageShell slug="eye-diagram" name="Eye Diagram" keyword="eye diagram ISI pulse shaping"
    lede="See digital signal integrity the way engineers do. Overlay thousands of received symbol traces into the classic eye — and watch ISI, noise, and jitter close it."
    about="An eye diagram overlays many two-symbol windows of a received waveform, aligned to the symbol clock. A random 2-PAM/NRZ bit stream is pulse-shaped — rectangular NRZ or a raised-cosine pulse with adjustable roll-off β — then passes through a bandlimited channel with additive noise and optional timing jitter. The vertical opening at the ideal sampling instant is the eye height (margin against noise); the horizontal opening is the eye width (margin against timing error). Raised-cosine shaping satisfies the Nyquist zero-intersymbol-interference condition p(kT)=δ[k]: raising β trades occupied bandwidth for a wider, more forgiving eye, while noise and jitter squeeze it shut.">
    <EyeDiagramStudio /></StudioPageShell>;
}
