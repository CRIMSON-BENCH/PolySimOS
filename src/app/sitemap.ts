import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { DOMAINS, allDomainTopicPairs } from "@/lib/domains";
import { METHODS } from "@/lib/methods";
import { INDUSTRIES } from "@/lib/industries";
import { MATERIALS, materialPropertyPairs } from "@/lib/materials";
import { MODELS } from "@/lib/models";
import { GLOSSARY } from "@/lib/glossary";
import { PRODUCTS } from "@/lib/products";
import { COMPARISONS } from "@/lib/comparisons";
import { MIGRATION_SLUGS } from "@/lib/migrations";
import { INSTITUTIONS, institutionDepartmentPairs, countrySlugs } from "@/lib/institutions";
import { SIM_TOPICS } from "@/lib/simulate";
import { ARTICLES } from "@/lib/blog";
import { LISTINGS } from "@/lib/marketplace";
import { COURSES } from "@/lib/courses";
import { STANDARDS } from "@/lib/curriculum";
import { SCHOOLS } from "@/lib/schools";
import { AUDIENCES } from "@/lib/audiences";
import { CATEGORIES, CONSTANTS, allPairs } from "@/lib/units";
import { MULTIS } from "@/lib/multi";
import { USECASES, FEATURED } from "@/lib/usecases";
import { AUDIENCES as UC_AUDIENCES } from "@/lib/audiences";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-08-16");
  const u = (path: string, priority = 0.6, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") =>
    ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });

  const staticPages = [
    u("/", 1.0), u("/studio", 0.9), u("/pricing", 0.8), u("/domains", 0.8), u("/methods", 0.7),
    u("/for", 0.7), u("/materials", 0.7), u("/models", 0.7), u("/glossary", 0.7), u("/tools", 0.8),
    u("/compare", 0.7), u("/migrate", 0.7), u("/education", 0.7), u("/simulate", 0.7), u("/blog", 0.7),
    u("/courses", 0.7), u("/curriculum", 0.7), u("/schools", 0.7), u("/alternatives", 0.7), u("/convert", 0.7), u("/constants", 0.7),
    ...CATEGORIES.map((c) => u(`/convert/${c.slug}`, 0.6)),
    ...CONSTANTS.map((c) => u(`/constants/${c.slug}`, 0.5)),
    ...AUDIENCES.map((a) => u(`/guides/${a.slug}`, 0.6)),
    ...countrySlugs().map((c) => u(`/education/country/${c.slug}`, 0.6)),
    u("/templates", 0.6), u("/about", 0.5), u("/for-business", 0.6), u("/custom-solvers", 0.8), u("/developers", 0.6), u("/multi", 0.9), u("/use-cases", 0.9),
    u("/developers/sdk", 0.4), u("/developers/webhooks", 0.4), u("/login", 0.3), u("/signup", 0.4), u("/dashboard", 0.3),
    u("/terms", 0.3), u("/privacy", 0.3), u("/refund", 0.3), u("/acceptable-use", 0.3),
    u("/studio/graph", 0.9), u("/studio/particles", 0.8), u("/studio/fluid", 0.8), u("/studio/dynamics", 0.8), u("/studio/fields", 0.8), u("/studio/cas", 0.8), u("/studio/surrogate", 0.8),
    u("/studio/3d", 0.8), u("/studio/fea", 0.8), u("/studio/electromagnetics", 0.8), u("/studio/molecular-dynamics", 0.8), u("/studio/mesh", 0.8), u("/studio/vector-field", 0.8), u("/studio/optimize", 0.8), u("/studio/notebook", 0.8),
    u("/studio/gpu", 0.9), u("/studio/fea-3d", 0.8), u("/studio/gpu-fluid", 0.9), u("/studio/gpu-nbody", 0.9), u("/studio/heat-3d", 0.8), u("/studio/gpu-pde", 0.9), u("/studio/cfd-3d", 0.8), u("/studio/gpu-fluid-3d", 0.9), u("/studio/gpu-nbody-pm", 0.9), u("/marketplace", 0.7),
    u("/studio/double-pendulum", 0.8), u("/studio/projectile", 0.8), u("/studio/ising", 0.8), u("/studio/fractals", 0.8), u("/studio/fourier", 0.8), u("/studio/grapher", 0.8), u("/studio/surface-3d", 0.8), u("/studio/matrix", 0.8),
    u("/studio/attractors", 0.8), u("/studio/rlc", 0.8), u("/studio/wave-interference", 0.8), u("/studio/cellular-automata", 0.8), u("/studio/random-walk", 0.8), u("/studio/taylor", 0.8), u("/studio/newton", 0.8), u("/studio/distributions", 0.8),
    u("/studio/kepler", 0.8), u("/studio/double-slit", 0.8), u("/studio/cloth", 0.8), u("/studio/gravity-well", 0.8), u("/studio/epidemic-network", 0.8), u("/studio/gradient-descent", 0.8), u("/studio/complex", 0.8), u("/studio/sorting", 0.8),
    u("/studio/boids", 0.8), u("/studio/traffic", 0.8), u("/studio/predator-prey", 0.8), u("/studio/lissajous", 0.8), u("/studio/magnetic-pendulum", 0.8), u("/studio/percolation", 0.8), u("/studio/dla", 0.8), u("/studio/ray-optics", 0.8),
    u("/studio/gas", 0.8), u("/studio/collisions", 0.8), u("/studio/buoyancy", 0.8), u("/studio/rocket", 0.8), u("/studio/blackbody", 0.8), u("/studio/pendulum-wave", 0.8), u("/studio/orbital-transfer", 0.8), u("/studio/standing-waves", 0.8),
    u("/studio/doppler", 0.8), u("/studio/snells-law", 0.8), u("/studio/diffraction-grating", 0.8), u("/studio/beats", 0.8), u("/studio/mirror", 0.8), u("/studio/prism", 0.8), u("/studio/fft", 0.8),
    u("/studio/titration", 0.8), u("/studio/reaction-kinetics", 0.8), u("/studio/equilibrium", 0.8), u("/studio/ph", 0.8), u("/studio/radioactive-decay", 0.8), u("/studio/maxwell-boltzmann", 0.8), u("/studio/ideal-gas", 0.8),
    u("/studio/bifurcation", 0.8), u("/studio/direction-field", 0.8), u("/studio/riemann", 0.8), u("/studio/eigenvectors", 0.8), u("/studio/markov", 0.8), u("/studio/parametric", 0.8), u("/studio/numerical-methods", 0.8),
    u("/studio/pathfinding", 0.8), u("/studio/maze", 0.8), u("/studio/neural-net", 0.8), u("/studio/kmeans", 0.8), u("/studio/convex-hull", 0.8), u("/studio/l-system", 0.8), u("/studio/turing-machine", 0.8), u("/studio/convolution", 0.8),
    u("/studio/forest-fire", 0.8), u("/studio/sandpile", 0.8), u("/studio/schelling", 0.8), u("/studio/langtons-ant", 0.8), u("/studio/reaction-diffusion", 0.8), u("/studio/wolfram-ca", 0.8), u("/studio/genetic-algorithm", 0.8), u("/studio/ant-colony", 0.8),
    u("/studio/fire-spread", 0.8), u("/studio/hazmat-plume", 0.8), u("/studio/evacuation", 0.8), u("/studio/triage", 0.8), u("/studio/hose-flow", 0.8), u("/studio/skid-to-stop", 0.8), u("/studio/radio-range", 0.8), u("/studio/blast-standoff", 0.8),
    u("/studio/exoplanet-transit", 0.8), u("/studio/hr-diagram", 0.8), u("/studio/lagrange-points", 0.8), u("/studio/roche-limit", 0.8), u("/studio/hubble-law", 0.8), u("/studio/telescope", 0.8), u("/studio/parallax", 0.8), u("/studio/escape-velocity", 0.8),
    u("/studio/energy-balance", 0.8), u("/studio/daisyworld", 0.8), u("/studio/milankovitch", 0.8), u("/studio/tsunami", 0.8), u("/studio/carbon-cycle", 0.8), u("/studio/seismic", 0.8), u("/studio/groundwater", 0.8), u("/studio/lapse-rate", 0.8),
    u("/studio/black-scholes", 0.8), u("/studio/option-payoff", 0.8), u("/studio/monte-carlo", 0.8), u("/studio/efficient-frontier", 0.8), u("/studio/value-at-risk", 0.8), u("/studio/bond-pricing", 0.8), u("/studio/compound-interest", 0.8), u("/studio/amortization", 0.8),
    u("/studio/sir-model", 0.8), u("/studio/neuron", 0.8), u("/studio/lotka-volterra", 0.8), u("/studio/hardy-weinberg", 0.8), u("/studio/enzyme-kinetics", 0.8), u("/studio/logistic-growth", 0.8), u("/studio/genetic-drift", 0.8), u("/studio/sequence-alignment", 0.8),
    u("/studio/beam-deflection", 0.8), u("/studio/column-buckling", 0.8), u("/studio/mohrs-circle", 0.8), u("/studio/shear-moment", 0.8), u("/studio/retaining-wall", 0.8), u("/studio/base-shear", 0.8), u("/studio/soil-bearing", 0.8), u("/studio/concrete-beam", 0.8),
    u("/studio/bode-plot", 0.8), u("/studio/filter-designer", 0.8), u("/studio/pid-control", 0.8), u("/studio/transmission-line", 0.8), u("/studio/op-amp", 0.8), u("/studio/three-phase", 0.8), u("/studio/transistor-bias", 0.8), u("/studio/aliasing", 0.8),
    u("/studio/hypothesis-test", 0.8), u("/studio/linear-regression", 0.8), u("/studio/central-limit", 0.8), u("/studio/confidence-interval", 0.8), u("/studio/bayes-inference", 0.8), u("/studio/bootstrap", 0.8), u("/studio/pca", 0.8), u("/studio/ab-test", 0.8),
    u("/studio/forward-kinematics", 0.8), u("/studio/inverse-kinematics", 0.8), u("/studio/differential-drive", 0.8), u("/studio/cart-pole", 0.8), u("/studio/quadcopter", 0.8), u("/studio/rrt", 0.8), u("/studio/dc-motor", 0.8), u("/studio/kalman-filter", 0.8),
    u("/studio/particle-box", 0.8), u("/studio/quantum-tunneling", 0.8), u("/studio/bloch-sphere", 0.8), u("/studio/hydrogen-orbitals", 0.8), u("/studio/special-relativity", 0.8), u("/studio/photoelectric", 0.8), u("/studio/quantum-harmonic", 0.8), u("/studio/stern-gerlach", 0.8),
    u("/studio/harmonic-series", 0.8), u("/studio/equal-temperament", 0.8), u("/studio/chladni", 0.8), u("/studio/helmholtz-resonator", 0.8), u("/studio/room-modes", 0.8), u("/studio/reverb-time", 0.8), u("/studio/sound-levels", 0.8), u("/studio/additive-synthesis", 0.8),
    u("/studio/stress-strain", 0.8), u("/studio/carnot-cycle", 0.8), u("/studio/otto-cycle", 0.8), u("/studio/phase-diagram", 0.8), u("/studio/thermal-expansion", 0.8), u("/studio/fatigue", 0.8), u("/studio/entropy", 0.8), u("/studio/thermal-resistance", 0.8),
    u("/studio/linear-programming", 0.8), u("/studio/knapsack", 0.8), u("/studio/queueing", 0.8), u("/studio/eoq", 0.8), u("/studio/simulated-annealing", 0.8), u("/studio/critical-path", 0.8), u("/studio/game-theory", 0.8), u("/studio/max-flow", 0.8),
    u("/studio/shortest-path", 0.8), u("/studio/spanning-tree", 0.8), u("/studio/graph-coloring", 0.8), u("/studio/small-world", 0.8), u("/studio/pagerank", 0.8), u("/studio/bipartite-matching", 0.8), u("/studio/centrality", 0.8), u("/studio/graph-traversal", 0.8),
    u("/studio/supply-demand", 0.8), u("/studio/elasticity", 0.8), u("/studio/monopoly", 0.8), u("/studio/cobb-douglas", 0.8), u("/studio/lorenz-gini", 0.8), u("/studio/laffer-curve", 0.8), u("/studio/comparative-advantage", 0.8), u("/studio/indifference-curves", 0.8),
    u("/studio/airfoil-polar", 0.8), u("/studio/glide", 0.8), u("/studio/rocket-staging", 0.8), u("/studio/reentry", 0.8), u("/studio/standard-atmosphere", 0.8), u("/studio/mach-cone", 0.8), u("/studio/propeller", 0.8), u("/studio/orbital-elements", 0.8),
    u("/studio/atmospheric-stability", 0.8), u("/studio/coriolis", 0.8), u("/studio/hurricane", 0.8), u("/studio/wind-chill", 0.8), u("/studio/psychrometrics", 0.8), u("/studio/geostrophic-wind", 0.8), u("/studio/rossby-waves", 0.8), u("/studio/rankine-vortex", 0.8),
    u("/studio/laser-cavity", 0.8), u("/studio/fiber-optics", 0.8), u("/studio/gaussian-beam", 0.8), u("/studio/polarization", 0.8), u("/studio/thin-film", 0.8), u("/studio/single-slit", 0.8), u("/studio/bragg-mirror", 0.8), u("/studio/led", 0.8),
    u("/studio/binding-energy", 0.8), u("/studio/fission-reactor", 0.8), u("/studio/fusion-lawson", 0.8), u("/studio/radiometric-dating", 0.8), u("/studio/radiation-shielding", 0.8), u("/studio/radiation-dose", 0.8), u("/studio/reactor-kinetics", 0.8), u("/studio/neutron-transport", 0.8),
    u("/studio/solar-panel", 0.8), u("/studio/wind-power", 0.8), u("/studio/hydro-power", 0.8), u("/studio/heat-pump", 0.8), u("/studio/ev-efficiency", 0.8), u("/studio/battery-storage", 0.8), u("/studio/carbon-footprint", 0.8), u("/studio/lcoe", 0.8),
    u("/studio/rsa", 0.8), u("/studio/diffie-hellman", 0.8), u("/studio/classical-ciphers", 0.8), u("/studio/hash-avalanche", 0.8), u("/studio/shannon-entropy", 0.8), u("/studio/huffman", 0.8), u("/studio/hamming-code", 0.8), u("/studio/elliptic-curve", 0.8),
    u("/studio/haversine", 0.8), u("/studio/map-projection", 0.8), u("/studio/gps-trilateration", 0.8), u("/studio/viewshed", 0.8), u("/studio/spatial-interpolation", 0.8), u("/studio/dead-reckoning", 0.8), u("/studio/rhumb-line", 0.8), u("/studio/point-in-polygon", 0.8),
    u("/studio/tolerance-stackup", 0.8), u("/studio/process-capability", 0.8), u("/studio/oee", 0.8), u("/studio/cnc-feeds-speeds", 0.8), u("/studio/line-balancing", 0.8), u("/studio/control-chart", 0.8), u("/studio/learning-curve", 0.8), u("/studio/littles-law", 0.8),
    u("/studio/elo-rating", 0.8), u("/studio/pythagorean-expectation", 0.8), u("/studio/marathon-pacing", 0.8), u("/studio/magnus-effect", 0.8), u("/studio/xg-model", 0.8), u("/studio/win-probability", 0.8), u("/studio/tournament-bracket", 0.8), u("/studio/shot-arc", 0.8),
    u("/studio/dice-probability", 0.8), u("/studio/poker-odds", 0.8), u("/studio/roulette", 0.8), u("/studio/birthday-paradox", 0.8), u("/studio/gamblers-ruin", 0.8), u("/studio/monty-hall", 0.8), u("/studio/law-of-large-numbers", 0.8), u("/studio/lottery-odds", 0.8),
    u("/product/node-graph", 0.5), u("/product/live-render", 0.5), u("/product/ai-copilot", 0.6), u("/product/data-inspector", 0.5), u("/product/hybrid-compute", 0.5),
  ];

  const dynamic: MetadataRoute.Sitemap = [
    ...DOMAINS.map((d) => u(`/domains/${d.slug}`, 0.7)),
    ...allDomainTopicPairs().map((p) => u(`/domains/${p.domain}/${p.topic}`)),
    ...METHODS.map((m) => u(`/methods/${m.slug}`)),
    ...METHODS.filter((m) => !/^(explicit|implicit|2d|3d|transient|steady-state|gpu-accelerated) /i.test(m.name))
      .flatMap((m) => INDUSTRIES.map((ind) => u(`/methods/${m.slug}/${ind.slug}`, 0.5))),
    ...INDUSTRIES.map((i) => u(`/for/${i.slug}`, 0.6)),
    ...MATERIALS.map((m) => u(`/materials/${m.slug}`)),
    ...materialPropertyPairs().map((p) => u(`/materials/${p.material}/${p.property}`, 0.5)),
    ...MODELS.map((m) => u(`/models/${m.slug}`, 0.7)),
    ...GLOSSARY.map((t) => u(`/glossary/${t.slug}`)),
    ...PRODUCTS.map((p) => u(`/tools/${p.slug}`, 0.7)),
    ...COMPARISONS.map((c) => u(`/compare/${c.slug}`, 0.6)),
    ...MIGRATION_SLUGS.map((s) => u(`/migrate/${s}`, 0.6)),
    ...INSTITUTIONS.map((i) => u(`/education/${i.slug}`, 0.5)),
    ...institutionDepartmentPairs().map((p) => u(`/education/${p.institution}/${p.department}`, 0.4)),
    ...COURSES.map((c) => u(`/courses/${c.slug}`, 0.6)),
    ...STANDARDS.map((s) => u(`/curriculum/${s.slug}`, 0.6)),
    ...SCHOOLS.map((s) => u(`/schools/${s.slug}`, 0.5)),
    ...COMPARISONS.map((c) => u(`/alternatives/${c.slug}`, 0.6)),
    ...AUDIENCES.flatMap((a) => SIM_TOPICS.map((t) => u(`/guides/${a.slug}/${t.slug}`, 0.4))),
    ...allPairs().map((p) => u(`/convert/${p.category}/${p.pair}`, 0.4)),
    ...SIM_TOPICS.map((t) => u(`/simulate/${t.slug}`, 0.6)),
    ...SIM_TOPICS.flatMap((t) => INDUSTRIES.slice(0, 12).map((ind) => u(`/simulate/${t.slug}/${ind.slug}`, 0.5))),
    ...ARTICLES.map((a) => u(`/blog/${a.slug}`, 0.6)),
    ...LISTINGS.map((l) => u(`/marketplace/${l.slug}`, 0.5)),
    ...MULTIS.map((m) => u(`/multi/${m.s}`, 0.7)),
    ...["gyroscope", "coupled-oscillators", "driven-resonance", "gear-train", "rolling-motion", "rocket-equation", "collision-lab", "moment-of-inertia", "pipe-flow", "pump-curve", "open-channel", "heat-exchanger", "compressible-nozzle", "bernoulli", "fin-cooling", "pitot-tube", "timer-555", "logic-gates", "binary-adder", "bjt-amplifier", "active-filter", "buck-converter", "antenna-pattern", "motor-torque-speed", "titration-curve", "reaction-equilibrium", "nernst-cell", "arrhenius-rate", "solubility", "van-der-waals", "buffer-solution", "electrolysis", "pharmacokinetics", "michaelis-menten", "windkessel", "cardiac-action-potential", "mutation-selection", "phylo-distance", "tumor-growth", "oxygen-dissociation"].map((s) => u(`/studio/${s}`, 0.8)),
    ...USECASES.map((uc) => u(`/use-cases/${uc.slug}`, 0.6)),
    ...FEATURED.flatMap((uc) => UC_AUDIENCES.map((a) => u(`/use-cases/${uc.slug}/for/${a.slug}`, 0.4))),
  ];

  return [...staticPages, ...dynamic];
}
