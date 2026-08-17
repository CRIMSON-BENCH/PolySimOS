import type { Metadata } from "next";
import { CasStudio } from "@/components/studio/CasStudio";
import { StudioPageShell } from "@/components/studio/StudioPageShell";

export const metadata: Metadata = {
  title: "Symbolic Math Calculator (CAS) — Differentiate, Simplify & Plot Online",
  description:
    "A real computer-algebra system in your browser: type any function to differentiate, simplify, find roots, and plot f(x) and f'(x) together. A free, fast Wolfram-style symbolic tool.",
  alternates: { canonical: "/studio/cas" },
};

export default function Page() {
  return (
    <StudioPageShell
      slug="cas"
      name="Symbolic Math (CAS)"
      lede="Type any function and get its exact derivative, a simplified form, numeric roots, and a live plot of both the function and its derivative — a real computer-algebra engine, in your browser."
      about="This is a genuine computer-algebra system: a tokenizer and Pratt parser build an expression tree, symbolic differentiation applies the product, quotient, and chain rules, and an algebraic simplifier reduces the result to a fixed point. Roots are found numerically by bisection, and the plot samples the compiled expression across the domain. No server round-trips — the algebra runs entirely on your device."
      keyword="symbolic math"
    >
      <CasStudio />
    </StudioPageShell>
  );
}
