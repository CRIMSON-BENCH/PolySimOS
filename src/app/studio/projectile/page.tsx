import type { Metadata } from "next";
import { ProjectileStudio } from "@/components/studio/ProjectileStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Projectile Motion Simulator (Browser) — With Air Drag", description: "An interactive projectile-motion simulator with air resistance. Tune angle, speed, and drag and see range and apex. Free.", alternates: { canonical: "/studio/projectile" } };
export default function Page() {
  return (
    <StudioPageShell slug="projectile" name="Projectile Motion" keyword="projectile motion simulation"
      lede="Fire a projectile and watch the arc. Adjust angle, speed, and air drag to see how range and maximum height change."
      about="The trajectory is integrated step by step with gravity and a quadratic air-drag force proportional to the square of speed. With drag off you recover the ideal parabola and the classic 45° optimum; with drag on, the optimal launch angle drops and the path becomes asymmetric — just like a real ball.">
      <ProjectileStudio />
    </StudioPageShell>
  );
}
