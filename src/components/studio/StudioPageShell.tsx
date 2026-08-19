import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Disclaimer } from "@/components/Disclaimer";
import { JsonLd } from "@/components/JsonLd";
import { CrossLinks } from "@/components/CrossLinks";
import { softwareAppLd, faqLd, howToLd } from "@/lib/seo";
import { EmbedButton } from "./EmbedButton";
import { MonetizationBar } from "@/components/monetization/Slots";
import { ProGatedUpsell } from "@/components/monetization/ProGatedUpsell";
import { SaveResultsPrompt } from "@/components/monetization/SaveResultsPrompt";
import { AiSolverAssist } from "./AiSolverAssist";
import { SIMS } from "@/app/studio/page";

const OTHER_SIMS = [
  { name: "Visual Node Graph", href: "/studio/graph" },
  { name: "Particle / N-Body", href: "/studio/particles" },
  { name: "2D Fluid (CFD)", href: "/studio/fluid" },
  { name: "Dynamical Systems", href: "/studio/dynamics" },
  { name: "Heat & Wave Fields", href: "/studio/fields" },
  { name: "Symbolic Math", href: "/studio/cas" },
  { name: "AI Surrogate", href: "/studio/surrogate" },
  { name: "GPU Compute (WebGPU)", href: "/studio/gpu" },
  { name: "WebGPU Fluid", href: "/studio/gpu-fluid" },
  { name: "GPU N-Body", href: "/studio/gpu-nbody" },
  { name: "GPU PDE Solver", href: "/studio/gpu-pde" },
  { name: "GPU 3D Fluid", href: "/studio/gpu-fluid-3d" },
  { name: "Particle-Mesh N-Body", href: "/studio/gpu-nbody-pm" },
  { name: "3D CFD", href: "/studio/cfd-3d" },
  { name: "3D N-Body", href: "/studio/3d" },
  { name: "3D FEA Space Frame", href: "/studio/fea-3d" },
  { name: "3D Heat Diffusion", href: "/studio/heat-3d" },
  { name: "FEA Truss", href: "/studio/fea" },
  { name: "Electrostatics", href: "/studio/electromagnetics" },
  { name: "Molecular Dynamics", href: "/studio/molecular-dynamics" },
  { name: "Meshing + BCs", href: "/studio/mesh" },
  { name: "Vector Fields", href: "/studio/vector-field" },
  { name: "Optimize + UQ", href: "/studio/optimize" },
  { name: "Notebook", href: "/studio/notebook" },
  { name: "Double Pendulum", href: "/studio/double-pendulum" },
  { name: "Projectile Motion", href: "/studio/projectile" },
  { name: "Ising Model", href: "/studio/ising" },
  { name: "Fractal Explorer", href: "/studio/fractals" },
  { name: "Fourier Series", href: "/studio/fourier" },
  { name: "Function Grapher", href: "/studio/grapher" },
  { name: "3D Surface Plotter", href: "/studio/surface-3d" },
  { name: "Matrix Calculator", href: "/studio/matrix" },
  { name: "Strange Attractors", href: "/studio/attractors" },
  { name: "RLC Circuit", href: "/studio/rlc" },
  { name: "Wave Interference", href: "/studio/wave-interference" },
  { name: "Cellular Automata", href: "/studio/cellular-automata" },
  { name: "Random Walk", href: "/studio/random-walk" },
  { name: "Taylor Series", href: "/studio/taylor" },
  { name: "Newton's Method", href: "/studio/newton" },
  { name: "Distributions", href: "/studio/distributions" },
  { name: "Kepler Orbits", href: "/studio/kepler" },
  { name: "Double-Slit", href: "/studio/double-slit" },
  { name: "Cloth / Spring-Mass", href: "/studio/cloth" },
  { name: "Gravity Well", href: "/studio/gravity-well" },
  { name: "Epidemic Network", href: "/studio/epidemic-network" },
  { name: "Gradient Descent", href: "/studio/gradient-descent" },
  { name: "Complex Functions", href: "/studio/complex" },
  { name: "Sorting Visualizer", href: "/studio/sorting" },
  { name: "Boids Flocking", href: "/studio/boids" },
  { name: "Traffic Flow", href: "/studio/traffic" },
  { name: "Spatial Predator–Prey", href: "/studio/predator-prey" },
  { name: "Lissajous Curves", href: "/studio/lissajous" },
  { name: "Magnetic Pendulum", href: "/studio/magnetic-pendulum" },
  { name: "Percolation", href: "/studio/percolation" },
  { name: "DLA Growth", href: "/studio/dla" },
  { name: "Ray Optics / Lenses", href: "/studio/ray-optics" },
  { name: "Gas in a Box", href: "/studio/gas" },
  { name: "Elastic Collisions", href: "/studio/collisions" },
  { name: "Buoyancy", href: "/studio/buoyancy" },
  { name: "Rocket Equation", href: "/studio/rocket" },
  { name: "Blackbody Radiation", href: "/studio/blackbody" },
  { name: "Pendulum Wave", href: "/studio/pendulum-wave" },
  { name: "Orbital Transfer", href: "/studio/orbital-transfer" },
  { name: "Standing Waves", href: "/studio/standing-waves" },
  { name: "Doppler Effect", href: "/studio/doppler" },
  { name: "Snell's Law", href: "/studio/snells-law" },
  { name: "Diffraction Grating", href: "/studio/diffraction-grating" },
  { name: "Beats", href: "/studio/beats" },
  { name: "Curved Mirrors", href: "/studio/mirror" },
  { name: "Prism Dispersion", href: "/studio/prism" },
  { name: "Fourier Transform", href: "/studio/fft" },
  { name: "Titration Curve", href: "/studio/titration" },
  { name: "Reaction Kinetics", href: "/studio/reaction-kinetics" },
  { name: "Chemical Equilibrium", href: "/studio/equilibrium" },
  { name: "pH Calculator", href: "/studio/ph" },
  { name: "Radioactive Decay", href: "/studio/radioactive-decay" },
  { name: "Maxwell-Boltzmann", href: "/studio/maxwell-boltzmann" },
  { name: "Ideal Gas Law", href: "/studio/ideal-gas" },
  { name: "Bifurcation Diagram", href: "/studio/bifurcation" },
  { name: "Direction Field", href: "/studio/direction-field" },
  { name: "Riemann Sums", href: "/studio/riemann" },
  { name: "Eigenvectors", href: "/studio/eigenvectors" },
  { name: "Markov Chains", href: "/studio/markov" },
  { name: "Parametric Grapher", href: "/studio/parametric" },
  { name: "Euler vs RK4", href: "/studio/numerical-methods" },
  { name: "A* Pathfinding", href: "/studio/pathfinding" },
  { name: "Maze Generator", href: "/studio/maze" },
  { name: "Neural Network", href: "/studio/neural-net" },
  { name: "k-Means Clustering", href: "/studio/kmeans" },
  { name: "Convex Hull", href: "/studio/convex-hull" },
  { name: "L-System Fractals", href: "/studio/l-system" },
  { name: "Turing Machine", href: "/studio/turing-machine" },
  { name: "Image Convolution", href: "/studio/convolution" },
  { name: "Forest Fire Model", href: "/studio/forest-fire" },
  { name: "Abelian Sandpile", href: "/studio/sandpile" },
  { name: "Schelling Segregation", href: "/studio/schelling" },
  { name: "Langton's Ant", href: "/studio/langtons-ant" },
  { name: "Reaction-Diffusion", href: "/studio/reaction-diffusion" },
  { name: "Cellular Automata (Wolfram)", href: "/studio/wolfram-ca" },
  { name: "Genetic Algorithm", href: "/studio/genetic-algorithm" },
  { name: "Ant Colony Optimization", href: "/studio/ant-colony" },
  { name: "Wildfire Spread", href: "/studio/fire-spread" },
  { name: "Hazmat Plume", href: "/studio/hazmat-plume" },
  { name: "Building Evacuation", href: "/studio/evacuation" },
  { name: "START Triage", href: "/studio/triage" },
  { name: "Fire Hose Hydraulics", href: "/studio/hose-flow" },
  { name: "Skid-to-Stop Speed", href: "/studio/skid-to-stop" },
  { name: "Radio Range", href: "/studio/radio-range" },
  { name: "Blast Standoff", href: "/studio/blast-standoff" },
  { name: "Exoplanet Transit", href: "/studio/exoplanet-transit" },
  { name: "H-R Diagram", href: "/studio/hr-diagram" },
  { name: "Lagrange Points", href: "/studio/lagrange-points" },
  { name: "Roche Limit", href: "/studio/roche-limit" },
  { name: "Hubble's Law", href: "/studio/hubble-law" },
  { name: "Telescope Optics", href: "/studio/telescope" },
  { name: "Stellar Parallax", href: "/studio/parallax" },
  { name: "Escape Velocity", href: "/studio/escape-velocity" },
  { name: "Energy Balance", href: "/studio/energy-balance" },
  { name: "Daisyworld", href: "/studio/daisyworld" },
  { name: "Milankovitch Cycles", href: "/studio/milankovitch" },
  { name: "Tsunami Propagation", href: "/studio/tsunami" },
  { name: "Carbon Cycle", href: "/studio/carbon-cycle" },
  { name: "Earthquake Shaking", href: "/studio/seismic" },
  { name: "Groundwater Drawdown", href: "/studio/groundwater" },
  { name: "Lapse Rate", href: "/studio/lapse-rate" },
  { name: "Black-Scholes", href: "/studio/black-scholes" },
  { name: "Option Payoff", href: "/studio/option-payoff" },
  { name: "Monte Carlo (GBM)", href: "/studio/monte-carlo" },
  { name: "Efficient Frontier", href: "/studio/efficient-frontier" },
  { name: "Value at Risk", href: "/studio/value-at-risk" },
  { name: "Bond Pricing", href: "/studio/bond-pricing" },
  { name: "Compound Interest", href: "/studio/compound-interest" },
  { name: "Loan Amortization", href: "/studio/amortization" },
  { name: "SIR Epidemic", href: "/studio/sir-model" },
  { name: "Hodgkin-Huxley Neuron", href: "/studio/neuron" },
  { name: "Lotka-Volterra", href: "/studio/lotka-volterra" },
  { name: "Hardy-Weinberg", href: "/studio/hardy-weinberg" },
  { name: "Enzyme Kinetics", href: "/studio/enzyme-kinetics" },
  { name: "Logistic Growth", href: "/studio/logistic-growth" },
  { name: "Genetic Drift", href: "/studio/genetic-drift" },
  { name: "Sequence Alignment", href: "/studio/sequence-alignment" },
  { name: "Beam Deflection", href: "/studio/beam-deflection" },
  { name: "Column Buckling", href: "/studio/column-buckling" },
  { name: "Mohr's Circle", href: "/studio/mohrs-circle" },
  { name: "Shear & Moment", href: "/studio/shear-moment" },
  { name: "Retaining Wall", href: "/studio/retaining-wall" },
  { name: "Seismic Base Shear", href: "/studio/base-shear" },
  { name: "Soil Bearing", href: "/studio/soil-bearing" },
  { name: "Concrete Beam", href: "/studio/concrete-beam" },
  { name: "Bode Plot", href: "/studio/bode-plot" },
  { name: "Filter Designer", href: "/studio/filter-designer" },
  { name: "PID Controller", href: "/studio/pid-control" },
  { name: "Transmission Line", href: "/studio/transmission-line" },
  { name: "Op-Amp Circuits", href: "/studio/op-amp" },
  { name: "Three-Phase Power", href: "/studio/three-phase" },
  { name: "Transistor Bias", href: "/studio/transistor-bias" },
  { name: "Sampling & Aliasing", href: "/studio/aliasing" },
  { name: "Hypothesis Test", href: "/studio/hypothesis-test" },
  { name: "Linear Regression", href: "/studio/linear-regression" },
  { name: "Central Limit Theorem", href: "/studio/central-limit" },
  { name: "Confidence Intervals", href: "/studio/confidence-interval" },
  { name: "Bayesian Inference", href: "/studio/bayes-inference" },
  { name: "Bootstrap", href: "/studio/bootstrap" },
  { name: "PCA", href: "/studio/pca" },
  { name: "A/B Test", href: "/studio/ab-test" },
  { name: "Forward Kinematics", href: "/studio/forward-kinematics" },
  { name: "Inverse Kinematics", href: "/studio/inverse-kinematics" },
  { name: "Differential Drive", href: "/studio/differential-drive" },
  { name: "Cart-Pole Balance", href: "/studio/cart-pole" },
  { name: "Quadcopter Control", href: "/studio/quadcopter" },
  { name: "RRT Path Planning", href: "/studio/rrt" },
  { name: "DC Motor", href: "/studio/dc-motor" },
  { name: "Kalman Filter", href: "/studio/kalman-filter" },
  { name: "Particle in a Box", href: "/studio/particle-box" },
  { name: "Quantum Tunneling", href: "/studio/quantum-tunneling" },
  { name: "Bloch Sphere", href: "/studio/bloch-sphere" },
  { name: "Hydrogen Orbitals", href: "/studio/hydrogen-orbitals" },
  { name: "Special Relativity", href: "/studio/special-relativity" },
  { name: "Photoelectric Effect", href: "/studio/photoelectric" },
  { name: "Quantum Harmonic Oscillator", href: "/studio/quantum-harmonic" },
  { name: "Stern-Gerlach", href: "/studio/stern-gerlach" },
  { name: "Harmonic Series", href: "/studio/harmonic-series" },
  { name: "Equal Temperament", href: "/studio/equal-temperament" },
  { name: "Chladni Plates", href: "/studio/chladni" },
  { name: "Helmholtz Resonator", href: "/studio/helmholtz-resonator" },
  { name: "Room Modes", href: "/studio/room-modes" },
  { name: "Reverb Time", href: "/studio/reverb-time" },
  { name: "Sound Levels", href: "/studio/sound-levels" },
  { name: "Additive Synthesis", href: "/studio/additive-synthesis" },
  { name: "Stress-Strain Curve", href: "/studio/stress-strain" },
  { name: "Carnot Cycle", href: "/studio/carnot-cycle" },
  { name: "Otto Cycle", href: "/studio/otto-cycle" },
  { name: "Phase Diagram", href: "/studio/phase-diagram" },
  { name: "Thermal Expansion", href: "/studio/thermal-expansion" },
  { name: "Fatigue (S-N)", href: "/studio/fatigue" },
  { name: "Entropy", href: "/studio/entropy" },
  { name: "Thermal Resistance", href: "/studio/thermal-resistance" },
  { name: "Linear Programming", href: "/studio/linear-programming" },
  { name: "0/1 Knapsack", href: "/studio/knapsack" },
  { name: "M/M/1 Queue", href: "/studio/queueing" },
  { name: "Economic Order Quantity", href: "/studio/eoq" },
  { name: "Simulated Annealing", href: "/studio/simulated-annealing" },
  { name: "Critical Path", href: "/studio/critical-path" },
  { name: "Game Theory (Nash)", href: "/studio/game-theory" },
  { name: "Maximum Flow", href: "/studio/max-flow" },
  { name: "Shortest Path", href: "/studio/shortest-path" },
  { name: "Spanning Tree", href: "/studio/spanning-tree" },
  { name: "Graph Coloring", href: "/studio/graph-coloring" },
  { name: "Small-World Network", href: "/studio/small-world" },
  { name: "PageRank", href: "/studio/pagerank" },
  { name: "Bipartite Matching", href: "/studio/bipartite-matching" },
  { name: "Network Centrality", href: "/studio/centrality" },
  { name: "Graph Traversal", href: "/studio/graph-traversal" },
  { name: "Supply & Demand", href: "/studio/supply-demand" },
  { name: "Price Elasticity", href: "/studio/elasticity" },
  { name: "Monopoly Pricing", href: "/studio/monopoly" },
  { name: "Cobb-Douglas", href: "/studio/cobb-douglas" },
  { name: "Lorenz Curve & Gini", href: "/studio/lorenz-gini" },
  { name: "Laffer Curve", href: "/studio/laffer-curve" },
  { name: "Comparative Advantage", href: "/studio/comparative-advantage" },
  { name: "Consumer Choice", href: "/studio/indifference-curves" },
  { name: "Airfoil Lift & Drag", href: "/studio/airfoil-polar" },
  { name: "Glide Performance", href: "/studio/glide" },
  { name: "Rocket Staging", href: "/studio/rocket-staging" },
  { name: "Atmospheric Reentry", href: "/studio/reentry" },
  { name: "Standard Atmosphere", href: "/studio/standard-atmosphere" },
  { name: "Mach Cone", href: "/studio/mach-cone" },
  { name: "Propeller Thrust", href: "/studio/propeller" },
  { name: "Orbital Elements", href: "/studio/orbital-elements" },
  { name: "Atmospheric Stability", href: "/studio/atmospheric-stability" },
  { name: "Coriolis Effect", href: "/studio/coriolis" },
  { name: "Hurricane Model", href: "/studio/hurricane" },
  { name: "Wind Chill & Heat Index", href: "/studio/wind-chill" },
  { name: "Psychrometrics", href: "/studio/psychrometrics" },
  { name: "Geostrophic Wind", href: "/studio/geostrophic-wind" },
  { name: "Rossby Waves", href: "/studio/rossby-waves" },
  { name: "Tornado Vortex", href: "/studio/rankine-vortex" },
  { name: "Laser Cavity", href: "/studio/laser-cavity" },
  { name: "Fiber Optics", href: "/studio/fiber-optics" },
  { name: "Gaussian Beam", href: "/studio/gaussian-beam" },
  { name: "Polarization", href: "/studio/polarization" },
  { name: "Thin-Film Coating", href: "/studio/thin-film" },
  { name: "Single-Slit Diffraction", href: "/studio/single-slit" },
  { name: "Bragg Mirror", href: "/studio/bragg-mirror" },
  { name: "LED Band Gap", href: "/studio/led" },
  { name: "Nuclear Binding Energy", href: "/studio/binding-energy" },
  { name: "Fission Chain Reaction", href: "/studio/fission-reactor" },
  { name: "Fusion (Lawson)", href: "/studio/fusion-lawson" },
  { name: "Radiometric Dating", href: "/studio/radiometric-dating" },
  { name: "Radiation Shielding", href: "/studio/radiation-shielding" },
  { name: "Radiation Dose", href: "/studio/radiation-dose" },
  { name: "Reactor Kinetics", href: "/studio/reactor-kinetics" },
  { name: "Neutron Transport", href: "/studio/neutron-transport" },
  { name: "Solar PV System", href: "/studio/solar-panel" },
  { name: "Wind Turbine Power", href: "/studio/wind-power" },
  { name: "Hydroelectric Power", href: "/studio/hydro-power" },
  { name: "Heat Pump COP", href: "/studio/heat-pump" },
  { name: "EV Range & Efficiency", href: "/studio/ev-efficiency" },
  { name: "Battery Storage", href: "/studio/battery-storage" },
  { name: "Carbon Footprint", href: "/studio/carbon-footprint" },
  { name: "Levelized Cost of Energy", href: "/studio/lcoe" },
  { name: "RSA Encryption", href: "/studio/rsa" },
  { name: "Diffie-Hellman", href: "/studio/diffie-hellman" },
  { name: "Classical Ciphers", href: "/studio/classical-ciphers" },
  { name: "Hash Avalanche", href: "/studio/hash-avalanche" },
  { name: "Shannon Entropy", href: "/studio/shannon-entropy" },
  { name: "Huffman Coding", href: "/studio/huffman" },
  { name: "Hamming Code", href: "/studio/hamming-code" },
  { name: "Elliptic Curve", href: "/studio/elliptic-curve" },
  { name: "Great-Circle Distance", href: "/studio/haversine" },
  { name: "Map Projection", href: "/studio/map-projection" },
  { name: "GPS Trilateration", href: "/studio/gps-trilateration" },
  { name: "Viewshed", href: "/studio/viewshed" },
  { name: "Spatial Interpolation", href: "/studio/spatial-interpolation" },
  { name: "Dead Reckoning", href: "/studio/dead-reckoning" },
  { name: "Rhumb Line", href: "/studio/rhumb-line" },
  { name: "Point in Polygon", href: "/studio/point-in-polygon" },
  { name: "Tolerance Stack-Up", href: "/studio/tolerance-stackup" },
  { name: "Process Capability", href: "/studio/process-capability" },
  { name: "OEE", href: "/studio/oee" },
  { name: "CNC Feeds & Speeds", href: "/studio/cnc-feeds-speeds" },
  { name: "Line Balancing", href: "/studio/line-balancing" },
  { name: "SPC Control Chart", href: "/studio/control-chart" },
  { name: "Learning Curve", href: "/studio/learning-curve" },
  { name: "Little's Law", href: "/studio/littles-law" },
  { name: "Elo Rating", href: "/studio/elo-rating" },
  { name: "Pythagorean Expectation", href: "/studio/pythagorean-expectation" },
  { name: "Marathon Pacing", href: "/studio/marathon-pacing" },
  { name: "Magnus Effect", href: "/studio/magnus-effect" },
  { name: "Expected Goals (xG)", href: "/studio/xg-model" },
  { name: "Win Probability", href: "/studio/win-probability" },
  { name: "Tournament Odds", href: "/studio/tournament-bracket" },
  { name: "Basketball Shot Arc", href: "/studio/shot-arc" },
  { name: "Dice Probability", href: "/studio/dice-probability" },
  { name: "Poker Odds", href: "/studio/poker-odds" },
  { name: "Roulette Edge", href: "/studio/roulette" },
  { name: "Birthday Paradox", href: "/studio/birthday-paradox" },
  { name: "Gambler's Ruin", href: "/studio/gamblers-ruin" },
  { name: "Monty Hall", href: "/studio/monty-hall" },
  { name: "Law of Large Numbers", href: "/studio/law-of-large-numbers" },
  { name: "Lottery Odds", href: "/studio/lottery-odds" },
];

