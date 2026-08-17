import type { Metadata } from "next";
import { RLCStudio } from "@/components/studio/RLCStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "RLC Circuit Simulator (Browser) — Step Response & Damping", description: "Simulate a series RLC circuit's step response. Tune R, L, and C to explore under-, over-, and critically damped behavior. Free.", alternates: { canonical: "/studio/rlc" } };
export default function Page() {
  return <StudioPageShell slug="rlc" name="RLC Circuit" keyword="RLC circuit simulation"
    lede="Apply a step voltage to a series RLC circuit and watch charge and current respond — the electrical twin of a damped oscillator."
    about="The circuit is governed by a second-order ODE, L·q″ + R·q′ + q/C = V, integrated in time. The damping ratio ζ decides whether the response oscillates (underdamped), returns slowly (overdamped), or settles as fast as possible without overshoot (critically damped).">
    <RLCStudio /></StudioPageShell>;
}
