import { slugify } from "./seo";

export interface Method {
  slug: string;
  name: string;
  category: string;
  summary: string;
  detail: string;
  bestFor: string[];
}

type Seed = [name: string, category: string, summary: string, detail: string, bestFor: string[]];

const SEEDS: Seed[] = [
  ["Finite Element Method (FEM)", "Discretization", "Divides a domain into elements to solve PDEs for stress, heat, and fields.", "FEM approximates a continuous field with piecewise basis functions over a mesh, assembling a large sparse system that is solved for nodal values. It is the workhorse of structural, thermal, and electromagnetic analysis.", ["Structural stress", "Heat transfer", "Electromagnetics"]],
  ["Finite Volume Method (FVM)", "Discretization", "Conserves fluxes across control volumes — the standard for CFD.", "FVM integrates conservation laws over control volumes so mass, momentum, and energy are conserved discretely, making it robust for fluid flow and transport.", ["CFD", "Heat transfer", "Combustion"]],
  ["Finite Difference Method (FDM)", "Discretization", "Approximates derivatives on a structured grid.", "FDM replaces derivatives with difference quotients on a regular grid — simple to implement and ideal for diffusion, wave, and reaction–diffusion PDEs.", ["Diffusion", "Wave equations", "Reaction–diffusion"]],
  ["Runge–Kutta (RK4)", "Time integration", "A fourth-order explicit scheme for ODE initial-value problems.", "RK4 evaluates the derivative at four stages per step to achieve fourth-order accuracy, balancing accuracy and cost for non-stiff ODE systems.", ["ODE systems", "Dynamical systems", "Orbital mechanics"]],
  ["Semi-Implicit Euler", "Time integration", "A symplectic first-order integrator for mechanics.", "Semi-implicit (symplectic) Euler updates velocity before position, conserving energy well over long runs — the default for real-time particle and rigid-body physics.", ["Particle physics", "Rigid bodies", "Games"]],
  ["Verlet Integration", "Time integration", "A stable, time-reversible scheme for molecular and particle systems.", "Verlet integration derives positions from previous positions and acceleration, offering excellent long-term energy stability for molecular dynamics and cloth.", ["Molecular dynamics", "Cloth", "Particles"]],
  ["Semi-Lagrangian Advection", "Fluid", "Unconditionally stable advection used in stable-fluids solvers.", "Semi-Lagrangian schemes trace characteristics backward in time and interpolate, giving stability at large timesteps — the basis of Stam's Stable Fluids.", ["Real-time CFD", "Smoke & fire", "Weather"]],
  ["Jacobi / Gauss–Seidel Iteration", "Linear solvers", "Iterative solvers for large sparse linear systems.", "These stationary iterative methods relax toward the solution of Ax=b, used inside pressure projection and diffusion steps of fluid and thermal solvers.", ["Pressure projection", "Diffusion", "Poisson problems"]],
  ["Conjugate Gradient (CG)", "Linear solvers", "A Krylov solver for symmetric positive-definite systems.", "CG minimizes the residual over expanding Krylov subspaces, converging far faster than stationary methods for SPD systems common in FEM.", ["FEM systems", "Poisson solves", "Optimization"]],
  ["Monte Carlo", "Stochastic", "Uses random sampling to estimate integrals and probabilities.", "Monte Carlo methods sample random inputs to estimate expectations, integrals, and risk — invaluable when dimensionality defeats deterministic quadrature.", ["Uncertainty", "High-dim integrals", "Risk"]],
  ["Molecular Dynamics (MD)", "Particle", "Integrates Newton's equations for interacting atoms.", "MD evolves atomic positions under interatomic potentials to reveal thermodynamic and transport properties from first principles.", ["Materials", "Biomolecules", "Diffusion"]],
  ["Smoothed-Particle Hydrodynamics (SPH)", "Fluid", "A meshless, particle-based fluid method.", "SPH represents a fluid as particles carrying properties smoothed by a kernel, excelling at free-surface and splashing flows without a grid.", ["Free-surface flow", "Splashes", "Astrophysics"]],
  ["Lattice Boltzmann Method (LBM)", "Fluid", "Models fluids via particle distributions on a lattice.", "LBM evolves discrete velocity distributions with a collision–streaming update, naturally parallel and well-suited to complex boundaries.", ["Porous media", "Microfluidics", "GPU CFD"]],
  ["Spectral Methods", "Discretization", "Represents solutions as sums of global basis functions.", "Spectral methods expand the solution in Fourier or Chebyshev modes for exponential accuracy on smooth problems.", ["Turbulence", "Wave propagation", "Periodic domains"]],
  ["Boundary Element Method (BEM)", "Discretization", "Solves PDEs by discretizing only the boundary.", "BEM reformulates certain PDEs as boundary integral equations, reducing dimensionality for exterior and acoustic problems.", ["Acoustics", "Electrostatics", "Exterior flow"]],
  ["Newton–Raphson", "Nonlinear solvers", "Iteratively solves nonlinear equations via linearization.", "Newton's method uses the Jacobian to converge quadratically on roots of nonlinear systems, central to implicit and steady-state solves.", ["Nonlinear FEA", "Steady state", "Equilibrium"]],
  ["Radial Basis Function (RBF) Interpolation", "Surrogate", "Interpolates scattered data with radial kernels.", "RBF interpolation fits smooth functions through scattered samples, a fast and accurate basis for surrogate models and meshless methods.", ["Surrogates", "Scattered data", "Meshless PDEs"]],
  ["Gaussian Process Regression", "Surrogate", "A probabilistic surrogate with uncertainty estimates.", "GPs model outputs as draws from a distribution over functions, giving both predictions and calibrated uncertainty for expensive simulations.", ["Surrogates", "Bayesian optimization", "UQ"]],
  ["Physics-Informed Neural Networks (PINNs)", "Scientific ML", "Neural nets constrained to satisfy governing equations.", "PINNs embed PDE residuals in the loss so the network learns solutions consistent with physics from sparse data.", ["Inverse problems", "Sparse data", "PDE surrogates"]],
  ["Adaptive Mesh Refinement (AMR)", "Meshing", "Concentrates resolution where the solution varies fastest.", "AMR dynamically refines the mesh near steep gradients and shocks, delivering accuracy where it matters without global cost.", ["Shocks", "Boundary layers", "Fronts"]],
  ["Turbulence Modeling (RANS/LES)", "Fluid", "Models unresolved turbulent scales.", "RANS averages the flow and models turbulence, while LES resolves large eddies and models the small ones — trading cost for fidelity.", ["Aerodynamics", "HVAC", "Combustion"]],
  ["Multigrid Methods", "Linear solvers", "Accelerates convergence across grid scales.", "Multigrid solves error components on a hierarchy of grids, achieving near-optimal convergence for elliptic problems.", ["Poisson solves", "Large FEM", "Pressure"]],
  ["Discrete Element Method (DEM)", "Particle", "Simulates granular media as interacting particles.", "DEM tracks individual grains and their contacts to model powders, soils, and bulk solids.", ["Granular flow", "Powders", "Geotechnics"]],
  ["Level-Set Method", "Interface", "Tracks moving interfaces implicitly.", "Level-set methods represent an interface as the zero contour of a field, handling topology changes in multiphase flow and fronts.", ["Multiphase flow", "Combustion fronts", "Image segmentation"]],
  ["Kalman Filtering", "Estimation", "Optimally fuses noisy measurements with a model.", "The Kalman filter recursively estimates the state of a dynamical system from noisy observations, foundational in control and data assimilation.", ["Data assimilation", "Tracking", "Control"]],
  ["Bifurcation Analysis", "Dynamical", "Maps how solutions change with parameters.", "Bifurcation analysis locates parameter values where the qualitative behavior of a system changes, revealing tipping points and instabilities.", ["Stability", "Tipping points", "Nonlinear dynamics"]],
];

