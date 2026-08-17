import type { Metadata } from "next";
import { SurrogateStudio } from "@/components/studio/SurrogateStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "AI Surrogate Model Trainer — Instant Simulation Previews in the Browser",
  description:
    "Train a real machine-learning surrogate model on a physics solver and get near-instant predictions instead of re-running the full simulation — with honest R² and speed-up metrics. Free.",
  alternates: { canonical: "/studio/surrogate" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="surrogate"
      name="AI Surrogate Model"
      lede="Train a machine-learning surrogate on our real particle solver, then predict outcomes across the whole parameter space in microseconds — the instant-preview idea behind PhysicsX and Neural Concept, running in your browser."
      about="We sample the real solver across a grid of parameters, then fit a Gaussian radial-basis-function (RBF) interpolator with a linear tail and ridge regularization — solving the interpolation system directly. The trained surrogate predicts new outputs by evaluating basis functions, which is orders of magnitude faster than re-simulating. Accuracy is reported honestly using a held-out test grid (R², RMSE), and you can verify any prediction against the full solver to see the real speed-up."
      keyword="AI surrogate model"
    >
      <SurrogateStudio />
    </StudioPageShell>
  );
}
