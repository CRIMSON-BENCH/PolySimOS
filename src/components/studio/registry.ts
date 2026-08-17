import type { ComponentType } from "react";
import { NodeEditor } from "./NodeEditor";
import { ParticleStudio } from "./ParticleStudio";
import { FluidStudio } from "./FluidStudio";
import { DynamicsStudio } from "./DynamicsStudio";
import { FieldStudio } from "./FieldStudio";
import { CasStudio } from "./CasStudio";
import { SurrogateStudio } from "./SurrogateStudio";
import { Studio3D } from "./Studio3D";
import { FEAStudio } from "./FEAStudio";
import { FEA3DStudio } from "./FEA3DStudio";
import { EMStudio } from "./EMStudio";
import { MDStudio } from "./MDStudio";
import { MeshStudio } from "./MeshStudio";
import { Heat3DStudio } from "./Heat3DStudio";
import { CFD3DStudio } from "./CFD3DStudio";
import { VectorFieldStudio } from "./VectorFieldStudio";
import { OptimizeStudio } from "./OptimizeStudio";
import { Notebook } from "./Notebook";
import { GPUParticles } from "./GPUParticles";
import { GPUFluid } from "./GPUFluid";
import { GPUNBody } from "./GPUNBody";
import { GPUPDE } from "./GPUPDE";
import { GPUFluid3D } from "./GPUFluid3D";
import { GPUNBodyPM } from "./GPUNBodyPM";
import { DoublePendulumStudio } from "./DoublePendulumStudio";
import { FractalStudio } from "./FractalStudio";
import { FourierStudio } from "./FourierStudio";
import { Surface3DStudio } from "./Surface3DStudio";
import { IsingStudio } from "./IsingStudio";
import { MatrixStudio } from "./MatrixStudio";
import { GrapherStudio } from "./GrapherStudio";
import { ProjectileStudio } from "./ProjectileStudio";
import { AttractorStudio } from "./AttractorStudio";
import { RLCStudio } from "./RLCStudio";
import { WaveInterferenceStudio } from "./WaveInterferenceStudio";
import { CellularAutomataStudio } from "./CellularAutomataStudio";
import { RandomWalkStudio } from "./RandomWalkStudio";
import { TaylorStudio } from "./TaylorStudio";
import { NewtonStudio } from "./NewtonStudio";
import { DistributionsStudio } from "./DistributionsStudio";
import { KeplerStudio } from "./KeplerStudio";
import { DoubleSlitStudio } from "./DoubleSlitStudio";
import { ClothStudio } from "./ClothStudio";
import { GravityWellStudio } from "./GravityWellStudio";
import { EpidemicNetworkStudio } from "./EpidemicNetworkStudio";
import { GradientDescentStudio } from "./GradientDescentStudio";
import { ComplexStudio } from "./ComplexStudio";
import { SortingStudio } from "./SortingStudio";
import { BoidsStudio } from "./BoidsStudio";
import { TrafficStudio } from "./TrafficStudio";
import { PredatorPreyStudio } from "./PredatorPreyStudio";
import { LissajousStudio } from "./LissajousStudio";
import { MagneticPendulumStudio } from "./MagneticPendulumStudio";
import { PercolationStudio } from "./PercolationStudio";
import { DLAStudio } from "./DLAStudio";
import { RayOpticsStudio } from "./RayOpticsStudio";
import { GasStudio } from "./GasStudio";
import { CollisionsStudio } from "./CollisionsStudio";
import { BuoyancyStudio } from "./BuoyancyStudio";
import { RocketStudio } from "./RocketStudio";
import { BlackbodyStudio } from "./BlackbodyStudio";
import { PendulumWaveStudio } from "./PendulumWaveStudio";
import { OrbitalTransferStudio } from "./OrbitalTransferStudio";
import { StandingWaveStudio } from "./StandingWaveStudio";
import { DopplerStudio } from "./DopplerStudio";
import { SnellStudio } from "./SnellStudio";
import { DiffractionGratingStudio } from "./DiffractionGratingStudio";
import { BeatsStudio } from "./BeatsStudio";
import { MirrorStudio } from "./MirrorStudio";
import { PrismStudio } from "./PrismStudio";
import { FFTStudio } from "./FFTStudio";
import { TitrationStudio } from "./TitrationStudio";
import { KineticsStudio } from "./KineticsStudio";
import { EquilibriumStudio } from "./EquilibriumStudio";
import { PHStudio } from "./PHStudio";
import { RadioactiveDecayStudio } from "./RadioactiveDecayStudio";
import { MaxwellBoltzmannStudio } from "./MaxwellBoltzmannStudio";
import { IdealGasStudio } from "./IdealGasStudio";
import { BifurcationStudio } from "./BifurcationStudio";
import { DirectionFieldStudio } from "./DirectionFieldStudio";
import { RiemannStudio } from "./RiemannStudio";
import { EigenStudio } from "./EigenStudio";
import { MarkovStudio } from "./MarkovStudio";
import { ParametricStudio } from "./ParametricStudio";
import { NumericalMethodsStudio } from "./NumericalMethodsStudio";
import { PathfindingStudio } from "./PathfindingStudio";
import { MazeStudio } from "./MazeStudio";
import { NeuralNetStudio } from "./NeuralNetStudio";
import { KMeansStudio } from "./KMeansStudio";
import { ConvexHullStudio } from "./ConvexHullStudio";
import { LSystemStudio } from "./LSystemStudio";
import { TuringStudio } from "./TuringStudio";
import { ConvolutionStudio } from "./ConvolutionStudio";
import { ForestFireStudio } from "./ForestFireStudio";
import { SandpileStudio } from "./SandpileStudio";
import { SchellingStudio } from "./SchellingStudio";
import { LangtonStudio } from "./LangtonStudio";
import { ReactionDiffusionStudio } from "./ReactionDiffusionStudio";
import { WolframCAStudio } from "./WolframCAStudio";
import { GeneticStudio } from "./GeneticStudio";
import { AntColonyStudio } from "./AntColonyStudio";

