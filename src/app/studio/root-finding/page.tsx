import type { Metadata } from "next";
import { RootFindingStudio } from "@/components/studio/RootFindingStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";
export const metadata: Metadata = { title: "Root Finding Solver (Browser) — Newton, Bisection, Secant", description: "Solve f(x)=0 in your browser. Watch Newton–Raphson, bisection, and the secant method step to the root — tangents, brackets, and chords, animated. Free.", alternates: { canonical: "/studio/root-finding" } };
export default function Page() {
  return <StudioPageShell slug="root-finding" name="Root Finding" keyword="Newton bisection root finding"
    lede="Solve f(x) = 0, one geometric step at a time. Watch Newton–Raphson ride the tangent, bisection squeeze a bracket, and the secant method draw chords to the crossing."
    about="Root finding locates where a function crosses zero. Newton–Raphson follows the tangent line at the current guess down to the x-axis and converges quadratically near a simple root, but a small derivative or a poor start can send it flying. Bisection needs only a sign change on [a, b] and halves the bracket every step — slow but guaranteed. The secant method replaces Newton's derivative with a finite-difference slope through the last two points, converging superlinearly (order ≈ 1.618) with no calculus required. Pick a preset function, choose a method, and scrub the Step slider to see each iterate.">
    <RootFindingStudio /></StudioPageShell>;
}
