import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Disclaimer } from "@/components/Disclaimer";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppLd } from "@/lib/seo";
import { ProductGrid } from "@/components/ProductCard";
import { contextualProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "PolySim Studio — Run Real Simulations in Your Browser",
  description:
    "Launch live, browser-native simulations: particle/N-body physics, 2D fluid dynamics (CFD), dynamical systems, symbolic math, and an AI surrogate model. Free, no install.",
  alternates: { canonical: "/studio" },
};

const SIMS = [
  { slug: "graph", name: "Visual Node Graph", desc: "Wire blocks into a live dataflow — the real editor. Symbolic calculus built in.", tag: "Flagship" },
  { slug: "particles", name: "Particle / N-Body", desc: "Gravity, orbits, and impulse collisions with a real symplectic integrator.", tag: "Physics" },
  { slug: "fluid", name: "2D Fluid (CFD)", desc: "Interactive incompressible Navier–Stokes via Stam's stable-fluids method.", tag: "Engineering" },
  { slug: "dynamics", name: "Dynamical Systems", desc: "Lorenz, SIR epidemics, pendulums, predator–prey, and reaction–diffusion.", tag: "Math / Bio" },
  { slug: "fields", name: "Heat & Wave Fields", desc: "2D heat diffusion and the 1D wave equation, solved live.", tag: "PDE" },
  { slug: "cas", name: "Symbolic Math", desc: "Parse, differentiate, simplify, solve, and plot — a real CAS in your browser.", tag: "Math" },
  { slug: "surrogate", name: "AI Surrogate", desc: "Train an ML surrogate on our solver for instant predictions. The PhysicsX play.", tag: "AI" },
  { slug: "3d", name: "3D N-Body", desc: "Gravitation in 3D with a drag-to-orbit camera.", tag: "3D Physics" },
  { slug: "fea", name: "FEA Truss", desc: "Finite-element structural analysis: forces & deflection.", tag: "Engineering" },
  { slug: "electromagnetics", name: "Electrostatics", desc: "Charges, potential heatmaps, and field lines.", tag: "Physics" },
  { slug: "molecular-dynamics", name: "Molecular Dynamics", desc: "Lennard-Jones atoms; melt a lattice.", tag: "Chemistry" },
  { slug: "mesh", name: "Meshing + BCs", desc: "Paint boundary conditions; solve steady heat.", tag: "Engineering" },
  { slug: "vector-field", name: "Vector Fields", desc: "Plot any F(x,y) as a live quiver diagram.", tag: "Math" },
  { slug: "optimize", name: "Optimize + UQ", desc: "Gradient descent and Monte-Carlo uncertainty.", tag: "Data" },
  { slug: "notebook", name: "Notebook", desc: "Cells of prose + symbolic math + compute.", tag: "Math" },
];

export default function StudioIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={softwareAppLd({ name: "PolySim Studio", description: "Browser-native simulation studio.", path: "/studio" })} />
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Studio", path: "/studio" }]} />
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
        PolySim Studio
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
        Real simulations that run entirely in your browser — no install, no account, free forever locally.
        Pick an engine and start exploring.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SIMS.map((s) => (
          <Link
            key={s.slug}
            href={`/studio/${s.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-cyan-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{s.tag}</span>
            <h2 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">
              {s.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.desc}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-cyan-600 dark:text-cyan-400">Launch →</span>
          </Link>
        ))}
      </div>

      <ProductGrid products={contextualProducts("studio", 6)} title="Power up your workspace" />
      <Disclaimer />
    </div>
  );
}
