import { slugify } from "./seo";

export interface Course {
  slug: string;
  code: string;
  name: string;
  level: "Intro" | "Undergraduate" | "Graduate";
  blurb: string;
  topics: string[];
  studios: { label: string; href: string }[];
}

type Seed = [code: string, name: string, level: Course["level"], blurb: string, topics: string[], studios: [string, string][]];

const SEEDS: Seed[] = [
  ["PHYS 101", "Introductory Mechanics", "Intro", "Newtonian mechanics: forces, motion, energy, and momentum.", ["Kinematics", "Newton's laws", "Energy & momentum"], [["Particle / N-Body", "/studio/particles"], ["Projectile motion", "/simulate/projectile-motion"]]],
  ["PHYS 102", "Electricity & Magnetism", "Intro", "Electric and magnetic fields, potential, and circuits.", ["Electric fields", "Potential", "Magnetism"], [["Electrostatics", "/studio/electromagnetics"], ["Vector Fields", "/studio/vector-field"]]],
  ["PHYS 201", "Waves & Oscillations", "Undergraduate", "Simple harmonic motion, waves, resonance, and interference.", ["SHM", "Wave equation", "Resonance"], [["Heat & Wave", "/studio/fields"], ["Dynamical Systems", "/studio/dynamics"]]],
  ["PHYS 301", "Classical Mechanics", "Undergraduate", "Lagrangian and Hamiltonian mechanics, orbits, and chaos.", ["Lagrangian mechanics", "Orbits", "Chaos"], [["3D N-Body", "/studio/3d"], ["Dynamical Systems", "/studio/dynamics"]]],
  ["PHYS 410", "Computational Physics", "Undergraduate", "Numerical methods for physical systems and simulation.", ["Numerical integration", "N-body", "Monte Carlo"], [["Node Graph", "/studio/graph"], ["GPU N-Body", "/studio/gpu-nbody"], ["Optimization + UQ", "/studio/optimize"]]],
  ["MATH 101", "Calculus I", "Intro", "Limits, derivatives, and applications of differentiation.", ["Limits", "Derivatives", "Optimization"], [["Symbolic Math", "/studio/cas"], ["Optimization + UQ", "/studio/optimize"]]],
  ["MATH 102", "Calculus II", "Intro", "Integration, series, and applications of integrals.", ["Integration", "Series", "Applications"], [["Symbolic Math", "/studio/cas"], ["Notebook", "/studio/notebook"]]],
  ["MATH 203", "Multivariable Calculus", "Undergraduate", "Partial derivatives, gradients, and vector calculus.", ["Gradients", "Vector fields", "Multiple integrals"], [["Vector Fields", "/studio/vector-field"], ["Symbolic Math", "/studio/cas"]]],
  ["MATH 204", "Differential Equations", "Undergraduate", "ODEs, systems, and qualitative dynamics.", ["ODEs", "Systems", "Stability"], [["Dynamical Systems", "/studio/dynamics"], ["Node Graph", "/studio/graph"]]],
  ["MATH 301", "Linear Algebra", "Undergraduate", "Matrices, eigenvalues, and linear transformations.", ["Matrices", "Eigenvalues", "Transformations"], [["Notebook", "/studio/notebook"]]],
  ["MATH 401", "Numerical Analysis", "Graduate", "Numerical methods, error analysis, and stability.", ["Root finding", "Numerical integration", "Stability"], [["Notebook", "/studio/notebook"], ["Optimization + UQ", "/studio/optimize"]]],
  ["ME 211", "Statics", "Undergraduate", "Equilibrium of rigid bodies, trusses, and frames.", ["Equilibrium", "Trusses", "Frames"], [["FEA Truss", "/studio/fea"], ["3D FEA", "/studio/fea-3d"]]],
  ["ME 212", "Dynamics", "Undergraduate", "Kinematics and kinetics of particles and rigid bodies.", ["Kinematics", "Kinetics", "Vibration"], [["Particle / N-Body", "/studio/particles"], ["Dynamical Systems", "/studio/dynamics"]]],
  ["ME 310", "Thermodynamics", "Undergraduate", "Energy, entropy, and heat transfer fundamentals.", ["Energy", "Entropy", "Heat transfer"], [["Heat & Wave", "/studio/fields"], ["3D Heat", "/studio/heat-3d"]]],
  ["ME 320", "Fluid Mechanics", "Undergraduate", "Fluid statics and dynamics, Bernoulli, and viscous flow.", ["Bernoulli", "Viscous flow", "Turbulence"], [["2D Fluid (CFD)", "/studio/fluid"], ["3D CFD", "/studio/cfd-3d"], ["WebGPU Fluid", "/studio/gpu-fluid"]]],
  ["ME 401", "Finite Element Analysis", "Graduate", "The finite element method for structures and fields.", ["Stiffness method", "Meshing", "Convergence"], [["FEA Truss", "/studio/fea"], ["Meshing + BCs", "/studio/mesh"], ["GPU PDE Solver", "/studio/gpu-pde"]]],
  ["ME 430", "Heat Transfer", "Undergraduate", "Conduction, convection, and radiation heat transfer.", ["Conduction", "Convection", "Radiation"], [["Meshing + BCs", "/studio/mesh"], ["3D Heat", "/studio/heat-3d"]]],
  ["AE 301", "Aerodynamics", "Undergraduate", "Airfoils, lift, drag, and compressible flow.", ["Airfoils", "Lift & drag", "Boundary layers"], [["2D Fluid (CFD)", "/studio/fluid"], ["3D CFD", "/studio/cfd-3d"]]],
  ["AE 420", "Orbital Mechanics", "Undergraduate", "Two-body and N-body orbital dynamics and transfers.", ["Kepler orbits", "N-body", "Transfers"], [["3D N-Body", "/studio/3d"], ["Particle-Mesh N-Body", "/studio/gpu-nbody-pm"]]],
  ["EE 201", "Circuits", "Undergraduate", "Linear circuits, transients, and AC analysis.", ["RLC circuits", "Transients", "AC analysis"], [["Dynamical Systems", "/studio/dynamics"], ["Node Graph", "/studio/graph"]]],
  ["EE 340", "Electromagnetic Fields", "Undergraduate", "Maxwell's equations, fields, and waves.", ["Electrostatics", "Magnetostatics", "Waves"], [["Electrostatics", "/studio/electromagnetics"], ["Vector Fields", "/studio/vector-field"]]],
  ["EE 350", "Control Systems", "Undergraduate", "Feedback, stability, and system response.", ["Feedback", "Stability", "Response"], [["Dynamical Systems", "/studio/dynamics"], ["Node Graph", "/studio/graph"]]],
  ["CHE 311", "Reaction Engineering", "Undergraduate", "Reaction kinetics, reactors, and selectivity.", ["Kinetics", "Reactors", "Selectivity"], [["Dynamical Systems", "/studio/dynamics"]]],
  ["CHE 320", "Transport Phenomena", "Graduate", "Momentum, heat, and mass transport.", ["Momentum", "Heat", "Mass transfer"], [["2D Fluid (CFD)", "/studio/fluid"], ["Meshing + BCs", "/studio/mesh"]]],
  ["CHEM 301", "Physical Chemistry", "Undergraduate", "Thermodynamics, kinetics, and molecular behavior.", ["Thermodynamics", "Kinetics", "Molecular dynamics"], [["Molecular Dynamics", "/studio/molecular-dynamics"], ["Dynamical Systems", "/studio/dynamics"]]],
  ["BIO 305", "Mathematical Biology", "Undergraduate", "Population dynamics, epidemics, and pattern formation.", ["Population dynamics", "Epidemics", "Turing patterns"], [["Dynamical Systems", "/studio/dynamics"]]],
  ["CS 370", "Scientific Computing", "Undergraduate", "Numerical computing, GPU acceleration, and visualization.", ["Numerical methods", "GPU compute", "Visualization"], [["GPU Compute", "/studio/gpu"], ["Notebook", "/studio/notebook"], ["Node Graph", "/studio/graph"]]],
  ["CS 480", "Scientific Machine Learning", "Graduate", "Surrogate models, PINNs, and data-driven simulation.", ["Surrogates", "PINNs", "Inverse problems"], [["AI Surrogate", "/studio/surrogate"], ["Optimization + UQ", "/studio/optimize"]]],
  ["MSE 340", "Materials Science", "Undergraduate", "Structure, properties, and computational materials.", ["Microstructure", "Properties", "Molecular dynamics"], [["Molecular Dynamics", "/studio/molecular-dynamics"], ["Materials Database", "/materials"]]],
  ["CE 340", "Structural Analysis", "Undergraduate", "Analysis of trusses, frames, and structures.", ["Trusses", "Frames", "Deflection"], [["FEA Truss", "/studio/fea"], ["3D FEA", "/studio/fea-3d"]]],
];

export const COURSES: Course[] = SEEDS.map((s) => {
  const [code, name, level, blurb, topics, studios] = s;
  return { slug: slugify(`${code} ${name}`), code, name, level, blurb, topics, studios: studios.map(([label, href]) => ({ label, href })) };
});

export function getCourse(slug: string): Course | undefined { return COURSES.find((c) => c.slug === slug); }
export function getAllCourseSlugs(): string[] { return COURSES.map((c) => c.slug); }
