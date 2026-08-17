import type { Metadata } from "next";
import { TrafficStudio } from "@/components/studio/TrafficStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Traffic Flow Simulator (Browser) — Phantom Jams", description: "Simulate traffic with the Nagel–Schreckenberg model and watch phantom jams form from random braking alone. Free, interactive.", alternates: { canonical: "/studio/traffic" } };
export default function Page() {
  return <StudioPageShell slug="traffic" name="Traffic Flow" keyword="traffic flow simulation"
    lede="Why does traffic jam for no reason? Watch phantom jams appear and travel backward through a stream of cars — caused by nothing but random braking."
    about="The Nagel–Schreckenberg cellular-automaton model gives each car simple rules: accelerate, brake to avoid the car ahead, randomly dab the brakes, then move. The space-time diagram reveals jams as backward-traveling waves — the emergent congestion real highways show.">
    <TrafficStudio /></StudioPageShell>;
}
