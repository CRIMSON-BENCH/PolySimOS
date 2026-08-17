import { slugify } from "./seo";

// Representative material properties compiled for simulation reference.
// Values are typical/approximate room-temperature figures and vary by grade,
// temperature, and processing — the accuracy disclaimer applies site-wide.

export interface Material {
  slug: string;
  name: string;
  category: string;
  density: number;        // kg/m^3
  youngsModulus: number;  // GPa
  thermalConductivity: number; // W/(m·K)
  specificHeat: number;   // J/(kg·K)
  meltingPoint: number;   // °C
  thermalExpansion: number; // 1e-6 /K
  poissonRatio: number;
}

export interface PropertyDef {
  key: keyof Material;
  slug: string;
  label: string;
  unit: string;
  blurb: string;
}

export const PROPERTIES: PropertyDef[] = [
  { key: "density", slug: "density", label: "Density", unit: "kg/m³", blurb: "Mass per unit volume — sets inertia and gravitational loads in a model." },
  { key: "youngsModulus", slug: "youngs-modulus", label: "Young's Modulus", unit: "GPa", blurb: "Stiffness under tension — the key input for structural FEA." },
  { key: "thermalConductivity", slug: "thermal-conductivity", label: "Thermal Conductivity", unit: "W/(m·K)", blurb: "How readily heat flows — drives conduction in thermal analysis." },
  { key: "specificHeat", slug: "specific-heat", label: "Specific Heat", unit: "J/(kg·K)", blurb: "Heat needed to raise temperature — governs transient thermal response." },
  { key: "meltingPoint", slug: "melting-point", label: "Melting Point", unit: "°C", blurb: "Upper thermal limit for solid-state operation and manufacturing." },
  { key: "thermalExpansion", slug: "thermal-expansion", label: "Thermal Expansion", unit: "×10⁻⁶/K", blurb: "How much it grows with temperature — critical for thermal-stress." },
  { key: "poissonRatio", slug: "poisson-ratio", label: "Poisson's Ratio", unit: "", blurb: "Transverse-to-axial strain ratio — needed for 3D elasticity." },
];

type Seed = [name: string, category: string, density: number, E: number, k: number, cp: number, melt: number, cte: number, nu: number];

