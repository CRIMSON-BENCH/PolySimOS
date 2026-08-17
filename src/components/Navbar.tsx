"use client";

import Link from "next/link";
import { useState } from "react";

const MENU: { label: string; sections: { title: string; links: { name: string; href: string }[] }[] }[] = [
  {
    label: "Product",
    sections: [
      {
        title: "Workspace",
        links: [
          { name: "Node Graph", href: "/product/node-graph" },
          { name: "Live Render", href: "/product/live-render" },
          { name: "AI Copilot", href: "/product/ai-copilot" },
          { name: "Data Inspector", href: "/product/data-inspector" },
          { name: "Hybrid Compute", href: "/product/hybrid-compute" },
        ],
      },
      {
        title: "Live Studio",
        links: [
          { name: "Visual Node Graph", href: "/studio/graph" },
          { name: "GPU Compute (WebGPU)", href: "/studio/gpu" },
          { name: "WebGPU Fluid", href: "/studio/gpu-fluid" },
          { name: "GPU N-Body", href: "/studio/gpu-nbody" },
          { name: "GPU PDE Solver", href: "/studio/gpu-pde" },
          { name: "3D CFD", href: "/studio/cfd-3d" },
          { name: "Particle / N-Body", href: "/studio/particles" },
          { name: "2D Fluid (CFD)", href: "/studio/fluid" },
          { name: "Dynamical Systems", href: "/studio/dynamics" },
          { name: "Heat & Wave Fields", href: "/studio/fields" },
          { name: "Symbolic Math", href: "/studio/cas" },
          { name: "3D N-Body", href: "/studio/3d" },
          { name: "FEA Truss", href: "/studio/fea" },
          { name: "Electrostatics", href: "/studio/electromagnetics" },
          { name: "Molecular Dynamics", href: "/studio/molecular-dynamics" },
          { name: "Notebook", href: "/studio/notebook" },
          { name: "AI Surrogate", href: "/studio/surrogate" },
        ],
      },
    ],
  },
  {
    label: "Solutions",
    sections: [
      {
        title: "By Domain",
        links: [
          { name: "Physics", href: "/domains/physics" },
          { name: "Biology", href: "/domains/biology" },
          { name: "Chemistry", href: "/domains/chemistry" },
          { name: "Mathematics", href: "/domains/mathematics" },
          { name: "Engineering", href: "/domains/engineering" },
        ],
      },
      {
        title: "By Industry",
        links: [
          { name: "Aerospace", href: "/for/aerospace" },
          { name: "Automotive", href: "/for/automotive" },
          { name: "Biotech", href: "/for/biotech" },
          { name: "Energy", href: "/for/energy" },
          { name: "All industries", href: "/for" },
        ],
      },
    ],
  },
  {
    label: "Resources",
    sections: [
      {
        title: "Learn",
        links: [
          { name: "Simulation Guides", href: "/simulate" },
          { name: "Methods", href: "/methods" },
          { name: "Models & Equations", href: "/models" },
          { name: "Glossary", href: "/glossary" },
        ],
      },
      {
        title: "Reference",
        links: [
          { name: "Materials Database", href: "/materials" },
          { name: "Templates", href: "/templates" },
          { name: "Blog", href: "/blog" },
          { name: "Courses", href: "/education" },
        ],
      },
    ],
  },
  {
    label: "Compare",
    sections: [
      {
        title: "vs Competitors",
        links: [
          { name: "vs SimScale", href: "/compare/simscale" },
          { name: "vs Ansys", href: "/compare/ansys" },
          { name: "vs COMSOL", href: "/compare/comsol" },
          { name: "vs MATLAB", href: "/compare/matlab" },
        ],
      },
      {
        title: "Migrate",
        links: [
          { name: "From COMSOL", href: "/migrate/comsol" },
          { name: "From Ansys", href: "/migrate/ansys" },
          { name: "From MATLAB", href: "/migrate/matlab" },
          { name: "All migrations", href: "/migrate" },
        ],
      },
    ],
  },
];

export function Navbar() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-lime-400 text-sm font-black text-slate-950">
            P
          </span>
          <span className="text-slate-900 dark:text-slate-100">PolySim OS</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" onMouseLeave={() => setOpen(null)}>
          {MENU.map((m) => (
            <div key={m.label} className="relative" onMouseEnter={() => setOpen(m.label)}>
              <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                {m.label}
              </button>
              {open === m.label && (
                <div className="absolute left-0 top-full grid w-[28rem] grid-cols-2 gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  {m.sections.map((s) => (
                    <div key={s.title}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{s.title}</p>
                      <ul className="space-y-1.5">
                        {s.links.map((l) => (
                          <li key={l.href}>
                            <Link
                              href={l.href}
                              className="block rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
                            >
                              {l.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link href="/developers" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            Developers
          </Link>
          <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800">
            Log in
          </Link>
          <Link href="/studio" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700">
            Launch Studio
          </Link>
          <button
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setMobile((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="block h-0.5 w-5 bg-slate-700 dark:bg-slate-300" />
            <span className="mt-1 block h-0.5 w-5 bg-slate-700 dark:bg-slate-300" />
            <span className="mt-1 block h-0.5 w-5 bg-slate-700 dark:bg-slate-300" />
          </button>
        </div>
      </div>

      {mobile && (
        <div className="border-t border-slate-200 px-4 py-3 lg:hidden dark:border-slate-800">
          {MENU.map((m) => (
            <div key={m.label} className="py-2">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{m.label}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {m.sections.flatMap((s) => s.links).map((l) => (
                  <Link key={l.href} href={l.href} className="text-sm text-slate-600 hover:text-cyan-600 dark:text-slate-400">
                    {l.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-4 pt-2">
            <Link href="/developers" className="text-sm font-medium text-slate-700 dark:text-slate-300">Developers</Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-700 dark:text-slate-300">Pricing</Link>
            <Link href="/login" className="text-sm font-medium text-slate-700 dark:text-slate-300">Log in</Link>
          </div>
        </div>
      )}
    </header>
  );
}
