import { slugify } from "./seo";

// Affine unit model: base = value * factor + offset. To convert a→b:
//   base = a*factor_a + offset_a;  result = (base - offset_b) / factor_b
// Handles linear units and temperature uniformly.
export interface Unit { name: string; slug: string; symbol: string; factor: number; offset?: number; }
export interface UnitCategory { slug: string; name: string; base: string; units: Unit[]; }

function mk(list: [name: string, symbol: string, factor: number, offset?: number][]): Unit[] {
  return list.map(([name, symbol, factor, offset]) => ({ name, slug: slugify(name), symbol, factor, offset: offset ?? 0 }));
}

export const CATEGORIES: UnitCategory[] = [
  { slug: "length", name: "Length", base: "meter", units: mk([["meter", "m", 1], ["kilometer", "km", 1000], ["centimeter", "cm", 0.01], ["millimeter", "mm", 0.001], ["mile", "mi", 1609.344], ["yard", "yd", 0.9144], ["foot", "ft", 0.3048], ["inch", "in", 0.0254], ["nautical mile", "nmi", 1852]]) },
  { slug: "mass", name: "Mass", base: "kilogram", units: mk([["kilogram", "kg", 1], ["gram", "g", 0.001], ["milligram", "mg", 1e-6], ["tonne", "t", 1000], ["pound", "lb", 0.45359237], ["ounce", "oz", 0.0283495], ["stone", "st", 6.35029]]) },
  { slug: "time", name: "Time", base: "second", units: mk([["second", "s", 1], ["millisecond", "ms", 0.001], ["minute", "min", 60], ["hour", "h", 3600], ["day", "d", 86400], ["week", "wk", 604800], ["year", "yr", 31557600]]) },
  { slug: "velocity", name: "Velocity", base: "meter per second", units: mk([["meter per second", "m/s", 1], ["kilometer per hour", "km/h", 0.2777778], ["mile per hour", "mph", 0.44704], ["foot per second", "ft/s", 0.3048], ["knot", "kn", 0.5144444]]) },
  { slug: "pressure", name: "Pressure", base: "pascal", units: mk([["pascal", "Pa", 1], ["kilopascal", "kPa", 1000], ["megapascal", "MPa", 1e6], ["bar", "bar", 1e5], ["psi", "psi", 6894.757], ["atmosphere", "atm", 101325], ["torr", "torr", 133.322], ["millimeter of mercury", "mmHg", 133.322]]) },
  { slug: "energy", name: "Energy", base: "joule", units: mk([["joule", "J", 1], ["kilojoule", "kJ", 1000], ["calorie", "cal", 4.184], ["kilocalorie", "kcal", 4184], ["watt hour", "Wh", 3600], ["kilowatt hour", "kWh", 3.6e6], ["electronvolt", "eV", 1.602176634e-19], ["BTU", "BTU", 1055.06]]) },
  { slug: "power", name: "Power", base: "watt", units: mk([["watt", "W", 1], ["kilowatt", "kW", 1000], ["megawatt", "MW", 1e6], ["horsepower", "hp", 745.7], ["BTU per hour", "BTU/h", 0.2930711]]) },
  { slug: "force", name: "Force", base: "newton", units: mk([["newton", "N", 1], ["kilonewton", "kN", 1000], ["pound-force", "lbf", 4.4482216], ["dyne", "dyn", 1e-5], ["kilogram-force", "kgf", 9.80665]]) },
  { slug: "temperature", name: "Temperature", base: "kelvin", units: mk([["kelvin", "K", 1, 0], ["celsius", "°C", 1, 273.15], ["fahrenheit", "°F", 5 / 9, 255.3722222]]) },
  { slug: "area", name: "Area", base: "square meter", units: mk([["square meter", "m²", 1], ["square centimeter", "cm²", 1e-4], ["square kilometer", "km²", 1e6], ["square foot", "ft²", 0.09290304], ["square inch", "in²", 0.00064516], ["acre", "ac", 4046.856], ["hectare", "ha", 10000]]) },
  { slug: "volume", name: "Volume", base: "cubic meter", units: mk([["cubic meter", "m³", 1], ["liter", "L", 0.001], ["milliliter", "mL", 1e-6], ["US gallon", "gal", 0.00378541], ["cubic foot", "ft³", 0.0283168], ["cubic inch", "in³", 1.6387064e-5]]) },
  { slug: "angle", name: "Angle", base: "radian", units: mk([["radian", "rad", 1], ["degree", "°", 0.01745329], ["gradian", "grad", 0.01570796], ["arcminute", "′", 2.908882e-4]]) },
  { slug: "frequency", name: "Frequency", base: "hertz", units: mk([["hertz", "Hz", 1], ["kilohertz", "kHz", 1000], ["megahertz", "MHz", 1e6], ["gigahertz", "GHz", 1e9], ["revolutions per minute", "rpm", 0.0166667]]) },
];

