import { SIMS } from "@/app/studio/page";
import { MULTIS } from "./multi";
import { slugify } from "./seo";

// ---------------------------------------------------------------------------
// Use-case factory. A "use case" = one real task someone searches, mapped to
// the solver (or multi-solver) that answers it. We generate them as
// tool × real-application, where each tool's DOMAIN carries a curated list of
// genuine applications — not blind combinatorics. ~501 tools × ~30 apps ≈ 15k.
// ---------------------------------------------------------------------------

const APPS_PER_TOOL = 30;
export const FEATURED_COUNT = 1050; // top use cases that get per-audience variants

// Curated real applications per domain (each → one use-case page).
const DOMAIN_APPS: Record<string, string[]> = {
  physics: ["a projectile from a cannon","a bouncing ball","a pendulum clock","a car braking","a roller-coaster loop","a satellite orbit","a mass on a spring","a skydiver's free fall","a two-cart collision","planetary motion","a playground swing","a block on a ramp","a ballistic trajectory","a water rocket","a spinning top","an elevator drop","a trebuchet launch","a bungee jump","a see-saw balance","a carousel","a yo-yo","a golf drive","a diving board","a zip line","a Newton's cradle","a rolling barrel","a slingshot","a Ferris wheel","a tightrope walk","a hammer throw"],
  math: ["compound interest","a population curve","a loan payoff","a logistic map","a Fibonacci sequence","a fractal tree","a Fourier series","a Taylor approximation","a Monte-Carlo pi estimate","a random walk","a matrix transform","a Markov chain","a differential equation","a Newton's-method root","a numerical integral","a curve fit","a linear regression","a Bezier curve","a Voronoi diagram","a cellular automaton","a prime gap","a strange attractor","a golden spiral","a sorting race","a dice distribution","the birthday paradox","a coin-flip streak","a bell curve","Conway's Game of Life","a Mandelbrot zoom"],
  structural: ["a cantilever balcony","a bridge girder","a floor joist","a roof rafter","a steel beam","a timber deck","a crane boom","a retaining wall","a stair stringer","a shelf bracket","a wind-turbine tower","a footbridge","a concrete column","a truss bridge","a mezzanine floor","a balcony railing","a carport roof","a signage gantry","a scaffold tower","a portal frame","a water-tank stand","a solar-panel mount","a treehouse platform","a garage lintel","a pergola","a billboard support","a flagpole","a diving platform","a gantry crane","a canopy"],
  aerospace: ["a passenger jet wing","a rocket ascent","a drone quadcopter","a glider","a paper airplane","a Mars lander","a satellite reentry","a model rocket","a wind-tunnel airfoil","a helicopter rotor","a parachute descent","a supersonic jet","a hot-air balloon","a space capsule","a hypersonic vehicle","a cargo aircraft","a fighter-jet turn","an ejection seat","a spacecraft docking","a launch abort","a lunar orbit","a reusable booster","a jet engine","a UAV survey","a gliding albatross","a ballistic capsule","a solar sail","an ion thruster","a wingsuit","a crop duster"],
  complex: ["a traffic jam","a bird flock","a forest fire","a crowd evacuation","an ant colony","a rumor spreading","a market bubble","a power-grid cascade","an ecosystem","a sandpile avalanche","a fish school","a city growing","a neuron network","a queue forming","a social network","a gossip cascade","a supply chain","a pandemic wave","a slime mold","a firefly sync","a herd stampede","a segregation model","a boom-bust cycle","a swarm of robots","a coral reef","a river delta","a snowflake forming","a percolation cluster","a wildfire front","a gridlock"],
  weather: ["a thunderstorm","a hurricane track","a tornado","a heat wave","a cold front","a sea breeze","a flash flood","a snowstorm","a drought","a monsoon","a fog bank","a wind gust","a hailstorm","a jet stream","a temperature inversion","a lake-effect snow","a dust storm","a lightning strike","a pressure system","a rainfall total","a windchill","a humidity index","a storm surge","a microburst","a cloud forming","a frost event","an El Niño year","a coastal storm","a mountain wave","a squall line"],
  statistics: ["an A/B test","a survey sample","a poll margin","a quality-control chart","a clinical trial","a customer churn","a click-through rate","an exam-score curve","a defect rate","a hypothesis test","a confidence interval","a regression forecast","a dice-fairness check","a spam filter","a fraud score","a sensor calibration","an insurance risk","a batting average","a conversion funnel","a Bayesian update","a sampling error","an outlier scan","a correlation study","a time-series forecast","a lottery-odds check","a p-value","a control group","a distribution fit","a churn cohort","a survey weighting"],
  sports: ["a basketball free throw","a soccer penalty","a baseball pitch","a golf putt","a tennis serve","a football field goal","a sprint race","a marathon pace","a cycling time trial","a ski jump","a long jump","a high jump","a hockey slap shot","a bowling roll","a dart throw","a pool break","a swimmer's lap","a rowing stroke","a javelin throw","a shot put","a pole vault","a cricket bowl","a volleyball spike","a boxing punch","a race-car lap","a horse race","a curling stone","a frisbee throw","a rugby kick","a badminton smash"],
  robotics: ["a robot arm","a self-driving car","a warehouse robot","a drone delivery","a walking robot","a robotic gripper","a CNC toolpath","a quadruped","a line-follower","a robot vacuum","a surgical robot","a pick-and-place arm","a mobile rover","a balancing bot","a swarm of drones","a conveyor sorter","an exoskeleton","a robotic hand","a delivery bot","a factory arm","a lunar rover","a soft robot","a humanoid gait","a robot maze","a manipulator","an AGV","a claw machine","a robot-soccer bot","a tele-operated arm","a pipe-inspection robot"],
  quantum: ["a hydrogen atom","a quantum well","a qubit","the double-slit experiment","a particle in a box","a tunneling electron","a spin measurement","a laser cavity","a Bloch sphere","an entangled pair","a quantum gate","a harmonic oscillator","a photon detector","a superconductor","a Bose-Einstein condensate","a quantum dot","a wavefunction collapse","a hydrogen spectrum","a Stern-Gerlach beam","a quantum eraser","an atom trap","a Josephson junction","a spin chain","a quantum walk","a Rabi oscillation","a decoherence event","a quantum key","a band structure","a Zeeman splitting","a Cooper pair"],
  optics: ["a camera lens","a laser beam","a fiber-optic cable","a microscope","a telescope","a prism","a rainbow","a hologram","a solar cell","an LED","a diffraction grating","a mirror reflection","a lens focus","a light guide","an anti-reflective coating","a laser pointer","a photonic crystal","a beam splitter","an optical fiber","a spectrometer","a Fresnel lens","a soap-bubble film","a mirage","a fiber sensor","a waveguide","a polarizer","a laser cutter","an eye lens","a projector","a light sail"],
  optimization: ["a delivery route","a warehouse layout","a factory schedule","a staff roster","a portfolio mix","a supply chain","a bin-packing plan","a knapsack","a network flow","a job-shop schedule","a cutting-stock plan","a vehicle-routing run","a facility location","an airline schedule","a power dispatch","a diet plan","a seating chart","a tournament bracket","a project timeline","an ad budget","a crew assignment","a pipeline layout","a traffic-light timing","a meal-prep plan","a shift schedule","a truck load","a data-center cooling","a hospital roster","a classroom timetable","a race strategy"],
  nuclear: ["a reactor core","a radiation shield","a fuel rod","a Geiger counter","a nuclear decay","a PET scan","an X-ray dose","a fusion plasma","a radiotherapy beam","a fallout plume","a criticality test","a half-life sample","a smoke detector","a dirty-bomb scenario","a spent-fuel pool","a radiation badge","a neutron source","a cancer treatment","a reactor shutdown","a shielding wall","a radon test","a gamma source","a nuclear battery","a containment dome","a dosimeter","a breeder reactor","a medical isotope","a cosmic-ray count","a uranium enrichment","a coolant loop"],
  materials: ["a steel beam","an aluminum frame","a concrete mix","a carbon-fiber panel","a rubber seal","a glass pane","a copper wire","a titanium implant","a 3D-printed part","a ceramic tile","a plastic bottle","a wood joint","a thermal insulator","a shape-memory alloy","a battery electrode","a solder joint","a composite wing","a nanotube","a foam cushion","a weld seam","a coating layer","a spring steel","a bearing surface","a heat sink","a fabric weave","a semiconductor wafer","a magnet","a gasket","a piston","a turbine blade"],
  manufacturing: ["a CNC part","an assembly line","an injection mold","a 3D print","a welding cell","a paint booth","a packaging line","a bottling plant","a lathe cut","a stamping press","a conveyor belt","a quality check","a robotic weld","a milling job","a laser cut","a heat treatment","a die cast","a PCB assembly","a filling machine","a labeling line","a palletizer","an extrusion run","a spot weld","a surface finish","a tolerance check","a batch process","a takt-time study","a bottleneck station","a changeover","a yield-rate check"],
  graphs: ["a road network","a social graph","a subway map","a supply network","a flight network","a power grid","a computer network","a citation graph","a friendship network","a delivery map","a dependency graph","a maze","a family tree","a neural graph","a web-link graph","a pipeline network","a tournament","a knowledge graph","a routing table","a circuit netlist","a water network","a gene network","a call graph","a metro system","a trade network","a sensor mesh","a game tree","a project network","a molecule graph","a spanning tree"],
  geospatial: ["a GPS route","a hiking trail","a delivery zone","a flight path","a shipping lane","a cell-tower map","a flood zone","a wildfire perimeter","an evacuation route","a drone survey","a property boundary","a coastline","a watershed","a bus route","a geofence","a heat map","a trilateration fix","a surveying traverse","a satellite footprint","a great-circle route","a contour map","a service area","a crime hotspot","a solar-panel site","a wind-farm layout","a pipeline corridor","a map projection","a viewshed","a territory carve","a search grid"],
  responders: ["a house fire","a wildfire","a hazmat spill","a mass-casualty scene","a flood rescue","a building collapse","a chemical leak","a search-and-rescue grid","a triage station","an evacuation","a smoke spread","a gas leak","a car crash","a crowd surge","an active-shooter response","a power outage","a water-main break","a bridge inspection","a rope rescue","a swiftwater rescue","a structure fire","an ambulance route","a fire spread","a plume dispersion","a shelter plan","a resource stage","a burn-rate estimate","a dispatch plan","a hydrant flow","a ladder reach"],
  finance: ["a stock option","a retirement fund","a mortgage","a bond ladder","a crypto portfolio","an index fund","a savings plan","a startup valuation","a loan payoff","a dividend stream","a hedge position","a currency trade","a risk model","a Monte-Carlo forecast","an annuity","a credit score","an insurance premium","a tax plan","a college fund","a rental property","a margin trade","a pension","a Black-Scholes option","a VaR estimate","a yield curve","a dollar-cost-average plan","a bear market","a portfolio rebalance","a compound-growth plan","an emergency fund"],
  energy: ["a solar farm","a wind turbine","a home battery","an EV charger","a power grid","a heat pump","a gas turbine","a hydro dam","a nuclear plant","a microgrid","a fuel cell","a transmission line","a smart meter","a rooftop solar array","a geothermal well","a biomass boiler","a peak-demand day","a blackout","a battery store","a tidal generator","a district heating loop","a cooling load","an energy audit","a carbon footprint","a net-zero home","a power-factor fix","a demand response","a wave generator","a flywheel store","an LCOE estimate"],
  electrical: ["an RLC circuit","a power supply","a transformer","a DC motor","an op-amp filter","an antenna","a transmission line","a PCB trace","a battery pack","an inverter","a rectifier","a signal filter","a resonant circuit","a Wheatstone bridge","an LED driver","a buck converter","a three-phase motor","a capacitor bank","a relay","a sensor amplifier","a Bode plot","a phase-locked loop","a voltage divider","a solar inverter","a heating element","a fuse rating","an EMI filter","a crystal oscillator","a Class-D amp","a grounding scheme"],
  economics: ["a supply-demand market","a monopoly","an auction","a tax policy","a trade tariff","an inflation model","a labor market","a game-theory standoff","a price war","a housing market","a minimum wage","a subsidy","a GDP forecast","a Nash equilibrium","a public good","an externality","a cartel","a bank run","a business cycle","a Cournot duopoly","a prisoner's dilemma","a market crash","a wealth distribution","a tragedy of the commons","a stimulus package","a demand shock","a comparative-advantage trade","a bubble","a tax cut","a network effect"],
  earth: ["an earthquake","a volcano","a glacier melt","a tsunami","a river flood","an ocean current","a sea-level rise","a carbon cycle","a tectonic plate","a groundwater flow","a landslide","a coral bleaching","a soil erosion","a rainforest","an ice age","a CO2 rise","a wildfire season","a coastal erosion","a permafrost thaw","a magma chamber","a hurricane season","a drought cycle","a watershed","an aquifer","a dust bowl","a methane plume","a reef ecosystem","a sediment plume","an El Niño","a jet-stream shift"],
  crypto: ["an RSA key","a password hash","a digital signature","a Diffie-Hellman exchange","a block cipher","a hash collision","a one-time pad","a Caesar cipher","a public-key handshake","an elliptic curve","a random-number generator","a TLS handshake","a message digest","a Merkle tree","a zero-knowledge proof","a brute-force attack","a substitution cipher","a stream cipher","a key exchange","a blockchain","a checksum","a salt-and-hash","a certificate","a Vigenère cipher","a nonce","a secret-sharing scheme","a MAC tag","a birthday attack","a keystream","a padding scheme"],
  chemistry: ["a reaction rate","a titration","a gas law","a pH balance","an equilibrium","a battery cell","a combustion","a crystallization","a fermentation","a catalyst","a solubility curve","a diffusion","an electrolysis","a polymer chain","a distillation","a buffer solution","an acid-base reaction","a precipitation","a reaction network","a molecular collision","a phase change","a heat of reaction","an enzyme kinetics","a chromatography","a redox reaction","a gas diffusion","a saturation point","a reaction yield","an ideal gas","a mixing process"],
  cs: ["a neural network","a sorting algorithm","a search tree","a hash table","a recommendation engine","an image classifier","a chatbot","a pathfinding AI","a game AI","a spam filter","a clustering model","a decision tree","a Q-learning agent","a genetic algorithm","a convolutional net","a load balancer","a cache","a compiler","a regex matcher","a maze solver","a ranking model","a fraud detector","a sentiment classifier","an autocomplete","a data pipeline","a gradient descent","a k-means cluster","a Dijkstra route","a Bloom filter","a rate limiter"],
  biology: ["a bacterial growth","a predator-prey cycle","a neuron firing","a heartbeat","a virus spread","a gene expression","a protein fold","a muscle contraction","a blood flow","an enzyme reaction","a rabbit population","a coral colony","a cell division","a nerve signal","a photosynthesis rate","a drug dose","a tumor growth","an immune response","a food web","a DNA replication","a synapse","a circadian rhythm","an insulin response","a species migration","a mutation rate","a fish population","a lung gas exchange","a vaccine rollout","a bioreactor","a metabolic pathway"],
  astronomy: ["a planet orbit","a binary star","a black hole","a galaxy rotation","a comet path","a solar eclipse","a supernova","a star's life","an exoplanet transit","a lunar phase","an asteroid flyby","a rocket to Mars","a Hohmann transfer","a tidal force","a pulsar","a nebula","a gravitational lens","a Kepler orbit","a meteor shower","a satellite orbit","a Lagrange point","a red giant","a light-year distance","a cosmic expansion","a star cluster","a ring system","a habitable zone","a solar flare","a telescope view","a gravity assist"],
  acoustics: ["a guitar string","a concert hall","a speaker","a drum head","a sound wave","a piano note","a noise barrier","a whisper gallery","a microphone","a room echo","a bass-reflex box","a violin body","a subwoofer","a sonar ping","an organ pipe","a beat frequency","a standing wave","a Doppler siren","a headphone","a recording studio","a wind instrument","an ultrasound","a tuning fork","a noise-cancel headset","a bell","a vocal cord","a resonant room","a sound barrier","a stadium PA","a xylophone"],
  general: ["a classroom demo","a science-fair project","a homework problem","a lab experiment","a design study","a training exercise","a research prototype","a real-world example","a case study","a what-if scenario","a quick estimate","a teaching example","a textbook problem","a field test","a planning study","a feasibility check","a sensitivity study","a comparison test","a benchmark case","a starter project"],
};

