import { slugify } from "./seo";

export interface Topic {
  slug: string;
  name: string;
  summary: string;
  studio?: string; // link to a live studio sim if we have one
}

export interface Domain {
  slug: string;
  name: string;
  tagline: string;
  intro: string;
  topics: Topic[];
}

function mkTopics(domain: string, list: [string, string, string?][]): Topic[] {
  return list.map(([name, summary, studio]) => ({ slug: slugify(name), name, summary, studio }));
}

export const DOMAINS: Domain[] = [
  {
    slug: "physics",
    name: "Physics",
    tagline: "Classical, statistical, and modern physics — simulated live.",
    intro:
      "Model mechanics, waves, fields, and thermodynamics directly in your browser. PolySim's physics nodes cover everything from projectile motion to N-body gravitation, with real numerical integrators and live rendering.",
    topics: mkTopics("physics", [
      ["Newtonian Mechanics", "Forces, momentum, and motion under Newton's laws.", "/studio/particles"],
      ["Orbital Mechanics", "Two-body and N-body gravitation and stable orbits.", "/studio/particles"],
      ["Projectile Motion", "Trajectories with gravity and aerodynamic drag."],
      ["Rigid Body Dynamics", "Collisions, rotation, and contact response.", "/studio/particles"],
      ["Wave Mechanics", "Propagation, superposition, and interference."],
      ["Thermodynamics", "Heat, entropy, and the laws of thermodynamics."],
      ["Statistical Mechanics", "Ensembles, distributions, and emergent behavior."],
      ["Electromagnetism", "Electric and magnetic fields and their sources."],
      ["Oscillations & Resonance", "Springs, pendulums, and driven oscillators.", "/studio/dynamics"],
      ["Chaos Theory", "Sensitive dependence and strange attractors.", "/studio/dynamics"],
      ["Fluid Mechanics", "Incompressible flow, vorticity, and turbulence.", "/studio/fluid"],
      ["Optics", "Reflection, refraction, and diffraction of light."],
    ]),
  },
  {
    slug: "biology",
    name: "Biology",
    tagline: "Population, cellular, and systems biology models.",
    intro:
      "Simulate living systems — from epidemic spread to predator–prey ecosystems and reaction networks — with compartmental models and agent-based dynamics that run in real time.",
    topics: mkTopics("biology", [
      ["Population Dynamics", "Growth, carrying capacity, and competition.", "/studio/dynamics"],
      ["Predator–Prey Models", "Lotka–Volterra oscillations between species.", "/studio/dynamics"],
      ["Epidemiology (SIR/SEIR)", "Compartmental models of disease spread.", "/studio/dynamics"],
      ["Reaction–Diffusion", "Turing patterns and morphogenesis.", "/studio/dynamics"],
      ["Gene Regulatory Networks", "Feedback and switches in gene expression."],
      ["Enzyme Kinetics", "Michaelis–Menten and catalytic dynamics."],
      ["Neural Dynamics", "Spiking models and network activity."],
      ["Cellular Automata", "Emergent life-like behavior on grids."],
      ["Evolutionary Dynamics", "Selection, drift, and fitness landscapes."],
      ["Ecosystem Modeling", "Food webs and nutrient cycling."],
    ]),
  },
  {
    slug: "chemistry",
    name: "Chemistry",
    tagline: "Reaction kinetics, equilibrium, and transport.",
    intro:
      "Model chemical systems — reaction rates, equilibria, diffusion, and oscillating reactions — with stiff-capable integrators and clear, interactive visualizations.",
    topics: mkTopics("chemistry", [
      ["Reaction Kinetics", "Rate laws and time-dependent concentrations."],
      ["Chemical Equilibrium", "Le Chatelier and equilibrium constants."],
      ["Oscillating Reactions", "Belousov–Zhabotinsky-style chemical clocks.", "/studio/dynamics"],
      ["Diffusion & Transport", "Fickian diffusion and mass transfer.", "/studio/fluid"],
      ["Acid–Base Chemistry", "Titration curves and buffer behavior."],
      ["Electrochemistry", "Cell potentials and electron transfer."],
      ["Catalysis", "Reaction acceleration and selectivity."],
      ["Combustion", "Exothermic reaction fronts and flames."],
      ["Polymerization", "Chain growth and molecular-weight distributions."],
      ["Crystallization", "Nucleation and growth kinetics."],
    ]),
  },
  {
    slug: "mathematics",
    name: "Mathematics",
    tagline: "ODEs, PDEs, dynamical systems, and symbolic math.",
    intro:
      "From symbolic calculus to nonlinear dynamics, PolySim's math engine solves, simplifies, integrates, and plots — a computer-algebra system and numerical solver combined.",
    topics: mkTopics("mathematics", [
      ["Ordinary Differential Equations", "Initial-value problems solved with RK4.", "/studio/dynamics"],
      ["Partial Differential Equations", "Heat, wave, and diffusion equations.", "/studio/dynamics"],
      ["Dynamical Systems", "Fixed points, limit cycles, and bifurcations.", "/studio/dynamics"],
      ["Symbolic Calculus", "Differentiation, simplification, and roots.", "/studio/cas"],
      ["Linear Algebra", "Matrices, eigenvalues, and transformations."],
      ["Numerical Integration", "Quadrature and Monte Carlo methods."],
      ["Chaos & Fractals", "Strange attractors and self-similarity.", "/studio/dynamics"],
      ["Optimization", "Gradient methods and global search."],
      ["Probability & Statistics", "Distributions, sampling, and inference."],
      ["Complex Analysis", "Functions of a complex variable and mappings."],
    ]),
  },
  {
    slug: "engineering",
    name: "Engineering",
    tagline: "CFD, FEA, thermal, and structural analysis.",
    intro:
      "Run engineering-grade analyses in the browser — computational fluid dynamics, finite-element structural and thermal analysis, and multi-physics coupling — without a desktop license.",
    topics: mkTopics("engineering", [
      ["Computational Fluid Dynamics", "Incompressible flow and aerodynamics.", "/studio/fluid"],
      ["Finite Element Analysis", "Stress, strain, and deformation."],
      ["Heat Transfer", "Conduction, convection, and radiation."],
      ["Structural Analysis", "Beams, trusses, and load paths."],
      ["Modal Analysis", "Natural frequencies and mode shapes."],
      ["Aerodynamics", "Lift, drag, and flow separation.", "/studio/fluid"],
      ["Control Systems", "Feedback, stability, and response.", "/studio/dynamics"],
      ["Vibration Analysis", "Damping, resonance, and isolation.", "/studio/dynamics"],
      ["Multiphysics Coupling", "Coupled fluid–thermal–structural solves."],
      ["Topology Optimization", "AI-driven lightweight design."],
    ]),
  },
  {
    slug: "data-science",
    name: "Data & Computation",
    tagline: "Monte Carlo, surrogate models, and scientific ML.",
    intro:
      "Blend simulation with data: build surrogate models, run Monte Carlo experiments, quantify uncertainty, and connect scientific machine learning to your solvers.",
    topics: mkTopics("data", [
      ["Monte Carlo Methods", "Random sampling for integration and risk."],
      ["Surrogate Modeling", "Fast ML approximations of slow solvers.", "/studio/surrogate"],
      ["Uncertainty Quantification", "Propagating input uncertainty to outputs."],
      ["Parameter Sweeps", "Design-of-experiments across parameters."],
      ["Scientific Machine Learning", "Physics-informed and data-driven models.", "/studio/surrogate"],
      ["Inverse Problems", "Recovering inputs from observed outputs."],
      ["Sensitivity Analysis", "Which inputs matter most."],
      ["Time-Series Modeling", "Forecasting dynamical data."],
    ]),
  },
];

export function getDomain(slug: string): Domain | undefined {
  return DOMAINS.find((d) => d.slug === slug);
}
export function getAllDomainSlugs(): string[] {
  return DOMAINS.map((d) => d.slug);
}
export function allDomainTopicPairs(): { domain: string; topic: string }[] {
  const out: { domain: string; topic: string }[] = [];
  for (const d of DOMAINS) for (const t of d.topics) out.push({ domain: d.slug, topic: t.slug });
  return out;
}
export function getTopic(domainSlug: string, topicSlug: string): { domain: Domain; topic: Topic } | undefined {
  const domain = getDomain(domainSlug);
  const topic = domain?.topics.find((t) => t.slug === topicSlug);
  if (!domain || !topic) return undefined;
  return { domain, topic };
}
