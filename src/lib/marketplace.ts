import { slugify } from "./seo";

export interface Listing {
  slug: string;
  title: string;
  kind: "Model" | "Node" | "Template";
  author: string;
  price: number; // 0 = free/fork
  rating: number;
  downloads: number;
  blurb: string;
  studio?: string;
}

const AUTHORS = ["a.curie", "e.noether", "r.feynman", "k.johnson", "s.chandrasekhar", "m.mirzakhani", "j.willard", "l.euler"];

type Seed = [title: string, kind: Listing["kind"], price: number, blurb: string, studio?: string];
const SEEDS: Seed[] = [
  ["Lorenz Attractor Explorer", "Model", 0, "The classic butterfly attractor with tunable σ, ρ, β and a phase-portrait view.", "/studio/dynamics"],
  ["SIR Outbreak Sandbox", "Model", 0, "A ready-to-fork epidemic model with policy sliders for β and γ.", "/studio/dynamics"],
  ["2D Wing in a Wind Tunnel", "Model", 5, "A pre-built airfoil scenario for the browser CFD solver.", "/studio/fluid"],
  ["Gray–Scott Pattern Pack", "Model", 3, "Twelve feed/kill presets that produce spots, stripes, and mazes.", "/studio/dynamics"],
  ["Cantilever Truss Kit", "Model", 4, "A parametric cantilever for the FEA solver with load presets.", "/studio/fea"],
  ["Dipole & Quadrupole Fields", "Model", 0, "Charge configurations for the electrostatics studio.", "/studio/electromagnetics"],
  ["Argon Melting Point Lab", "Model", 5, "A tuned Lennard-Jones setup that melts on cue.", "/studio/molecular-dynamics"],
  ["Heat Sink Steady-State", "Model", 6, "A meshed heat-sink domain with boundary conditions.", "/studio/mesh"],
  ["FFT Signal Node", "Node", 4, "A custom node that computes the discrete Fourier transform of a series."],
  ["PID Controller Node", "Node", 5, "Drop-in PID control block for closed-loop simulations."],
  ["Noise Generator Node", "Node", 2, "Perlin and white-noise sources for your graphs."],
  ["RK45 Adaptive Integrator", "Node", 6, "An adaptive-step ODE integrator node with error control."],
  ["Publication Figure Template", "Template", 3, "A styled export template for journal-ready figures."],
  ["Classroom Lab: Projectiles", "Template", 0, "A guided projectile-motion lab for students.", "/studio/particles"],
  ["3D Tower Load Study", "Model", 7, "A parametric space-frame for the 3D FEA solver.", "/studio/fea-3d"],
  ["Vector Field Gallery", "Template", 0, "A dozen named vector fields to explore.", "/studio/vector-field"],
];

export const LISTINGS: Listing[] = SEEDS.map((s, i) => {
  const [title, kind, price, blurb, studio] = s;
  const slug = slugify(title);
  let h = 0; for (let k = 0; k < slug.length; k++) h = (h * 31 + slug.charCodeAt(k)) >>> 0;
  return { slug, title, kind, price, blurb, studio, author: AUTHORS[i % AUTHORS.length], rating: 4.5 + (h % 5) / 10, downloads: 40 + (h % 4000) };
});

export function getListing(slug: string): Listing | undefined { return LISTINGS.find((l) => l.slug === slug); }
export function getAllListingSlugs(): string[] { return LISTINGS.map((l) => l.slug); }
