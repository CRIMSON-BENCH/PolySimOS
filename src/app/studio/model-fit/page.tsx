import type { Metadata } from "next";
import { ModelFitStudio } from "@/components/studio/ModelFitStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Model Fit & Validate — Fit a Model to Your Real Data | PolySim OS",
  description:
    "Paste your real measured data and identify a validated model — linear, exponential, first-order step (system ID), logistic, or power — with R², residuals, and a handoff to controller design. Turn measurements into a model you can trust.",
  alternates: { canonical: "/studio/model-fit" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="model-fit"
      name="Model Fit & Validate"
      keyword="fit model to data system identification"
      lede="The reality → model direction: paste your measurements and PolySim fits a validated model, with R² and residuals — then hands the identified plant to controller design."
      about="Model Fit & Validate closes the loop back from reality to simulation. Paste real measured data (x,y per line — for example a step-response you logged from a motor or heater through the Hardware Bridge) and fit a model: linear, exponential, first-order step (K, τ — system identification), logistic, or power. It reports the identified parameters, R², and RMSE so you know whether the model actually captures your system. When you fit a first-order step, it also suggests IMC-tuned PID gains and links straight to Controller → Code — so you can measure a real system, identify its model, design a controller for it, and flash the code. Uses Gauss–Newton (with Levenberg damping) least-squares fitting, entirely in your browser."
    >
      <ModelFitStudio />
    </StudioPageShell>
  );
}
