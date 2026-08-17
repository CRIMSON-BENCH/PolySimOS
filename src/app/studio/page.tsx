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
  { slug: "gpu", name: "GPU Compute (WebGPU)", desc: "Hundreds of thousands of particles on your GPU via WGSL shaders.", tag: "WebGPU" },
  { slug: "gpu-fluid", name: "WebGPU Fluid", desc: "High-res GPU smoke advection you can stir.", tag: "WebGPU" },
  { slug: "gpu-nbody", name: "GPU N-Body", desc: "Thousands of bodies, full O(n²) gravity on the GPU.", tag: "WebGPU" },
  { slug: "gpu-pde", name: "GPU PDE Solver", desc: "Steady heat/Poisson via GPU Jacobi at high res.", tag: "WebGPU" },
  { slug: "gpu-fluid-3d", name: "GPU 3D Fluid", desc: "3D smoke, simulated + raymarched on the GPU.", tag: "WebGPU" },
  { slug: "gpu-nbody-pm", name: "Particle-Mesh N-Body", desc: "100k+ bodies via GPU particle-mesh gravity.", tag: "WebGPU" },
  { slug: "cfd-3d", name: "3D CFD", desc: "3D Navier–Stokes plume with z-slices.", tag: "3D Engineering" },
  { slug: "3d", name: "3D N-Body", desc: "Gravitation in 3D with a drag-to-orbit camera.", tag: "3D Physics" },
  { slug: "fea-3d", name: "3D FEA Space Frame", desc: "3D structural analysis; orbit the deformed tower.", tag: "3D Engineering" },
  { slug: "heat-3d", name: "3D Heat Diffusion", desc: "Volumetric heat with slices and orbit view.", tag: "3D PDE" },
  { slug: "fea", name: "FEA Truss", desc: "Finite-element structural analysis: forces & deflection.", tag: "Engineering" },
  { slug: "electromagnetics", name: "Electrostatics", desc: "Charges, potential heatmaps, and field lines.", tag: "Physics" },
  { slug: "molecular-dynamics", name: "Molecular Dynamics", desc: "Lennard-Jones atoms; melt a lattice.", tag: "Chemistry" },
  { slug: "mesh", name: "Meshing + BCs", desc: "Paint boundary conditions; solve steady heat.", tag: "Engineering" },
  { slug: "vector-field", name: "Vector Fields", desc: "Plot any F(x,y) as a live quiver diagram.", tag: "Math" },
  { slug: "optimize", name: "Optimize + UQ", desc: "Gradient descent and Monte-Carlo uncertainty.", tag: "Data" },
  { slug: "notebook", name: "Notebook", desc: "Cells of prose + symbolic math + compute.", tag: "Math" },
  { slug: "double-pendulum", name: "Double Pendulum", desc: "The textbook chaotic system, integrated with RK4.", tag: "Physics" },
  { slug: "projectile", name: "Projectile Motion", desc: "Ballistics with air drag; tune angle and speed.", tag: "Physics" },
  { slug: "ising", name: "Ising Model", desc: "A live magnetic phase transition via Monte Carlo.", tag: "Physics" },
  { slug: "fractals", name: "Fractal Explorer", desc: "Zoom into the Mandelbrot and Julia sets.", tag: "Math" },
  { slug: "fourier", name: "Fourier Series", desc: "Build waves from sine harmonics.", tag: "Math" },
  { slug: "grapher", name: "Function Grapher", desc: "Plot up to three functions at once.", tag: "Math" },
  { slug: "surface-3d", name: "3D Surface Plotter", desc: "Orbit any z = f(x, y) surface.", tag: "Math" },
  { slug: "matrix", name: "Matrix Calculator", desc: "Multiply, invert, determinant, transpose.", tag: "Math" },
  { slug: "attractors", name: "Strange Attractors", desc: "Lorenz, Rössler, Aizawa & more in 3D.", tag: "Physics" },
  { slug: "rlc", name: "RLC Circuit", desc: "Step response and damping regimes.", tag: "Engineering" },
  { slug: "wave-interference", name: "Wave Interference", desc: "Two-source ripple-tank fringes.", tag: "Physics" },
  { slug: "cellular-automata", name: "Cellular Automata", desc: "Wolfram rules & Conway's Life.", tag: "CS / Math" },
  { slug: "random-walk", name: "Random Walk", desc: "Brownian motion and diffusion.", tag: "Physics" },
  { slug: "taylor", name: "Taylor Series", desc: "Polynomial approximation, live.", tag: "Math" },
  { slug: "newton", name: "Newton's Method", desc: "Root finding, tangent by tangent.", tag: "Math" },
  { slug: "distributions", name: "Distributions", desc: "Normal, Poisson, binomial & more.", tag: "Math" },
  { slug: "kepler", name: "Kepler Orbits", desc: "Conic-section orbits under gravity.", tag: "Physics" },
  { slug: "double-slit", name: "Double-Slit", desc: "Quantum interference + diffraction.", tag: "Physics" },
  { slug: "cloth", name: "Cloth / Spring-Mass", desc: "Verlet cloth you can grab and swing.", tag: "Physics" },
  { slug: "gravity-well", name: "Gravity Well", desc: "Curved-spacetime rubber sheet + orbit.", tag: "Physics" },
  { slug: "epidemic-network", name: "Epidemic Network", desc: "Agent-based SIR on a contact graph.", tag: "Bio" },
  { slug: "gradient-descent", name: "Gradient Descent", desc: "Optimization on loss landscapes.", tag: "Data / ML" },
  { slug: "complex", name: "Complex Functions", desc: "Domain coloring of f(z).", tag: "Math" },
  { slug: "sorting", name: "Sorting Visualizer", desc: "Watch algorithms sort in real time.", tag: "CS" },
  { slug: "boids", name: "Boids Flocking", desc: "Emergent flocking from three rules.", tag: "Emergence" },
  { slug: "traffic", name: "Traffic Flow", desc: "Phantom jams from random braking.", tag: "Complex Systems" },
  { slug: "predator-prey", name: "Spatial Predator–Prey", desc: "Agent-based ecology with waves.", tag: "Bio" },
  { slug: "lissajous", name: "Lissajous Curves", desc: "Two sine waves, endless patterns.", tag: "Math" },
  { slug: "magnetic-pendulum", name: "Magnetic Pendulum", desc: "Fractal basins of attraction.", tag: "Physics" },
  { slug: "percolation", name: "Percolation", desc: "A phase transition in connectivity.", tag: "Physics" },
  { slug: "dla", name: "DLA Growth", desc: "Branching fractals from random walks.", tag: "Physics" },
  { slug: "ray-optics", name: "Ray Optics / Lenses", desc: "Trace rays through lenses.", tag: "Physics" },
  { slug: "gas", name: "Gas in a Box", desc: "Kinetic theory → pressure (PV=nRT).", tag: "Physics" },
  { slug: "collisions", name: "Elastic Collisions", desc: "Momentum & energy conservation.", tag: "Physics" },
  { slug: "buoyancy", name: "Buoyancy", desc: "Archimedes — float or sink by density.", tag: "Physics" },
  { slug: "rocket", name: "Rocket Equation", desc: "Tsiolkovsky Δv budget calculator.", tag: "Aerospace" },
  { slug: "blackbody", name: "Blackbody Radiation", desc: "Planck curve + Wien's law.", tag: "Physics" },
  { slug: "pendulum-wave", name: "Pendulum Wave", desc: "Phase art from many periods.", tag: "Physics" },
  { slug: "orbital-transfer", name: "Orbital Transfer", desc: "Hohmann transfer Δv.", tag: "Aerospace" },
  { slug: "standing-waves", name: "Standing Waves", desc: "Harmonics, nodes & antinodes.", tag: "Physics" },
  { slug: "doppler", name: "Doppler Effect", desc: "Moving-source wavefronts & sonic boom.", tag: "Physics" },
  { slug: "snells-law", name: "Snell's Law", desc: "Refraction & total internal reflection.", tag: "Optics" },
  { slug: "diffraction-grating", name: "Diffraction Grating", desc: "N-slit interference maxima.", tag: "Optics" },
  { slug: "beats", name: "Beats", desc: "Two close tones interfere.", tag: "Waves" },
  { slug: "mirror", name: "Curved Mirrors", desc: "Concave/convex ray tracing.", tag: "Optics" },
  { slug: "prism", name: "Prism Dispersion", desc: "White light into a spectrum.", tag: "Optics" },
  { slug: "fft", name: "Fourier Transform", desc: "Signal → frequency spectrum.", tag: "Signals" },
  { slug: "titration", name: "Titration Curve", desc: "pH vs base added; equivalence point.", tag: "Chemistry" },
  { slug: "reaction-kinetics", name: "Reaction Kinetics", desc: "Rate laws & Arrhenius decay.", tag: "Chemistry" },
  { slug: "equilibrium", name: "Chemical Equilibrium", desc: "Le Chatelier shifts.", tag: "Chemistry" },
  { slug: "ph", name: "pH Calculator", desc: "pH/pOH and the acid-base scale.", tag: "Chemistry" },
  { slug: "radioactive-decay", name: "Radioactive Decay", desc: "Half-life exponential decay.", tag: "Chemistry" },
  { slug: "maxwell-boltzmann", name: "Maxwell-Boltzmann", desc: "Molecular speed distribution.", tag: "Chemistry" },
  { slug: "ideal-gas", name: "Ideal Gas Law", desc: "PV = nRT with a live piston.", tag: "Chemistry" },
  { slug: "bifurcation", name: "Bifurcation Diagram", desc: "Logistic map route to chaos.", tag: "Math" },
  { slug: "direction-field", name: "Direction Field", desc: "Slope fields + solution curves.", tag: "Math" },
  { slug: "riemann", name: "Riemann Sums", desc: "Integrals as stacked rectangles.", tag: "Math" },
  { slug: "eigenvectors", name: "Eigenvectors", desc: "2×2 transforms & invariant directions.", tag: "Math" },
  { slug: "markov", name: "Markov Chains", desc: "Converge to a stationary distribution.", tag: "Math" },
  { slug: "parametric", name: "Parametric Grapher", desc: "Trace x(t), y(t) curves.", tag: "Math" },
  { slug: "numerical-methods", name: "Euler vs RK4", desc: "ODE integration accuracy.", tag: "Math" },
  { slug: "pathfinding", name: "A* Pathfinding", desc: "Shortest path, draw walls.", tag: "CS / AI" },
  { slug: "maze", name: "Maze Generator", desc: "Carve & solve perfect mazes.", tag: "CS / AI" },
  { slug: "neural-net", name: "Neural Network", desc: "Train an MLP, watch it learn.", tag: "CS / AI" },
  { slug: "kmeans", name: "k-Means Clustering", desc: "Unsupervised clustering, live.", tag: "CS / AI" },
  { slug: "convex-hull", name: "Convex Hull", desc: "Wrap points in O(n log n).", tag: "CS / AI" },
  { slug: "l-system", name: "L-System Fractals", desc: "Grow plants from grammars.", tag: "CS / AI" },
  { slug: "turing-machine", name: "Turing Machine", desc: "The model of computation.", tag: "CS / AI" },
  { slug: "convolution", name: "Image Convolution", desc: "Kernels behind every CNN.", tag: "CS / AI" },
  { slug: "forest-fire", name: "Forest Fire Model", desc: "Self-organized criticality.", tag: "Complex Systems" },
  { slug: "sandpile", name: "Abelian Sandpile", desc: "Avalanches build a fractal.", tag: "Complex Systems" },
  { slug: "schelling", name: "Schelling Segregation", desc: "Mild bias, sharp segregation.", tag: "Complex Systems" },
  { slug: "langtons-ant", name: "Langton's Ant", desc: "Two rules, emergent highway.", tag: "Complex Systems" },
  { slug: "reaction-diffusion", name: "Reaction-Diffusion", desc: "Gray-Scott Turing patterns.", tag: "Complex Systems" },
  { slug: "wolfram-ca", name: "Elementary CA", desc: "Wolfram's 256 rules.", tag: "Complex Systems" },
  { slug: "genetic-algorithm", name: "Genetic Algorithm", desc: "Evolve toward the peak.", tag: "Complex Systems" },
  { slug: "ant-colony", name: "Ant Colony Optimization", desc: "Swarm-solved TSP.", tag: "Complex Systems" },
  { slug: "fire-spread", name: "Wildfire Spread", desc: "Wind + slope fire behavior.", tag: "First Responders" },
  { slug: "hazmat-plume", name: "Hazmat Plume", desc: "Gaussian dispersion + PAD.", tag: "First Responders" },
  { slug: "evacuation", name: "Building Evacuation", desc: "Egress flow & clear time.", tag: "First Responders" },
  { slug: "triage", name: "START Triage", desc: "Mass-casualty triage tool.", tag: "First Responders" },
  { slug: "hose-flow", name: "Fire Hose Hydraulics", desc: "Friction loss & pump pressure.", tag: "First Responders" },
  { slug: "skid-to-stop", name: "Skid-to-Stop Speed", desc: "Accident reconstruction.", tag: "First Responders" },
  { slug: "radio-range", name: "Radio Range", desc: "VHF/UHF link budget.", tag: "First Responders" },
  { slug: "blast-standoff", name: "Blast Standoff", desc: "Overpressure & safe distance.", tag: "First Responders" },
  { slug: "exoplanet-transit", name: "Exoplanet Transit", desc: "Light-curve transit method.", tag: "Astronomy" },
  { slug: "hr-diagram", name: "H-R Diagram", desc: "The map of the stars.", tag: "Astronomy" },
  { slug: "lagrange-points", name: "Lagrange Points", desc: "Restricted 3-body equilibria.", tag: "Astronomy" },
  { slug: "roche-limit", name: "Roche Limit", desc: "When tides shred a moon.", tag: "Astronomy" },
  { slug: "hubble-law", name: "Hubble's Law", desc: "The expanding universe.", tag: "Astronomy" },
  { slug: "telescope", name: "Telescope Optics", desc: "Resolution & magnification.", tag: "Astronomy" },
  { slug: "parallax", name: "Stellar Parallax", desc: "Distance from angle shift.", tag: "Astronomy" },
  { slug: "escape-velocity", name: "Escape Velocity", desc: "Speed to leave a world.", tag: "Astronomy" },
  { slug: "energy-balance", name: "Energy Balance", desc: "Greenhouse equilibrium temp.", tag: "Earth & Climate" },
  { slug: "daisyworld", name: "Daisyworld", desc: "Planetary self-regulation.", tag: "Earth & Climate" },
  { slug: "milankovitch", name: "Milankovitch Cycles", desc: "Orbital forcing of ice ages.", tag: "Earth & Climate" },
  { slug: "tsunami", name: "Tsunami Propagation", desc: "Shallow-water wave shoaling.", tag: "Earth & Climate" },
  { slug: "carbon-cycle", name: "Carbon Cycle", desc: "Reservoir box model.", tag: "Earth & Climate" },
  { slug: "seismic", name: "Earthquake Shaking", desc: "Magnitude, energy, intensity.", tag: "Earth & Climate" },
  { slug: "groundwater", name: "Groundwater Drawdown", desc: "Well cone of depression.", tag: "Earth & Climate" },
  { slug: "lapse-rate", name: "Lapse Rate", desc: "Atmosphere & cloud base.", tag: "Earth & Climate" },
  { slug: "black-scholes", name: "Black-Scholes", desc: "Option pricing + Greeks.", tag: "Finance" },
  { slug: "option-payoff", name: "Option Payoff", desc: "Strategy P/L diagrams.", tag: "Finance" },
  { slug: "monte-carlo", name: "Monte Carlo (GBM)", desc: "Price-path distributions.", tag: "Finance" },
  { slug: "efficient-frontier", name: "Efficient Frontier", desc: "Portfolio risk vs return.", tag: "Finance" },
  { slug: "value-at-risk", name: "Value at Risk", desc: "VaR & expected shortfall.", tag: "Finance" },
  { slug: "bond-pricing", name: "Bond Pricing", desc: "Price, yield & duration.", tag: "Finance" },
  { slug: "compound-interest", name: "Compound Interest", desc: "Investment growth over time.", tag: "Finance" },
  { slug: "amortization", name: "Loan Amortization", desc: "Mortgage payment breakdown.", tag: "Finance" },
  { slug: "sir-model", name: "SIR Epidemic", desc: "Outbreak compartment model.", tag: "Biology" },
  { slug: "neuron", name: "Hodgkin-Huxley Neuron", desc: "Action potential spikes.", tag: "Biology" },
  { slug: "lotka-volterra", name: "Lotka-Volterra", desc: "Predator-prey cycles.", tag: "Biology" },
  { slug: "hardy-weinberg", name: "Hardy-Weinberg", desc: "Allele frequency & selection.", tag: "Biology" },
  { slug: "enzyme-kinetics", name: "Enzyme Kinetics", desc: "Michaelis-Menten curves.", tag: "Biology" },
  { slug: "logistic-growth", name: "Logistic Growth", desc: "Population carrying capacity.", tag: "Biology" },
  { slug: "genetic-drift", name: "Genetic Drift", desc: "Wright-Fisher allele drift.", tag: "Biology" },
  { slug: "sequence-alignment", name: "Sequence Alignment", desc: "Needleman-Wunsch DNA.", tag: "Biology" },
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