const TAG_TO_DOMAIN: Record<string, string> = {
  "Physics": "physics", "3D Physics": "physics", "3D PDE": "physics", "PDE": "physics", "WebGPU": "physics", "Waves": "acoustics", "Signals": "electrical",
  "Math": "math", "CS / Math": "cs", "Flagship": "math",
  "Structural": "structural", "Engineering": "structural", "3D Engineering": "structural",
  "Aerospace": "aerospace", "Complex Systems": "complex", "Emergence": "complex", "Weather": "weather",
  "Statistics": "statistics", "Probability": "statistics", "Data": "statistics", "Sports": "sports",
  "Robotics": "robotics", "Quantum": "quantum", "Photonics": "optics", "Optics": "optics",
  "Optimization": "optimization", "Nuclear": "nuclear", "Materials": "materials", "Manufacturing": "manufacturing",
  "Graph Theory": "graphs", "Geospatial": "geospatial", "First Responders": "responders",
  "Finance": "finance", "Energy": "energy", "Electrical": "electrical", "Economics": "economics",
  "Earth & Climate": "earth", "Cryptography": "crypto", "Chemistry": "chemistry",
  "CS / AI": "cs", "CS": "cs", "AI": "cs", "Data / ML": "cs",
  "Biology": "biology", "Bio": "biology", "Math / Bio": "biology", "Astronomy": "astronomy", "Acoustics": "acoustics",
};

