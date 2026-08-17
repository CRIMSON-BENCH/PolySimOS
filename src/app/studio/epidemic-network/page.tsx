import type { Metadata } from "next";
import { EpidemicNetworkStudio } from "@/components/studio/EpidemicNetworkStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Epidemic Network Simulator (Browser) — Agent-Based SIR", description: "Watch a disease spread across a contact network with an agent-based SIR model. Tune transmission, recovery, and connectivity. Free.", alternates: { canonical: "/studio/epidemic-network" } };
export default function Page() {
  return <StudioPageShell slug="epidemic-network" name="Epidemic Network" keyword="epidemic network simulation"
    lede="Disease doesn't spread in a well-mixed soup — it spreads along contacts. Watch an outbreak move through a network and see how connectivity drives it."
    about="This agent-based SIR model places individuals on a contact graph. Each infected node can infect its neighbors with probability β and recovers with probability γ. It captures effects the classic equations miss — super-spreaders, network structure, and the impact of reducing contacts.">
    <EpidemicNetworkStudio /></StudioPageShell>;
}
