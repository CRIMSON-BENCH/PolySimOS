import type { Metadata } from "next";
import { BlockDiagramStudio } from "@/components/studio/BlockDiagramStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Block Diagram Simulator (Browser) — Free Simulink Alternative",
  description: "Build and run continuous-time block diagrams in your browser — Step, Sum, Gain, Integrator, Transfer Function and Scope, solved with RK4. A free alternative to Simulink with closed-loop PID, first-order lag, and mass–spring–damper presets.",
  alternates: { canonical: "/studio/block-diagram" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="block-diagram"
      name="Block Diagram Simulator"
      keyword="Simulink alternative block diagram simulator"
      lede="Wire up sources, gains, integrators and transfer functions on a live canvas and watch the Scope respond — a browser-native alternative to Simulink, with real continuous-time RK4 under the hood."
      about="This is a block-diagram simulator in the spirit of Simulink, running entirely in your browser. Every block carries the semantics of a control-systems primitive: sources (Step, Sine, Constant) generate signals, algebraic blocks (Sum, Gain, Saturation) transform them instantly, and state-holding blocks (Integrator 1/s and first-order Transfer Function 1/(τs+1)) carry memory. On each fixed step the solver evaluates the algebraic blocks in dependency order, then advances every integrator and transfer-function state with a fourth-order Runge–Kutta (RK4) step. Because those state blocks introduce a delay, closed feedback loops are solvable — that is exactly why a PID loop or a mass–spring–damper works — while a pure algebraic loop with no integrator is flagged as unsolvable. Load a preset to see a correct wiring (first-order lag, closed-loop PID, harmonic oscillator, mass–spring–damper), tune the gains and time constants to watch rise, overshoot and settling change in real time, then export the exact system as runnable SciPy Python. It is an alternative to Simulink for learning and quick modelling — not a replacement for a validated production toolchain."
    >
      <BlockDiagramStudio />
    </StudioPageShell>
  );
}
