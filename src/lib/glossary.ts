import { slugify } from "./seo";

export interface Term {
  slug: string;
  term: string;
  category: string;
  definition: string;
  related: string[]; // slugs
  studio?: string;
}

type Seed = [term: string, category: string, definition: string, related?: string[], studio?: string];

const SEEDS: Seed[] = [
  ["Finite Element Analysis", "Methods", "A numerical technique that subdivides a body into small elements to approximate the solution of partial differential equations governing stress, heat, and fields.", ["mesh", "boundary-condition", "stiffness-matrix"]],
  ["Mesh", "Discretization", "The subdivision of a simulation domain into discrete cells or elements over which equations are solved; mesh quality strongly affects accuracy and convergence.", ["finite-element-analysis", "adaptive-mesh-refinement"]],
  ["Boundary Condition", "Setup", "A constraint applied at the edges of a domain — such as fixed temperature, pressure, or displacement — that makes a differential equation well-posed.", ["initial-condition", "dirichlet-condition", "neumann-condition"]],
  ["Initial Condition", "Setup", "The state of a system at the start of a simulation, required to integrate time-dependent equations forward.", ["boundary-condition", "time-stepping"]],
  ["Convergence", "Numerics", "The property that a numerical solution approaches the true solution as the mesh is refined or iterations proceed; failure to converge signals instability or error.", ["residual", "stability", "cfl-condition"]],
  ["Residual", "Numerics", "A measure of how far a candidate solution is from satisfying the governing equations; iterative solvers drive the residual toward zero.", ["convergence", "iteration"]],
  ["Navier–Stokes Equations", "Fluid Dynamics", "The partial differential equations expressing conservation of momentum for a viscous fluid, underpinning all computational fluid dynamics.", ["reynolds-number", "turbulence", "cfd"], "/studio/fluid"],
  ["Reynolds Number", "Fluid Dynamics", "A dimensionless ratio of inertial to viscous forces that predicts whether a flow will be laminar or turbulent.", ["turbulence", "laminar-flow", "navier-stokes-equations"], "/studio/fluid"],
  ["Turbulence", "Fluid Dynamics", "Chaotic, multi-scale fluid motion characterized by eddies and mixing, requiring statistical or resolved models such as RANS or LES.", ["reynolds-number", "vorticity", "cfd"], "/studio/fluid"],
  ["Vorticity", "Fluid Dynamics", "The local spinning motion of a fluid, defined as the curl of the velocity field; a key diagnostic of rotational flow.", ["turbulence", "navier-stokes-equations"], "/studio/fluid"],
  ["Laminar Flow", "Fluid Dynamics", "Smooth, orderly fluid motion in parallel layers, occurring at low Reynolds numbers.", ["reynolds-number", "turbulence"], "/studio/fluid"],
  ["CFD", "Fluid Dynamics", "Computational Fluid Dynamics — the numerical simulation of fluid flow, heat, and mass transfer by discretizing the governing equations.", ["navier-stokes-equations", "finite-volume-method"], "/studio/fluid"],
  ["Runge–Kutta Method", "Numerics", "A family of explicit time-integration schemes for ordinary differential equations; the fourth-order variant (RK4) is a widely used standard.", ["time-stepping", "ordinary-differential-equation"], "/studio/dynamics"],
  ["Ordinary Differential Equation", "Mathematics", "An equation relating a function of one variable to its derivatives; the basis of dynamical-system modeling.", ["runge-kutta-method", "dynamical-system"], "/studio/dynamics"],
  ["Partial Differential Equation", "Mathematics", "An equation involving partial derivatives of a multivariable function, governing fields like heat, waves, and fluid flow.", ["finite-difference-method", "boundary-condition"], "/studio/dynamics"],
  ["Dynamical System", "Mathematics", "A system whose state evolves over time according to fixed rules, studied through fixed points, limit cycles, and attractors.", ["attractor", "bifurcation", "chaos"], "/studio/dynamics"],
  ["Attractor", "Nonlinear Dynamics", "A set of states toward which a dynamical system evolves; strange attractors have fractal structure and signal chaos.", ["chaos", "dynamical-system", "lorenz-system"], "/studio/dynamics"],
  ["Chaos", "Nonlinear Dynamics", "Deterministic behavior so sensitive to initial conditions that long-term prediction becomes impossible despite fixed rules.", ["attractor", "lyapunov-exponent", "bifurcation"], "/studio/dynamics"],
  ["Bifurcation", "Nonlinear Dynamics", "A qualitative change in a system's behavior as a parameter crosses a critical value, such as the onset of oscillation or chaos.", ["chaos", "dynamical-system"], "/studio/dynamics"],
  ["Lyapunov Exponent", "Nonlinear Dynamics", "A number quantifying the exponential rate at which nearby trajectories diverge; a positive value indicates chaos.", ["chaos", "attractor"]],
  ["Lorenz System", "Nonlinear Dynamics", "A three-variable ODE model of convection whose solutions form the iconic butterfly-shaped strange attractor.", ["chaos", "attractor"], "/studio/dynamics"],
  ["Monte Carlo Method", "Numerics", "A computational technique that uses repeated random sampling to estimate integrals, probabilities, and uncertainty.", ["uncertainty-quantification", "stochastic-process"]],
  ["Uncertainty Quantification", "Data", "The discipline of characterizing and propagating uncertainty in model inputs to understand confidence in outputs.", ["monte-carlo-method", "sensitivity-analysis"]],
  ["Sensitivity Analysis", "Data", "The study of how variation in model outputs can be attributed to different sources of variation in inputs.", ["uncertainty-quantification", "parameter-sweep"]],
  ["Surrogate Model", "Scientific ML", "A fast approximation of an expensive simulation, trained on sampled runs to predict outputs in a fraction of the time.", ["radial-basis-function", "gaussian-process", "uncertainty-quantification"], "/studio/surrogate"],
  ["Radial Basis Function", "Scientific ML", "A real-valued function whose value depends only on distance from a center, used to interpolate scattered data and build surrogates.", ["surrogate-model", "interpolation"], "/studio/surrogate"],
  ["Gaussian Process", "Scientific ML", "A probabilistic model over functions that yields both predictions and calibrated uncertainty, popular for surrogate modeling.", ["surrogate-model", "uncertainty-quantification"]],
  ["Stiffness Matrix", "FEA", "The matrix relating nodal displacements to forces in a finite-element model, assembled from element contributions.", ["finite-element-analysis", "mesh"]],
  ["Adaptive Mesh Refinement", "Discretization", "A technique that dynamically increases mesh resolution where the solution changes rapidly, improving accuracy efficiently.", ["mesh", "convergence"]],
  ["CFL Condition", "Numerics", "A stability criterion linking timestep, cell size, and wave speed that explicit schemes must satisfy to remain stable.", ["stability", "time-stepping"]],
  ["Stability", "Numerics", "The property that numerical errors do not grow uncontrollably as a simulation proceeds.", ["cfl-condition", "convergence"]],
  ["Time-Stepping", "Numerics", "The process of advancing a time-dependent simulation in discrete increments using an integration scheme.", ["runge-kutta-method", "cfl-condition"]],
  ["Finite Difference Method", "Methods", "A discretization that approximates derivatives with difference quotients on a structured grid.", ["partial-differential-equation", "finite-volume-method"], "/studio/dynamics"],
  ["Finite Volume Method", "Methods", "A discretization that conserves fluxes across control volumes, standard in computational fluid dynamics.", ["cfd", "finite-difference-method"], "/studio/fluid"],
  ["Reaction–Diffusion", "Mathematics", "A class of PDE systems combining local reactions with diffusion, capable of forming self-organizing Turing patterns.", ["partial-differential-equation", "turing-pattern"], "/studio/dynamics"],
  ["Turing Pattern", "Mathematics", "A spontaneous spatial pattern arising from a reaction–diffusion instability, explaining stripes and spots in nature.", ["reaction-diffusion"], "/studio/dynamics"],
  ["Symbolic Computation", "Mathematics", "Manipulation of mathematical expressions in exact symbolic form — differentiation, simplification, and solving — rather than numerically.", ["computer-algebra-system", "derivative"], "/studio/cas"],
  ["Computer Algebra System", "Mathematics", "Software that performs symbolic mathematics, such as exact differentiation, integration, and equation solving.", ["symbolic-computation"], "/studio/cas"],
  ["Derivative", "Mathematics", "The instantaneous rate of change of a function, central to calculus and to gradient-based simulation methods.", ["symbolic-computation"], "/studio/cas"],
  ["N-Body Problem", "Physics", "The problem of predicting the motion of a group of masses interacting gravitationally, generally unsolvable in closed form for N ≥ 3.", ["orbital-mechanics", "symplectic-integrator"], "/studio/particles"],
  ["Symplectic Integrator", "Numerics", "A time-integration scheme that conserves the geometric structure of Hamiltonian systems, giving excellent long-term energy behavior.", ["n-body-problem", "verlet-integration"], "/studio/particles"],
  ["Verlet Integration", "Numerics", "A stable, time-reversible integration method widely used in molecular dynamics and particle physics.", ["symplectic-integrator", "molecular-dynamics"]],
  ["Molecular Dynamics", "Physics", "A simulation method that integrates Newton's equations for interacting atoms to study material and biomolecular behavior.", ["verlet-integration", "n-body-problem"]],
  ["WebGPU", "Platform", "A modern browser API that exposes GPU compute and rendering, enabling near-native simulation performance without installation.", ["webassembly", "gpu-compute"]],
  ["WebAssembly", "Platform", "A portable binary instruction format that runs near-native code in the browser, powering fast in-browser solvers.", ["webgpu"]],
  ["Compute Token", "Platform", "PolySim's metered unit for cloud computation; local rendering is free, and tokens pay only for cloud-scale solves.", ["hybrid-compute"]],
  ["SIR Model", "Biology", "A compartmental epidemiology model dividing a population into Susceptible, Infected, and Recovered groups to study outbreaks.", ["dynamical-system", "ordinary-differential-equation"], "/studio/dynamics"],
  ["Lotka–Volterra Model", "Biology", "Coupled equations describing predator–prey population oscillations, foundational to theoretical ecology.", ["dynamical-system"], "/studio/dynamics"],
  ["Poisson Equation", "Mathematics", "An elliptic PDE relating a potential field to its source, appearing in electrostatics, gravity, and incompressible flow.", ["partial-differential-equation", "boundary-condition"]],
  ["Dirichlet Condition", "Setup", "A boundary condition that fixes the value of the solution on the boundary, such as a prescribed temperature.", ["boundary-condition", "neumann-condition"]],
  ["Neumann Condition", "Setup", "A boundary condition that fixes the derivative (flux) of the solution on the boundary, such as an insulated wall.", ["boundary-condition", "dirichlet-condition"]],
  ["Interpolation", "Numerics", "Estimating values between known data points, used in meshing, advection, and surrogate modeling.", ["radial-basis-function"]],
  ["Stochastic Process", "Mathematics", "A mathematical model of a system evolving with randomness over time, such as Brownian motion.", ["monte-carlo-method"]],
  ["GPU Compute", "Platform", "Using a graphics processor's massive parallelism for general numerical computation, key to fast in-browser simulation.", ["webgpu"]],
  ["Hybrid Compute", "Platform", "PolySim's model of running locally by default and bursting to cloud GPUs only when a problem is too large for the device.", ["compute-token", "webgpu"]],
  ["Orbital Mechanics", "Physics", "The study of the motion of bodies under gravity, from satellites to planetary systems.", ["n-body-problem"], "/studio/particles"],
];

export const GLOSSARY: Term[] = SEEDS.map((s) => {
  const [term, category, definition, related, studio] = s;
  return { slug: slugify(term), term, category, definition, related: related ?? [], studio };
});

export function getTerm(slug: string): Term | undefined {
  return GLOSSARY.find((t) => t.slug === slug);
}
export function getAllTermSlugs(): string[] {
  return GLOSSARY.map((t) => t.slug);
}
