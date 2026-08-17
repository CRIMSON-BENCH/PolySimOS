import type { Metadata } from "next";
import { NodeEditor } from "@/components/studio/NodeEditor";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Visual Node Graph Editor — Build Simulations by Wiring Blocks | PolySim OS",
  description:
    "A real drag-and-wire node graph, in your browser. Compose sources, math, symbolic calculus, and plots into a live dataflow that recomputes as you edit. Free, no install.",
  alternates: { canonical: "/studio/graph" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="graph"
      name="Visual Node Graph"
      lede="Build a simulation the way you think about it — wire blocks together and watch the whole graph recompute live. Drag a node's output onto another node's input to connect them."
      about="This is a real dataflow engine: each node has typed input and output ports, edges carry scalars or series between them, and the graph is evaluated in topological order every time you change a value. The Expression and Derivative nodes are powered by PolySim's symbolic CAS, so wiring f(x) into a Derivative node computes the exact symbolic derivative and plots it alongside the original — no numerical approximation."
      keyword="node graph editor"
    >
      <NodeEditor />
    </StudioPageShell>
  );
}
