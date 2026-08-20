import { slugify } from "./seo";

export interface Industry {
  slug: string;
  name: string;
  summary: string;
  challenges: string[];
  useCases: string[];
}

type Seed = [name: string, summary: string, challenges: string[], useCases: string[]];

const SEEDS: Seed[] = [
  ["Aerospace", "Design and validate aircraft, spacecraft, and propulsion under extreme conditions.", ["Aerodynamic efficiency", "Thermal loads on re-entry", "Structural weight vs. strength"], ["Wing and airfoil CFD", "Rocket-engine thermal analysis", "Airframe modal analysis"]],
  ["Automotive", "Engineer safer, more efficient vehicles from aerodynamics to crash.", ["Drag and fuel economy", "Crash safety", "Battery thermal management"], ["External aerodynamics", "Crashworthiness FEA", "EV battery cooling"]],
  ["Biotech & Pharma", "Model biological systems, drug transport, and bioreactors.", ["Reaction kinetics", "Mixing and transport", "Regulatory validation"], ["Enzyme kinetics", "Bioreactor mixing CFD", "Drug-diffusion modeling"]],
  ["Energy", "Optimize generation, storage, and distribution across sources.", ["Efficiency losses", "Thermal management", "Grid stability"], ["Wind-turbine CFD", "Battery modeling", "Heat-exchanger design"]],
  ["Electronics & Semiconductors", "Manage heat, fields, and signal integrity in dense devices.", ["Thermal hotspots", "Electromagnetic interference", "Miniaturization"], ["Chip thermal analysis", "PCB EM simulation", "Package stress"]],
  ["Civil & Structural", "Ensure buildings and infrastructure are safe and resilient.", ["Load and seismic response", "Material fatigue", "Wind loading"], ["Structural FEA", "Seismic modal analysis", "Wind-load CFD"]],
  ["Manufacturing", "Improve processes from casting to additive manufacturing.", ["Process defects", "Thermal warping", "Throughput"], ["Injection-molding flow", "Additive thermal history", "Machining stress"]],
  ["Marine & Offshore", "Design hulls, platforms, and subsea systems for harsh seas.", ["Hydrodynamic drag", "Wave loading", "Corrosion and fatigue"], ["Hull resistance CFD", "Wave-structure interaction", "Riser dynamics"]],
  ["Healthcare & Medical Devices", "Develop devices and model physiology safely.", ["Biocompatibility", "Flow in vessels", "Regulatory testing"], ["Blood-flow CFD", "Stent structural analysis", "Device thermal safety"]],
  ["Chemical & Process", "Scale reactions and separations reliably.", ["Reaction control", "Mixing efficiency", "Safety margins"], ["Reactor modeling", "Distillation transport", "Combustion analysis"]],
  ["Materials Science", "Discover and characterize materials computationally.", ["Property prediction", "Microstructure", "Failure mechanisms"], ["Molecular dynamics", "Fatigue modeling", "Composite analysis"]],
  ["Robotics", "Simulate dynamics, contact, and control for autonomy.", ["Contact dynamics", "Control stability", "Real-time performance"], ["Rigid-body dynamics", "Control-loop tuning", "Actuator modeling"]],
  ["Climate & Environment", "Model atmospheric, ocean, and pollutant dynamics.", ["Multiscale coupling", "Long time horizons", "Data assimilation"], ["Pollutant dispersion", "Ocean-current modeling", "Reaction–diffusion"]],
  ["Consumer Products", "Optimize everyday products for cost and performance.", ["Cost vs. durability", "Thermal comfort", "Packaging"], ["Drop-test FEA", "Airflow in appliances", "Packaging optimization"]],
  ["Defense", "Engineer resilient systems for demanding environments.", ["Blast and impact", "Signature management", "Reliability"], ["Ballistic FEA", "Aerodynamics", "Electromagnetic modeling"]],
  ["Oil & Gas", "Model reservoirs, flow assurance, and equipment.", ["Multiphase flow", "High pressure/temperature", "Corrosion"], ["Reservoir simulation", "Pipeline flow", "Equipment stress"]],
  ["Electronics Cooling", "Keep dense electronics within thermal limits.", ["Hotspot mitigation", "Fan/heatsink design", "Acoustic noise"], ["Heatsink CFD", "Fan curve modeling", "Thermal FEA"]],
  ["Sports & Wearables", "Engineer performance gear and wearable devices.", ["Aerodynamics", "Comfort and fit", "Battery life"], ["Cycling aerodynamics", "Fabric drape", "Wearable thermal design"]],
  ["Education & Research", "Teach and discover with accessible simulation.", ["License cost", "Reproducibility", "Accessibility"], ["Classroom labs", "Reproducible research", "Interactive coursework"]],
  ["AgTech", "Model crops, irrigation, and agricultural machinery.", ["Water transport", "Soil mechanics", "Yield optimization"], ["Irrigation flow", "Soil DEM", "Greenhouse airflow"]],
  ["Makers & Hobbyists", "Prototype, control, and fabricate real projects from a browser — no license, no install.", ["Expensive desktop tools", "Bridging simulation to hardware", "Fast iteration"], ["Arduino control loops", "3D-print part design", "Sensor data logging"]],
  ["Hardware Startups", "Go from prototype to product without a toolbox tax.", ["Tight budgets", "Fast iteration", "Design-to-fab handoff"], ["Controller prototyping", "Bracket fabrication", "Model validation from test data"]],
  ["Electric Vehicles", "Engineer EV powertrains, batteries, and thermal systems.", ["Battery thermal runaway", "Range efficiency", "Motor control"], ["Battery pack cooling", "Motor-control tuning", "Aerodynamic range"]],
  ["Renewable Energy", "Optimize solar, wind, and storage systems.", ["Intermittency", "Thermal cycling", "Grid integration"], ["Wind-farm CFD", "PV thermal modeling", "Battery storage sizing"]],
  ["Nuclear", "Model reactors, shielding, and radiation transport.", ["Neutron transport", "Thermal-hydraulics", "Safety margins"], ["Reactor kinetics", "Shielding attenuation", "Decay-heat modeling"]],
  ["HVAC & Buildings", "Model airflow, comfort, and energy use in built spaces.", ["Thermal comfort", "Energy efficiency", "Air quality"], ["Room airflow CFD", "Building energy modeling", "Duct design"]],
  ["Water & Wastewater", "Design treatment, distribution, and hydraulics.", ["Flow assurance", "Mixing and aeration", "Contaminant transport"], ["Pipe-network hydraulics", "Aeration mixing", "Contaminant dispersion"]],
  ["Rail & Transit", "Engineer rolling stock and rail infrastructure.", ["Aerodynamics", "Track loading", "Braking thermal"], ["Train aerodynamics", "Rail structural FEA", "Brake thermal analysis"]],
  ["Mining & Geotech", "Model excavation, slope stability, and ore processing.", ["Slope stability", "Groundwater", "Comminution"], ["Slope FEA", "Groundwater flow", "Particle DEM"]],
  ["Food & Beverage", "Model processing, mixing, and thermal safety.", ["Mixing uniformity", "Thermal pasteurization", "Shelf life"], ["Mixing CFD", "Sterilization heat transfer", "Diffusion modeling"]],
  ["Packaging", "Design protective, efficient, sustainable packaging.", ["Drop protection", "Material cost", "Sustainability"], ["Drop-test FEA", "Cushioning analysis", "Material optimization"]],
  ["Textiles & Apparel", "Simulate fabric, fit, and wearables.", ["Drape and fit", "Thermal comfort", "Durability"], ["Cloth simulation", "Thermal comfort modeling", "Seam stress"]],
];

export const INDUSTRIES: Industry[] = SEEDS.map((s) => {
  const [name, summary, challenges, useCases] = s;
  return { slug: slugify(name), name, summary, challenges, useCases };
});

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}
export function getAllIndustrySlugs(): string[] {
  return INDUSTRIES.map((i) => i.slug);
}