// Slug → studio component. Used by the /embed/[slug] chromeless route.
export const STUDIO_COMPONENTS: Record<string, ComponentType> = {
  graph: NodeEditor,
  particles: ParticleStudio,
  fluid: FluidStudio,
  dynamics: DynamicsStudio,
  fields: FieldStudio,
  cas: CasStudio,
  surrogate: SurrogateStudio,
  "3d": Studio3D,
  fea: FEAStudio,
  "fea-3d": FEA3DStudio,
  electromagnetics: EMStudio,
  "molecular-dynamics": MDStudio,
  mesh: MeshStudio,
  "heat-3d": Heat3DStudio,
  "cfd-3d": CFD3DStudio,
  "vector-field": VectorFieldStudio,
  optimize: OptimizeStudio,
  notebook: Notebook,
  gpu: GPUParticles,
  "gpu-fluid": GPUFluid,
  "gpu-nbody": GPUNBody,
  "gpu-pde": GPUPDE,
  "gpu-fluid-3d": GPUFluid3D,
  "gpu-nbody-pm": GPUNBodyPM,
  "double-pendulum": DoublePendulumStudio,
  fractals: FractalStudio,
  fourier: FourierStudio,
  "surface-3d": Surface3DStudio,
  ising: IsingStudio,
  matrix: MatrixStudio,
  grapher: GrapherStudio,
  projectile: ProjectileStudio,
  attractors: AttractorStudio,
  rlc: RLCStudio,
  "wave-interference": WaveInterferenceStudio,
  "cellular-automata": CellularAutomataStudio,
  "random-walk": RandomWalkStudio,
  taylor: TaylorStudio,
  newton: NewtonStudio,
  distributions: DistributionsStudio,
  kepler: KeplerStudio,
  "double-slit": DoubleSlitStudio,
  cloth: ClothStudio,
  "gravity-well": GravityWellStudio,
  "epidemic-network": EpidemicNetworkStudio,
  "gradient-descent": GradientDescentStudio,
  complex: ComplexStudio,
  sorting: SortingStudio,
  boids: BoidsStudio,
  traffic: TrafficStudio,
  "predator-prey": PredatorPreyStudio,
  lissajous: LissajousStudio,
  "magnetic-pendulum": MagneticPendulumStudio,
  percolation: PercolationStudio,
  dla: DLAStudio,
  "ray-optics": RayOpticsStudio,
  gas: GasStudio,
  collisions: CollisionsStudio,
  buoyancy: BuoyancyStudio,
  rocket: RocketStudio,
  blackbody: BlackbodyStudio,
  "pendulum-wave": PendulumWaveStudio,
  "orbital-transfer": OrbitalTransferStudio,
  "standing-waves": StandingWaveStudio,
  doppler: DopplerStudio,
  "snells-law": SnellStudio,
  "diffraction-grating": DiffractionGratingStudio,
  beats: BeatsStudio,
  mirror: MirrorStudio,
  prism: PrismStudio,
  fft: FFTStudio,
  titration: TitrationStudio,
  "reaction-kinetics": KineticsStudio,
  equilibrium: EquilibriumStudio,
  ph: PHStudio,
  "radioactive-decay": RadioactiveDecayStudio,
  "maxwell-boltzmann": MaxwellBoltzmannStudio,
  "ideal-gas": IdealGasStudio,
  bifurcation: BifurcationStudio,
  "direction-field": DirectionFieldStudio,
  riemann: RiemannStudio,
  eigenvectors: EigenStudio,
  markov: MarkovStudio,
  parametric: ParametricStudio,
  "numerical-methods": NumericalMethodsStudio,
  pathfinding: PathfindingStudio,
  maze: MazeStudio,
  "neural-net": NeuralNetStudio,
  kmeans: KMeansStudio,
  "convex-hull": ConvexHullStudio,
  "l-system": LSystemStudio,
  "turing-machine": TuringStudio,
  convolution: ConvolutionStudio,
  "forest-fire": ForestFireStudio,
  sandpile: SandpileStudio,
  schelling: SchellingStudio,
  "langtons-ant": LangtonStudio,
  "reaction-diffusion": ReactionDiffusionStudio,
  "wolfram-ca": WolframCAStudio,
  "genetic-algorithm": GeneticStudio,
  "ant-colony": AntColonyStudio,
};

export const STUDIO_SLUGS = Object.keys(STUDIO_COMPONENTS);
