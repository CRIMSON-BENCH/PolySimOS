import type { Metadata } from "next";
import { StateObserverStudio } from "@/components/studio/StateObserverStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Luenberger State Observer (Browser) — State Estimation", description: "Reconstruct the full state of a mass-spring-damper from a single noisy measurement. Place observer poles, watch true vs estimated states converge. Free.", alternates: { canonical: "/studio/state-observer" } };
export default function Page() {
  return <StudioPageShell slug="state-observer" name="State Observer" keyword="Luenberger observer state estimation"
    lede="Estimate what you can't measure. A Luenberger observer rebuilds the full state of a system from its output alone — watch the estimate chase down the truth from a wrong initial guess."
    about="A Luenberger observer runs a copy of the plant dynamics ẋ̂ = Ax̂ + Bu and corrects it with the measurement error L(y − Cx̂). Here a mass-spring-damper is driven from an initial displacement, but only its position is measured — the observer reconstructs the hidden velocity too. Because the estimation error obeys ė = (A − LC)e, choosing the gain L to place the eigenvalues of A − LC far into the left half-plane makes the estimate converge fast. The catch: those same high gains amplify measurement noise, so the 'observer speed' slider is really a speed-versus-noise tradeoff. The gain L is computed by exact 2×2 pole placement (scipy.signal.place_poles in the exported code).">
    <StateObserverStudio /></StudioPageShell>;
}