const PACK_TO_DOMAIN: Record<string, string> = {
  "Structural & Geotechnical": "structural", "Fluids & Energy": "energy", "Electronics & Power": "electrical",
  "Controls & Robotics": "robotics", "Data & Statistics": "statistics", "Finance & Quant": "finance",
  "Physics & Quantum": "physics", "Chemistry & Materials": "chemistry", "Earth & First Responders": "earth",
  "Biology & Aerospace": "biology", "Operations & Economics": "economics",
};

const stripArticle = (s: string) => s.replace(/^(a|an|the)\s+/i, "");

export type UseCase = {
  slug: string;
  toolSlug: string;
  toolName: string;
  kind: "solver" | "multi";
  domain: string;
  app: string;
  title: string;
  query: string;
};

function build(): UseCase[] {
  const out: UseCase[] = [];
  const seen = new Set<string>();
  const add = (toolSlug: string, toolName: string, kind: "solver" | "multi", domain: string) => {
    const apps = (DOMAIN_APPS[domain] ?? DOMAIN_APPS.general).slice(0, APPS_PER_TOOL);
    for (const app of apps) {
      const slug = `${toolSlug}-${slugify(stripArticle(app))}`;
      if (seen.has(slug)) continue;
      seen.add(slug);
      out.push({ slug, toolSlug, toolName, kind, domain, app, title: `${toolName} for ${app}`, query: `simulate ${app}` });
    }
  };
  for (const s of SIMS as { slug: string; name: string; tag: string }[]) {
    add(s.slug, s.name, "solver", TAG_TO_DOMAIN[s.tag] ?? "general");
  }
  for (const m of MULTIS) {
    add(m.s, m.n, "multi", PACK_TO_DOMAIN[m.p] ?? "general");
  }
  return out;
}

