import type { Metadata } from "next";
import { PageShell, Prose, H2 } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "About PolySim OS — The Everything Engine for Simulation",
  description: "PolySim OS exists to put real, rigorous simulation in the hands of every scientist, engineer, and student — in the browser, free to start.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]}
      title="Built for the minds who see the equations"
      lede="PolySim OS turns theory into running reality — real solvers, in the browser, for scientists, engineers, and students everywhere."
    >
      <Prose>
        <p>
          For decades, serious simulation meant expensive desktop licenses, steep learning curves, and
          machines most people couldn&apos;t access. Brilliant ideas stayed on the whiteboard because the
          tools to test them were locked behind cost and complexity.
        </p>
        <p>
          PolySim OS closes that gap. We put physics, biology, chemistry, mathematics, and engineering into
          one AI-powered workspace that runs in any modern browser — no install, no license, free to start.
          Real numerical methods, real-time rendering, and an AI copilot that turns plain-English intent into
          a running model.
        </p>
      </Prose>
      <H2>Our principles</H2>
      <Prose>
        <p><strong>Local-first and free.</strong> Your device is powerful. Local simulation is free forever; you pay only when you choose to scale to the cloud.</p>
        <p><strong>Rigor, not toys.</strong> We build genuine solvers and report accuracy honestly — always subject to validation before you rely on a result.</p>
        <p><strong>Open by default.</strong> Reproducible, shareable, citable simulations that advance science instead of locking it away.</p>
      </Prose>
    </PageShell>
  );
}
