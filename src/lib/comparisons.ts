import { slugify } from "./seo";

export interface Comparison {
  slug: string;
  competitor: string;
  tagline: string;
  theirPricing: string;
  polysimPricing: string;
  intro: string;
  rows: { feature: string; polysim: string; them: string }[];
  theirStrengths: string[];
  theirWeaknesses: string[];
  verdict: string;
}

const P = "From $0 (free local) · $24/mo Independent Researcher";

const DATA: Comparison[] = [
  {
    slug: slugify("simscale"),
    competitor: "SimScale",
    tagline: "Browser CAE, but engineering-only and quote-gated.",
    theirPricing: "Free Community tier; Mechanical/Professional/Enterprise are quote-only.",
    polysimPricing: P,
    intro: "SimScale pioneered browser-based CAE, but everything above the free tier is hidden behind 'request a quote,' and it covers only engineering physics. PolySim publishes flat pricing, spans physics/bio/chem/math, and adds an AI copilot and surrogate models.",
    rows: [
      { feature: "Runs in browser", polysim: "Yes (WebGPU)", them: "Yes" },
      { feature: "Transparent pricing", polysim: "Yes, flat tiers", them: "No — quote only" },
      { feature: "Domains", polysim: "Physics, bio, chem, math, engineering", them: "Engineering CAE only" },
      { feature: "AI copilot (English → sim)", polysim: "Yes", them: "No" },
      { feature: "AI surrogate models", polysim: "Yes", them: "No" },
      { feature: "Free tier", polysim: "Free forever locally", them: "Limited core-hours" },
    ],
    theirStrengths: ["Mature, validated CAE solvers", "Large engineering community", "Established brand"],
    theirWeaknesses: ["Opaque quote-only pricing", "Engineering-only scope", "No generative AI authoring"],
    verdict: "Choose PolySim for transparent pricing, multi-domain scope, and AI-native authoring; choose SimScale if you need a specific validated legacy CAE workflow today.",
  },
  {
    slug: slugify("ansys"),
    competitor: "Ansys",
    tagline: "Industry titan, but desktop-heavy and expensive.",
    theirPricing: "Quote-only; seats commonly run thousands to six figures per year.",
    polysimPricing: P,
    intro: "Ansys is the gold standard for high-fidelity enterprise simulation, but it's desktop-first, costly, and steep to learn. PolySim brings a large share of that capability to the browser at a fraction of the cost, with AI assistance built in.",
    rows: [
      { feature: "Runs in browser", polysim: "Yes", them: "Mostly desktop" },
      { feature: "Entry cost", polysim: "$0–$24/mo", them: "$$$$ / quote" },
      { feature: "Learning curve", polysim: "Gentle, AI-assisted", them: "Steep" },
      { feature: "Setup time", polysim: "Seconds", them: "Install + license" },
      { feature: "AI copilot", polysim: "Yes", them: "Limited" },
    ],
    theirStrengths: ["Best-in-class fidelity", "Vast solver breadth", "Deep validation & certification"],
    theirWeaknesses: ["Very expensive", "Desktop-bound", "Long onboarding"],
    verdict: "Choose PolySim for accessible, fast, AI-assisted simulation and prototyping; Ansys still leads for certified, mission-critical enterprise analysis.",
  },
  {
    slug: slugify("comsol"),
    competitor: "COMSOL Multiphysics",
    tagline: "Great multiphysics — priced per module, per seat.",
    theirPricing: "Base ~$3,495/yr commercial; each add-on module $600–$4,500.",
    polysimPricing: P,
    intro: "COMSOL is beloved for multiphysics, but its per-module pricing balloons quickly and it's a desktop install. PolySim offers browser multiphysics with flat pricing and no module tax.",
    rows: [
      { feature: "Multiphysics", polysim: "Yes", them: "Yes (per module)" },
      { feature: "Per-module fees", polysim: "None", them: "$600–$4,500 each" },
      { feature: "Browser-native", polysim: "Yes", them: "No" },
      { feature: "AI copilot", polysim: "Yes", them: "No" },
      { feature: "Annual base cost", polysim: "$0–$288/yr", them: "$3,495+/yr" },
    ],
    theirStrengths: ["Excellent multiphysics coupling", "Mature model library", "Strong academic base"],
    theirWeaknesses: ["Per-module cost explosion", "Desktop install", "No real-time browser render"],
    verdict: "Choose PolySim to avoid module fees and work in the browser; COMSOL wins when you need its specific validated module ecosystem.",
  },
  {
    slug: slugify("matlab"),
    competitor: "MATLAB / Simulink",
    tagline: "Powerful numerics — but a coding barrier and toolbox sprawl.",
    theirPricing: "Student Suite $119/yr; commercial per-toolbox runs into thousands.",
    polysimPricing: P,
    intro: "MATLAB is a numerical powerhouse, but simulation means code and a pile of paid toolboxes. PolySim gives you a visual node graph, a symbolic engine, and AI authoring — no toolbox tax.",
    rows: [
      { feature: "Visual node graph", polysim: "Yes", them: "Simulink (paid)" },
      { feature: "Symbolic math", polysim: "Built in", them: "Symbolic Toolbox (paid)" },
      { feature: "Browser-native", polysim: "Yes", them: "Limited (MATLAB Online)" },
      { feature: "AI copilot", polysim: "Yes", them: "Limited" },
      { feature: "Toolbox fees", polysim: "None", them: "Per toolbox" },
    ],
    theirStrengths: ["Deep numerical libraries", "Simulink for control systems", "Huge ecosystem"],
    theirWeaknesses: ["Programming barrier", "Toolbox costs add up", "Not simulation-first"],
    verdict: "Choose PolySim for visual, AI-assisted, browser simulation; MATLAB remains excellent for heavy custom numerical programming.",
  },
  {
    slug: slugify("wolfram-mathematica"),
    competitor: "Wolfram / Mathematica",
    tagline: "Symbolic king — but niche syntax and no real-time render.",
    theirPricing: "Perpetual ~$3,445; annual subscriptions; students discounted.",
    polysimPricing: P,
    intro: "Mathematica excels at symbolic computation, but its language is niche and it isn't a real-time simulation renderer. PolySim pairs a symbolic engine with live 2D/3D solvers and AI authoring.",
    rows: [
      { feature: "Symbolic algebra", polysim: "Yes (CAS)", them: "Yes (best-in-class)" },
      { feature: "Real-time 3D sim", polysim: "Yes", them: "Limited" },
      { feature: "Browser-native", polysim: "Yes", them: "Cloud add-on" },
      { feature: "Entry cost", polysim: "$0–$24/mo", them: "$$$" },
      { feature: "AI copilot", polysim: "Yes", them: "Some" },
    ],
    theirStrengths: ["Unmatched symbolic depth", "Computable knowledge base", "Rich documentation"],
    theirWeaknesses: ["Steep, niche syntax", "Costly", "Not a real-time sim renderer"],
    verdict: "Choose PolySim for interactive simulation with symbolic support; Mathematica leads for pure, advanced symbolic work.",
  },
  {
    slug: slugify("luminary-cloud"),
    competitor: "Luminary Cloud",
    tagline: "Cloud CAE for enterprises — no consumer path.",
    theirPricing: "Consumption-based, quote-driven; enterprise focus.",
    polysimPricing: P,
    intro: "Luminary Cloud brings usage-based cloud CFD to enterprises. PolySim serves the same speed ethos but adds self-serve pricing, multi-domain scope, and an education tier.",
    rows: [
      { feature: "Self-serve signup", polysim: "Yes", them: "Sales-led" },
      { feature: "Education tier", polysim: "Yes", them: "No" },
      { feature: "Domains", polysim: "Multi-domain", them: "CFD-focused" },
      { feature: "Free tier", polysim: "Yes", them: "No" },
    ],
    theirStrengths: ["Fast cloud CFD", "AI design copilot", "Enterprise-grade"],
    theirWeaknesses: ["Enterprise-only", "Narrow domain", "No free/education path"],
    verdict: "Choose PolySim for self-serve, multi-domain, and education; Luminary suits large aerospace/automotive CFD teams.",
  },
  {
    slug: slugify("flexcompute"),
    competitor: "Flexcompute (Flow360 / Tidy3D)",
    tagline: "Fast GPU CFD & photonics — credits only, narrow scope.",
    theirPricing: "Pay-per-simulation FlexCredits.",
    polysimPricing: P,
    intro: "Flexcompute delivers blazing GPU CFD and photonics via credits, but it's narrow and credit-metered. PolySim spans many domains with flat plans plus optional compute tokens.",
    rows: [
      { feature: "Domains", polysim: "Multi-domain", them: "CFD + photonics" },
      { feature: "Flat subscription option", polysim: "Yes", them: "Credits only" },
      { feature: "Visual authoring", polysim: "Yes", them: "Code-driven" },
      { feature: "AI copilot", polysim: "Yes", them: "No" },
    ],
    theirStrengths: ["Very fast GPU solvers", "Strong photonics (Tidy3D)", "Accurate CFD"],
    theirWeaknesses: ["Narrow scope", "Credits-only pricing", "Code-first workflow"],
    verdict: "Choose PolySim for breadth and visual/AI authoring; Flexcompute wins for specialized high-end CFD or photonics.",
  },
  {
    slug: slugify("rescale"),
    competitor: "Rescale",
    tagline: "HPC brokerage — infrastructure, not an authoring tool.",
    theirPricing: "Consumption HPC; 1–3 year commitments discount.",
    polysimPricing: P,
    intro: "Rescale is a cloud-HPC layer for running other simulation apps. PolySim is the authoring tool itself, with its own solvers, AI copilot, and optional cloud compute.",
    rows: [
      { feature: "Authoring tool", polysim: "Yes", them: "No (runs others)" },
      { feature: "Own solvers", polysim: "Yes", them: "Third-party apps" },
      { feature: "AI copilot", polysim: "Yes", them: "No" },
      { feature: "Free tier", polysim: "Yes", them: "No" },
    ],
    theirStrengths: ["Huge app catalog", "Serious HPC scale", "Enterprise integrations"],
    theirWeaknesses: ["Not an authoring tool", "Enterprise pricing", "No free path"],
    verdict: "Use PolySim to build and run simulations directly; use Rescale to broker HPC for existing licensed solvers.",
  },
  {
    slug: slugify("physicsx"),
    competitor: "PhysicsX",
    tagline: "AI surrogate models — enterprise contracts only.",
    theirPricing: "Enterprise engagements (no self-serve).",
    polysimPricing: P,
    intro: "PhysicsX builds powerful AI surrogate models for large manufacturers under enterprise contracts. PolySim brings surrogate modeling to everyone, self-serve, in the browser.",
    rows: [
      { feature: "Self-serve surrogate", polysim: "Yes", them: "No" },
      { feature: "In-browser", polysim: "Yes", them: "No" },
      { feature: "Pricing", polysim: "$0–$24/mo", them: "Enterprise only" },
      { feature: "Full sim authoring", polysim: "Yes", them: "Surrogates only" },
    ],
    theirStrengths: ["State-of-the-art surrogates", "Deep enterprise partnerships", "Large physics models"],
    theirWeaknesses: ["No self-serve product", "No browser tool", "Enterprise-only"],
    verdict: "Choose PolySim for accessible surrogate modeling plus full authoring; PhysicsX suits large enterprises needing bespoke foundation models.",
  },
  {
    slug: slugify("phet"),
    competitor: "PhET / GeoGebra",
    tagline: "Great free education — but toy-grade and no cloud compute.",
    theirPricing: "Free (nonprofit/grants).",
    polysimPricing: P,
    intro: "PhET and GeoGebra are wonderful for teaching, but their simulations are fixed and limited. PolySim offers real, extensible solvers with a free education tier plus a path to research-grade compute.",
    rows: [
      { feature: "Editable/extensible sims", polysim: "Yes", them: "Fixed demos" },
      { feature: "Cloud compute", polysim: "Yes", them: "No" },
      { feature: "Research-grade solvers", polysim: "Yes", them: "No" },
      { feature: "Free education tier", polysim: "Yes", them: "Yes" },
    ],
    theirStrengths: ["Free and beloved in classrooms", "Simple and accessible", "Broad topic coverage"],
    theirWeaknesses: ["Fixed, toy-grade sims", "No cloud compute", "No research path"],
    verdict: "Choose PolySim when students and researchers need real, extensible simulation; PhET is ideal for simple introductory demonstrations.",
  },
];

export const COMPARISONS = DATA;
export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
export function getAllComparisonSlugs(): string[] {
  return COMPARISONS.map((c) => c.slug);
}
