import type { Metadata } from "next";
import { Studio3D } from "@/components/studio/Studio3D";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "3D N-Body Simulator (Browser) — Orbits & Gravitation in 3D",
  description: "A real 3D gravitational N-body simulator with an orbit camera, running in your browser. Drag to rotate, scroll to zoom. Free, no install.",
  alternates: { canonical: "/studio/3d" },
};

export default function Page() {
  return (
    <StudioPageShell slug="3d" name="3D N-Body Simulator" keyword="3D simulation"
      lede="Gravitation in three dimensions with a live orbit camera. Watch a planetary system evolve, then drag to fly around it."
      about="Bodies interact through 3D Newtonian gravity with softening, integrated by a symplectic scheme for long-term stability. Each frame is projected from 3D to your screen with a perspective orbit camera you can rotate and zoom — the same rendering math behind 3D engines, implemented directly on a canvas.">
      <Studio3D />
    </StudioPageShell>
  );
}
