import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/PageShell";

export const metadata: Metadata = { title: "Acceptable Use Policy — PolySim OS", description: "Rules for using PolySim OS responsibly.", alternates: { canonical: "/acceptable-use" } };

export default function AcceptableUsePage() {
  return (
    <PageShell crumbs={[{ name: "Home", path: "/" }, { name: "Acceptable Use", path: "/acceptable-use" }]} title="Acceptable Use Policy" lede="Last updated August 2026.">
      <Prose>
        <p>You agree not to use PolySim OS to: violate laws or export controls; develop weapons or cause harm; infringe intellectual property; attempt to disrupt, reverse-engineer, or overload the service; or resell access without authorization.</p>
        <p>Simulation outputs must not be presented as certified engineering or professional advice. You remain responsible for validating and appropriately using any results.</p>
        <p>Violations may result in suspension. Report abuse to <a href="mailto:abuse@polysimos.com" className="text-cyan-600 hover:underline dark:text-cyan-400">abuse@polysimos.com</a>.</p>
      </Prose>
    </PageShell>
  );
}