// Expand the catalog with method × sub-variant combinations to broaden coverage.
const VARIANTS = ["Explicit", "Implicit", "2D", "3D", "Transient", "Steady-State", "GPU-Accelerated"];

export const METHODS: Method[] = (() => {
  const base: Method[] = SEEDS.map((s) => {
    const [name, category, summary, detail, bestFor] = s;
    return { slug: slugify(name), name, category, summary, detail, bestFor };
  });
  // add a curated set of variant pages for the top discretization/fluid methods
  const expandable = base.filter((m) => ["Discretization", "Fluid", "Time integration"].includes(m.category));
  const extra: Method[] = [];
  for (const m of expandable) {
    for (const v of VARIANTS) {
      const name = `${v} ${m.name}`;
      extra.push({
        slug: slugify(name),
        name,
        category: m.category,
        summary: `${v} formulation of the ${m.name.toLowerCase()}. ${m.summary}`,
        detail: `This is the ${v.toLowerCase()} variant of the ${m.name}. ${m.detail}`,
        bestFor: m.bestFor,
      });
    }
  }
  return [...base, ...extra];
})();

export function getMethod(slug: string): Method | undefined {
  return METHODS.find((m) => m.slug === slug);
}
export function getAllMethodSlugs(): string[] {
  return METHODS.map((m) => m.slug);
}
