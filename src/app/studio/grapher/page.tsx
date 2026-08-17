import type { Metadata } from "next";
import { GrapherStudio } from "@/components/studio/GrapherStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Online Function Grapher — Plot f(x) in Your Browser", description: "Graph up to three functions at once with a fast, free online grapher powered by a real expression parser. No install.", alternates: { canonical: "/studio/grapher" } };
export default function Page() {
  return (
    <StudioPageShell slug="grapher" name="Function Grapher" keyword="online function grapher"
      lede="Plot up to three functions at once and compare them. Type any expression in x and it renders instantly."
      about="Each function is parsed by PolySim's computer-algebra engine and sampled across your chosen range, then drawn on a shared set of axes. Great for comparing functions, checking transformations, and visualizing intersections.">
      <GrapherStudio />
    </StudioPageShell>
  );
}
