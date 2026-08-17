import type { Metadata } from "next";
import { Notebook } from "@/components/studio/Notebook";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Computational Notebook — Symbolic Math & Compute | PolySim OS",
  description: "A browser notebook that mixes prose with real computation: differentiate, integrate, solve, and do linear algebra. Import CSV, export your work. Free.",
  alternates: { canonical: "/studio/notebook" },
};

export default function Page() {
  return (
    <StudioPageShell slug="notebook" name="Computational Notebook" keyword="computational notebook"
      lede="Think in cells. Mix notes with live computation — symbolic calculus, equation solving, and matrix algebra — the way you would in a research notebook, but in your browser."
      about="Each compute cell is interpreted by PolySim's symbolic engine and linear-algebra core. Use commands like diff, int, simplify, solve, det, and inv, or type any expression to evaluate it. Import a CSV to bring in data, and export the whole notebook as text. Everything runs locally — no kernel to install."
    >
      <Notebook />
    </StudioPageShell>
  );
}