export const USECASES: UseCase[] = build();
const BY_SLUG = new Map(USECASES.map((u) => [u.slug, u]));

export const USECASE_COUNT = USECASES.length;
export const FEATURED: UseCase[] = USECASES.slice(0, FEATURED_COUNT);
const FEATURED_SLUGS = new Set(FEATURED.map((u) => u.slug));

export function getUseCase(slug: string): UseCase | undefined { return BY_SLUG.get(slug); }
export function isFeatured(slug: string): boolean { return FEATURED_SLUGS.has(slug); }

/** Other use cases for the same tool (same solver, different applications). */
export function siblingUseCases(u: UseCase, n = 8): UseCase[] {
  return USECASES.filter((x) => x.toolSlug === u.toolSlug && x.slug !== u.slug).slice(0, n);
}
/** Same application across other tools ("also simulate X with…"). */
export function relatedByApp(u: UseCase, n = 6): UseCase[] {
  return USECASES.filter((x) => x.app === u.app && x.toolSlug !== u.toolSlug).slice(0, n);
}

export const DOMAIN_LIST = Object.keys(DOMAIN_APPS).filter((d) => d !== "general");
export function domainUseCases(domain: string, n = 24): UseCase[] {
  return USECASES.filter((u) => u.domain === domain).slice(0, n);
}
export function domainCount(domain: string): number {
  return USECASES.filter((u) => u.domain === domain).length;
}
