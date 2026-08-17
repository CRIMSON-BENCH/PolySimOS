import { slugify } from "./seo";

export interface Standard {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  units: string[];
  studios: { label: string; href: string }[];
}

type Seed = [name: string, region: string, blurb: string, units: string[], studios: [string, string][]];

const SEEDS: Seed[] = [
  ["AP Physics 1", "USA (College Board)", "Algebra-based mechanics, waves, and circuits for high-school students.", ["Kinematics", "Newton's laws", "Energy", "Waves"], [["Particle / N-Body", "/studio/particles"], ["Heat & Wave", "/studio/fields"]]],
  ["AP Physics C: Mechanics", "USA (College Board)", "Calculus-based mechanics: dynamics, energy, momentum, rotation.", ["Dynamics", "Work & energy", "Rotation", "Oscillations"], [["Particle / N-Body", "/studio/particles"], ["Dynamical Systems", "/studio/dynamics"], ["3D N-Body", "/studio/3d"]]],
  ["AP Physics C: E&M", "USA (College Board)", "Calculus-based electricity and magnetism.", ["Electrostatics", "Circuits", "Magnetism", "Induction"], [["Electrostatics", "/studio/electromagnetics"], ["Vector Fields", "/studio/vector-field"]]],
  ["AP Calculus AB", "USA (College Board)", "Limits, derivatives, and integrals with applications.", ["Limits", "Derivatives", "Integrals"], [["Symbolic Math", "/studio/cas"], ["Optimization + UQ", "/studio/optimize"]]],
  ["AP Calculus BC", "USA (College Board)", "AB topics plus series, parametric, and polar calculus.", ["Series", "Parametric", "Polar", "Differential equations"], [["Symbolic Math", "/studio/cas"], ["Dynamical Systems", "/studio/dynamics"]]],
  ["IB Physics HL", "International Baccalaureate", "Higher-level physics across mechanics, fields, and thermal.", ["Mechanics", "Thermal", "Fields", "Waves"], [["Particle / N-Body", "/studio/particles"], ["Heat & Wave", "/studio/fields"], ["Electrostatics", "/studio/electromagnetics"]]],
  ["IB Mathematics HL", "International Baccalaureate", "Higher-level mathematics including calculus and vectors.", ["Calculus", "Vectors", "Differential equations"], [["Symbolic Math", "/studio/cas"], ["Vector Fields", "/studio/vector-field"]]],
  ["A-Level Physics", "UK (AQA/OCR/Edexcel)", "Advanced-level physics for UK sixth-form students.", ["Mechanics", "Fields", "Waves", "Nuclear"], [["Particle / N-Body", "/studio/particles"], ["Heat & Wave", "/studio/fields"]]],
  ["A-Level Mathematics", "UK (AQA/OCR/Edexcel)", "Advanced-level mathematics including mechanics and calculus.", ["Calculus", "Mechanics", "Statistics"], [["Symbolic Math", "/studio/cas"], ["Optimization + UQ", "/studio/optimize"]]],
  ["NGSS Physical Science", "USA (Next Gen Science Standards)", "Inquiry-based physical science for K-12 classrooms.", ["Forces & motion", "Energy", "Waves"], [["Particle / N-Body", "/studio/particles"], ["Heat & Wave", "/studio/fields"]]],
  ["GCSE Physics", "UK", "Foundation and higher-tier physics for secondary students.", ["Forces", "Energy", "Waves", "Electricity"], [["Particle / N-Body", "/studio/particles"], ["Electrostatics", "/studio/electromagnetics"]]],
  ["MCAT Physics", "USA (Pre-Med)", "Physics topics tested on the MCAT for medical-school applicants.", ["Mechanics", "Fluids", "Electrostatics", "Waves"], [["2D Fluid (CFD)", "/studio/fluid"], ["Electrostatics", "/studio/electromagnetics"]]],
];

export const STANDARDS: Standard[] = SEEDS.map((s) => {
  const [name, region, blurb, units, studios] = s;
  return { slug: slugify(name), name, region, blurb, units, studios: studios.map(([label, href]) => ({ label, href })) };
});

export function getStandard(slug: string): Standard | undefined { return STANDARDS.find((s) => s.slug === slug); }
export function getAllStandardSlugs(): string[] { return STANDARDS.map((s) => s.slug); }