export function getCategory(slug: string): UnitCategory | undefined { return CATEGORIES.find((c) => c.slug === slug); }
export function convert(v: number, from: Unit, to: Unit): number {
  const base = v * from.factor + (from.offset ?? 0);
  return (base - (to.offset ?? 0)) / to.factor;
}
export function allPairs(): { category: string; pair: string }[] {
  const out: { category: string; pair: string }[] = [];
  for (const c of CATEGORIES) for (const a of c.units) for (const b of c.units) if (a.slug !== b.slug) out.push({ category: c.slug, pair: `${a.slug}-to-${b.slug}` });
  return out;
}
export function parsePair(cat: UnitCategory, pair: string): { from: Unit; to: Unit } | undefined {
  const [fromSlug, toSlug] = pair.split("-to-");
  const from = cat.units.find((u) => u.slug === fromSlug), to = cat.units.find((u) => u.slug === toSlug);
  return from && to ? { from, to } : undefined;
}

// Physical constants reference
export interface Constant { slug: string; name: string; symbol: string; value: string; unit: string; blurb: string; }
export const CONSTANTS: Constant[] = ([
  ["Speed of Light", "c", "299,792,458", "m/s", "The speed of light in vacuum — the universe's ultimate speed limit."],
  ["Gravitational Constant", "G", "6.674×10⁻¹¹", "m³/(kg·s²)", "Newton's constant, setting the strength of gravity."],
  ["Planck Constant", "h", "6.62607×10⁻³⁴", "J·s", "Relates a photon's energy to its frequency; foundation of quantum mechanics."],
  ["Reduced Planck Constant", "ħ", "1.05457×10⁻³⁴", "J·s", "Planck's constant divided by 2π, ubiquitous in quantum equations."],
  ["Elementary Charge", "e", "1.602176×10⁻¹⁹", "C", "The electric charge of a single proton."],
  ["Boltzmann Constant", "k_B", "1.380649×10⁻²³", "J/K", "Links temperature to energy at the particle scale."],
  ["Avogadro Constant", "N_A", "6.02214×10²³", "1/mol", "The number of particles in one mole."],
  ["Gas Constant", "R", "8.314462", "J/(mol·K)", "The molar gas constant in the ideal gas law."],
  ["Vacuum Permittivity", "ε₀", "8.854187×10⁻¹²", "F/m", "The electric constant governing electrostatic force."],
  ["Vacuum Permeability", "μ₀", "1.256637×10⁻⁶", "H/m", "The magnetic constant relating current to magnetic field."],
  ["Electron Mass", "m_e", "9.10938×10⁻³¹", "kg", "The rest mass of an electron."],
  ["Proton Mass", "m_p", "1.672621×10⁻²⁷", "kg", "The rest mass of a proton."],
  ["Stefan–Boltzmann Constant", "σ", "5.670374×10⁻⁸", "W/(m²·K⁴)", "Relates a black body's radiated power to its temperature."],
  ["Standard Gravity", "g₀", "9.80665", "m/s²", "Standard acceleration due to gravity at Earth's surface."],
  ["Atmospheric Pressure", "atm", "101,325", "Pa", "Standard atmospheric pressure at sea level."],
  ["Fine-Structure Constant", "α", "7.2973525×10⁻³", "—", "The dimensionless constant characterizing electromagnetic interaction strength."],
  ["Faraday Constant", "F", "96,485.33", "C/mol", "The charge per mole of electrons."],
  ["Rydberg Constant", "R∞", "1.0973731×10⁷", "1/m", "Sets the wavelengths of hydrogen's spectral lines."],
] as [string, string, string, string, string][]).map(([name, symbol, value, unit, blurb]) => ({ slug: slugify(name), name, symbol, value, unit, blurb }));

export function getConstant(slug: string): Constant | undefined { return CONSTANTS.find((c) => c.slug === slug); }