export function StudioPageShell({
  slug,
  name,
  lede,
  about,
  keyword,
  details,
  children,
}: {
  slug: string;
  name: string;
  lede: string;
  about: string;
  keyword: string;
  details?: { q: string; a: string }[];
  children: React.ReactNode;
}) {
  const faqs = [
    { q: `Is this ${keyword} tool really free?`, a: `Yes. ${name} runs entirely in your browser using your device's own compute, so local use is free forever. You only pay Compute Tokens if you scale a job to the cloud.` },
    { q: `Do I need to install anything?`, a: `No. Everything runs client-side in a modern browser — no downloads, no license, no account required to start.` },
    { q: `Can I save or share my simulation?`, a: `Create a free account to save projects, and use a shareable embed or minted DOI to publish a live, interactive version anywhere.` },
    { q: `How accurate are the results?`, a: `The solver uses established numerical methods, but results are for research and educational purposes and should be validated against experiment or professional review before you rely on them.` },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={[softwareAppLd({ name, description: lede, path: `/studio/${slug}` }), faqLd(faqs), howToLd({
        name: `How to use the ${name} simulator`,
        description: lede,
        steps: [
          { name: "Open the simulator", text: `Open ${name} at polysimos.com/studio/${slug} — it runs instantly in your browser, with no install or account.` },
          { name: "Adjust the parameters", text: "Use the sliders and presets — and drag directly on the canvas where supported — to change the inputs." },
          { name: "Read the live results", text: "Watch the visualization, the live governing equations, and the computed outputs update in real time." },
          { name: "Export or share", text: "Copy the setup as runnable Python, MATLAB, or Julia code, or share a link to your exact configuration." },
        ],
      })]} />
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Studio", path: "/studio" }, { name, path: `/studio/${slug}` }]} />
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{name}</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-600 dark:text-slate-400">{lede}</p>

      <div className="mt-8">{children}</div>

      <MonetizationBar kind="solver" slug={slug} name={name} next={`/studio/${slug}`} />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <EmbedButton slug={slug} name={name} />
        <span className="text-xs text-slate-400">Drop this simulation into your own site, docs, or course page.</span>
      </div>

      <SaveResultsPrompt slug={slug} name={name} />

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">How it works</h2>
        <p className="mt-3 max-w-4xl text-slate-600 dark:text-slate-400">{about}</p>
        {details && details.length > 0 && (
          <div className="mt-5 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {details.map((d) => (
              <details key={d.q} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2.5 text-sm font-semibold text-slate-800 hover:text-cyan-700 dark:text-slate-200 dark:hover:text-cyan-300">
                  <span>{d.q}</span>
                  <span className="shrink-0 text-slate-400 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="whitespace-pre-line pb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{d.a}</div>
              </details>
            ))}
          </div>
        )}
      </section>

      <AiSolverAssist name={name} keyword={keyword} />

      {(() => {
        const myTag = SIMS.find((s) => s.slug === slug)?.tag ?? "";
        const sameDomain = SIMS.filter((s) => s.tag === myTag && s.slug !== slug).slice(0, 8).map((s) => ({ name: s.name, href: `/studio/${s.slug}` }));
        const related = sameDomain.length >= 3 ? sameDomain : OTHER_SIMS.filter((s) => s.href !== `/studio/${slug}`).slice(0, 8);
        const title = sameDomain.length >= 3 ? `More ${myTag} simulations` : "Related live simulations";
        return <CrossLinks title={title} links={related} />;
      })()}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Frequently asked questions</h2>
        <div className="mt-3 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {faqs.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2.5 text-sm font-semibold text-slate-800 hover:text-cyan-700 dark:text-slate-200 dark:hover:text-cyan-300">
                <span>{f.q}</span>
                <span className="shrink-0 text-slate-400 transition group-open:rotate-180">▾</span>
              </summary>
              <div className="pb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}
