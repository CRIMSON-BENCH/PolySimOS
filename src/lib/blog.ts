import { slugify } from "./seo";

export interface Article {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  sections: { heading: string; body: string }[];
}

type Seed = [title: string, category: string, excerpt: string, date: string, sections: [string, string][]];

const SEEDS: Seed[] = [
  ["Why Simulation Belongs in the Browser", "Platform", "WebGPU has quietly made the browser a serious simulation platform. Here's what that changes.", "2026-02-10", [
    ["The old bargain", "For decades, real simulation meant a desktop license, a beefy workstation, and a steep learning curve. That bargain excluded students, indie researchers, and anyone without a budget line for CAE software."],
    ["What WebGPU changed", "WebGPU exposes modern GPU compute directly to the browser, with roughly 95% global coverage as of 2026. Combined with WebAssembly, it lets real solvers run at near-native speed on hardware you already own."],
    ["Local-first economics", "When rendering is local, it's free. Cloud compute becomes an option you reach for deliberately — for a large job — rather than a toll you pay on every run. That flips the cost model from subscription-by-default to pay-only-when-you-scale."],
    ["What's now possible", "Interactive teaching labs, reproducible research you can share as a link, and AI copilots that turn plain English into runnable models — all without an install. The browser is no longer a compromise; for many workflows it's the better tool."],
  ]],
  ["Surrogate Models, Explained for Practitioners", "AI", "How a fast machine-learning stand-in can replace an expensive solver — and when it shouldn't.", "2026-03-04", [
    ["The core idea", "A surrogate model learns the input-output behavior of an expensive simulation from a set of sample runs. Once trained, it predicts new outputs almost instantly, trading a one-time training cost for near-free inference."],
    ["How they're built", "You sample the real solver across a parameter grid, then fit an interpolator — radial basis functions, Gaussian processes, or neural networks. PolySim's built-in surrogate uses RBF interpolation with ridge regularization."],
    ["Reading the accuracy", "Always evaluate a surrogate on held-out data (R², RMSE). A surrogate is only trustworthy inside the region it was trained on; extrapolation is where they fail silently."],
    ["When to use one", "Reach for a surrogate in optimization loops, real-time dashboards, and design exploration — anywhere you'd otherwise re-run a slow solve thousands of times. Keep the full solver for final validation."],
  ]],
  ["A Field Guide to Numerical Integration", "Methods", "Euler, RK4, and symplectic schemes — which to pick and why it matters.", "2026-03-20", [
    ["Why the scheme matters", "The integrator you choose determines whether your simulation is accurate, stable, and physically faithful over long runs. The wrong choice can inject or drain energy that shouldn't change."],
    ["Explicit Euler and its limits", "Simple and cheap, but only first-order accurate and prone to instability at large timesteps. Fine for quick sketches, risky for anything stiff or long-running."],
    ["RK4: the workhorse", "Fourth-order Runge–Kutta gives an excellent accuracy-cost balance for non-stiff systems and is the default for most ODE work in PolySim's dynamics engine."],
    ["Symplectic integrators", "For mechanics, symplectic (energy-preserving) schemes like semi-implicit Euler and Verlet keep orbits and oscillators stable over millions of steps — which is why they power the particle engine."],
  ]],
  ["Turing Patterns: How Chemistry Makes Stripes", "Biology", "The reaction–diffusion math behind animal coats, and how to run it yourself.", "2026-04-01", [
    ["Turing's insight", "In 1952 Alan Turing proposed that two chemicals — an activator and an inhibitor — diffusing at different rates could spontaneously form stable patterns. It was decades ahead of the biology that confirmed it."],
    ["The Gray–Scott model", "Gray–Scott is a two-species reaction–diffusion system whose feed and kill rates select between spots, stripes, and self-replicating mazes. Small parameter changes produce dramatically different patterns."],
    ["Running it live", "PolySim's dynamics studio integrates Gray–Scott with an explicit finite-difference Laplacian on a periodic grid, so you can drag the feed and kill sliders and watch the pattern regime shift in real time."],
  ]],
  ["From COMSOL to the Browser: A Migration Story", "Guides", "What actually changes when you move multiphysics work out of a desktop license.", "2026-04-18", [
    ["The trigger", "For many teams it's a renewal quote — base license plus per-module fees climbing past what the usage justifies. That's when browser-native alternatives get a serious look."],
    ["What maps cleanly", "Geometry, materials, boundary conditions, and standard solver settings translate directly. PolySim's AI Copilot can rebuild much of a setup from a description or pasted parameters."],
    ["Validating the move", "The right first step is to reproduce a benchmark you already trust and compare results side by side. Once a known case matches, you can move real work with confidence."],
  ]],
  ["The Case for Reproducible Simulation", "Research", "Why a simulation you can't reproduce isn't really a result — and how to fix it.", "2026-05-06", [
    ["The reproducibility gap", "Too many published simulations can't be rerun: the solver version, seed, mesh, and parameters are lost. That's a problem for science and for your future self."],
    ["Pinning everything", "Reproducibility means pinning the solver version, random seed, and full parameter set, then archiving them together. PolySim's reproducibility bundle does this in one click."],
    ["Citable by design", "Minting a DOI for a simulation turns it into a first-class research artifact others can cite and build on — closing the loop between computation and publication."],
  ]],
  ["Chaos in Five Minutes: The Lorenz Attractor", "Physics", "How three simple equations shattered the dream of long-term prediction.", "2026-05-22", [
    ["A weather model gone strange", "Edward Lorenz distilled atmospheric convection into three ODEs and found that tiny changes in initial conditions led to wildly different outcomes — deterministic yet unpredictable."],
    ["The butterfly", "Plotted in phase space, the solutions trace a butterfly-shaped strange attractor: bounded, never repeating, infinitely detailed. It became the emblem of chaos theory."],
    ["See it yourself", "Open the dynamics studio, select the Lorenz system, and nudge the Rayleigh number ρ. Watch the trajectory reorganize as the system passes through its bifurcations."],
  ]],
  ["Ten Simulations Every Engineering Student Should Run", "Education", "A hands-on curriculum you can work through free, in the browser.", "2026-06-11", [
    ["Start with mechanics", "Projectile motion, orbital mechanics, and collisions build intuition for forces and energy — and they're visually immediate in the particle studio."],
    ["Move to fields and flow", "The heat equation and a 2D fluid solver introduce PDEs and the idea of a field evolving in space and time."],
    ["Finish with dynamics and math", "Lorenz chaos, the SIR epidemic model, and a symbolic-calculus session tie together nonlinear dynamics and the math underneath every simulation."],
  ]],
];

export const ARTICLES: Article[] = SEEDS.map((s) => {
  const [title, category, excerpt, date, sections] = s;
  return { slug: slugify(title), title, category, excerpt, date, sections: sections.map(([heading, body]) => ({ heading, body })) };
});

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
export function getAllArticleSlugs(): string[] {
  return ARTICLES.map((a) => a.slug);
}