const SEEDS: Seed[] = [
  // Metals
  ["Aluminum 6061", "Metal", 2700, 69, 167, 896, 660, 23.6, 0.33],
  ["Aluminum 7075", "Metal", 2810, 71, 130, 960, 635, 23.4, 0.33],
  ["Steel AISI 1018", "Metal", 7870, 205, 51, 486, 1425, 11.7, 0.29],
  ["Stainless Steel 304", "Metal", 8000, 193, 16, 500, 1450, 17.3, 0.29],
  ["Stainless Steel 316", "Metal", 8000, 193, 16, 500, 1375, 16, 0.3],
  ["Titanium Ti-6Al-4V", "Metal", 4430, 114, 6.7, 526, 1660, 8.6, 0.34],
  ["Copper C110", "Metal", 8960, 117, 391, 385, 1085, 16.5, 0.34],
  ["Brass C260", "Metal", 8530, 110, 120, 380, 915, 19.9, 0.34],
  ["Nickel 200", "Metal", 8890, 207, 70, 456, 1446, 13.3, 0.31],
  ["Magnesium AZ31B", "Metal", 1770, 45, 96, 1000, 630, 26, 0.35],
  ["Cast Iron (Gray)", "Metal", 7200, 110, 53, 490, 1150, 10.5, 0.26],
  ["Inconel 718", "Metal", 8190, 205, 11.4, 435, 1336, 13, 0.29],
  ["Lead", "Metal", 11340, 16, 35, 129, 327, 28.9, 0.44],
  ["Zinc", "Metal", 7135, 108, 116, 388, 420, 30.2, 0.25],
  ["Gold", "Metal", 19300, 79, 318, 129, 1064, 14.2, 0.44],
  ["Silver", "Metal", 10490, 83, 429, 235, 962, 18.9, 0.37],
  ["Tungsten", "Metal", 19250, 411, 173, 134, 3422, 4.5, 0.28],
  ["Molybdenum", "Metal", 10280, 329, 138, 251, 2623, 4.8, 0.31],
  // Polymers
  ["ABS", "Polymer", 1050, 2.3, 0.17, 1400, 105, 90, 0.35],
  ["Polycarbonate", "Polymer", 1200, 2.4, 0.2, 1200, 147, 65, 0.37],
  ["Nylon 6", "Polymer", 1140, 2.7, 0.25, 1670, 220, 80, 0.39],
  ["PLA", "Polymer", 1240, 3.5, 0.13, 1800, 160, 68, 0.36],
  ["PETG", "Polymer", 1270, 2.1, 0.29, 1200, 250, 60, 0.38],
  ["PTFE (Teflon)", "Polymer", 2200, 0.5, 0.25, 1010, 327, 135, 0.46],
  ["PEEK", "Polymer", 1320, 3.6, 0.25, 1340, 343, 47, 0.4],
  ["HDPE", "Polymer", 950, 1.1, 0.48, 1900, 130, 120, 0.42],
  ["PMMA (Acrylic)", "Polymer", 1180, 3.2, 0.19, 1470, 160, 70, 0.37],
  ["Polypropylene", "Polymer", 905, 1.5, 0.22, 1920, 160, 100, 0.42],
  ["Epoxy Resin", "Polymer", 1200, 3.5, 0.2, 1000, 150, 60, 0.35],
  ["Silicone Rubber", "Polymer", 1100, 0.05, 0.2, 1500, 300, 250, 0.48],
  // Ceramics & glass
  ["Alumina (Al₂O₃)", "Ceramic", 3950, 370, 30, 880, 2072, 8.1, 0.22],
  ["Silicon Carbide", "Ceramic", 3210, 410, 120, 750, 2730, 4, 0.16],
  ["Silicon Nitride", "Ceramic", 3200, 310, 30, 700, 1900, 3.3, 0.27],
  ["Zirconia (YSZ)", "Ceramic", 6000, 200, 2, 400, 2715, 10.5, 0.3],
  ["Borosilicate Glass", "Ceramic", 2230, 64, 1.2, 830, 820, 3.3, 0.2],
  ["Soda-Lime Glass", "Ceramic", 2520, 72, 1, 840, 700, 9, 0.22],
  ["Fused Silica", "Ceramic", 2200, 73, 1.4, 740, 1710, 0.55, 0.17],
  ["Tungsten Carbide", "Ceramic", 15630, 600, 110, 200, 2870, 5.5, 0.24],
  // Semiconductors
  ["Silicon", "Semiconductor", 2329, 130, 149, 700, 1414, 2.6, 0.28],
  ["Germanium", "Semiconductor", 5323, 103, 60, 320, 938, 5.9, 0.26],
  ["Gallium Arsenide", "Semiconductor", 5320, 85, 55, 330, 1238, 5.7, 0.31],
  ["Silicon Carbide (4H)", "Semiconductor", 3210, 450, 370, 690, 2830, 4.2, 0.21],
  // Composites & natural
  ["Carbon Fiber (CFRP)", "Composite", 1600, 150, 7, 1000, 3600, 2, 0.3],
  ["Fiberglass (GFRP)", "Composite", 1900, 40, 0.3, 1000, 1000, 5, 0.28],
  ["Kevlar 49", "Composite", 1440, 112, 0.04, 1420, 500, -3.5, 0.36],
  ["Plywood", "Natural", 600, 9, 0.13, 1600, 300, 30, 0.3],
  ["Oak (Wood)", "Natural", 750, 11, 0.17, 1700, 300, 40, 0.35],
  ["Concrete", "Natural", 2400, 30, 1.7, 880, 1500, 12, 0.2],
  ["Granite", "Natural", 2700, 50, 2.9, 790, 1260, 8, 0.25],
  ["Ice (0°C)", "Natural", 917, 9, 2.2, 2090, 0, 51, 0.33],
  ["Rubber (Natural)", "Natural", 930, 0.02, 0.13, 2000, 180, 200, 0.49],
  ["Graphite", "Natural", 2260, 20, 130, 710, 3650, 4, 0.2],
  ["Diamond", "Natural", 3510, 1050, 2200, 509, 3550, 1.1, 0.2],
];

export const MATERIALS: Material[] = SEEDS.map((s) => {
  const [name, category, density, youngsModulus, thermalConductivity, specificHeat, meltingPoint, thermalExpansion, poissonRatio] = s;
  return { slug: slugify(name), name, category, density, youngsModulus, thermalConductivity, specificHeat, meltingPoint, thermalExpansion, poissonRatio };
});

export function getMaterial(slug: string): Material | undefined {
  return MATERIALS.find((m) => m.slug === slug);
}
export function getAllMaterialSlugs(): string[] {
  return MATERIALS.map((m) => m.slug);
}
export function getProperty(slug: string): PropertyDef | undefined {
  return PROPERTIES.find((p) => p.slug === slug);
}
export function materialPropertyPairs(): { material: string; property: string }[] {
  const out: { material: string; property: string }[] = [];
  for (const m of MATERIALS) for (const p of PROPERTIES) out.push({ material: m.slug, property: p.slug });
  return out;
}
export function formatProp(m: Material, p: PropertyDef): string {
  const v = m[p.key] as number;
  return `${v}${p.unit ? " " + p.unit : ""}`;
}
export function materialsByCategory(): Record<string, Material[]> {
  const out: Record<string, Material[]> = {};
  for (const m of MATERIALS) (out[m.category] ??= []).push(m);
  return out;
}
// Rank materials by a property for the comparison tables on property pages.
export function rankByProperty(p: PropertyDef): Material[] {
  return [...MATERIALS].sort((a, b) => (b[p.key] as number) - (a[p.key] as number));
}
