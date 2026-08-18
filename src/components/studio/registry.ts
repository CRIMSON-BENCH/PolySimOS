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
import { FireSpreadStudio } from "./FireSpreadStudio";
import { HazmatPlumeStudio } from "./HazmatPlumeStudio";
import { EvacuationStudio } from "./EvacuationStudio";
import { TriageStudio } from "./TriageStudio";
import { HoseFlowStudio } from "./HoseFlowStudio";
import { SkidToStopStudio } from "./SkidToStopStudio";
import { RadioRangeStudio } from "./RadioRangeStudio";
import { BlastStandoffStudio } from "./BlastStandoffStudio";
import { ExoplanetTransitStudio } from "./ExoplanetTransitStudio";
import { HRDiagramStudio } from "./HRDiagramStudio";
import { LagrangeStudio } from "./LagrangeStudio";
import { RocheLimitStudio } from "./RocheLimitStudio";
import { HubbleStudio } from "./HubbleStudio";
import { TelescopeStudio } from "./TelescopeStudio";
import { ParallaxStudio } from "./ParallaxStudio";
import { EscapeVelocityStudio } from "./EscapeVelocityStudio";
import { EnergyBalanceStudio } from "./EnergyBalanceStudio";
import { DaisyworldStudio } from "./DaisyworldStudio";
import { MilankovitchStudio } from "./MilankovitchStudio";
import { TsunamiStudio } from "./TsunamiStudio";
import { CarbonCycleStudio } from "./CarbonCycleStudio";
import { SeismicStudio } from "./SeismicStudio";
import { GroundwaterStudio } from "./GroundwaterStudio";
import { LapseRateStudio } from "./LapseRateStudio";
import { BlackScholesStudio } from "./BlackScholesStudio";
import { OptionPayoffStudio } from "./OptionPayoffStudio";
import { MonteCarloStudio } from "./MonteCarloStudio";
import { EfficientFrontierStudio } from "./EfficientFrontierStudio";
import { VaRStudio } from "./VaRStudio";
import { BondPricingStudio } from "./BondPricingStudio";
import { CompoundInterestStudio } from "./CompoundInterestStudio";
import { AmortizationStudio } from "./AmortizationStudio";
import { GyroscopeStudio } from "./GyroscopeStudio";
import { CoupledOscillatorsStudio } from "./CoupledOscillatorsStudio";
import { DrivenResonanceStudio } from "./DrivenResonanceStudio";
import { GearTrainStudio } from "./GearTrainStudio";
import { RollingMotionStudio } from "./RollingMotionStudio";
import { RocketEquationStudio } from "./RocketEquationStudio";
import { CollisionLabStudio } from "./CollisionLabStudio";
import { MomentOfInertiaStudio } from "./MomentOfInertiaStudio";
import { PipeFlowStudio } from "./PipeFlowStudio";
import { PumpCurveStudio } from "./PumpCurveStudio";
import { OpenChannelStudio } from "./OpenChannelStudio";
import { HeatExchangerStudio } from "./HeatExchangerStudio";
import { CompressibleNozzleStudio } from "./CompressibleNozzleStudio";
import { BernoulliStudio } from "./BernoulliStudio";
import { FinCoolingStudio } from "./FinCoolingStudio";
import { PitotTubeStudio } from "./PitotTubeStudio";
import { Timer555Studio } from "./Timer555Studio";
import { LogicGatesStudio } from "./LogicGatesStudio";
import { BinaryAdderStudio } from "./BinaryAdderStudio";
import { BjtAmplifierStudio } from "./BjtAmplifierStudio";
import { ActiveFilterStudio } from "./ActiveFilterStudio";
import { BuckConverterStudio } from "./BuckConverterStudio";
import { AntennaPatternStudio } from "./AntennaPatternStudio";
import { MotorTorqueSpeedStudio } from "./MotorTorqueSpeedStudio";
import { TitrationCurveStudio } from "./TitrationCurveStudio";
import { ReactionEquilibriumStudio } from "./ReactionEquilibriumStudio";
import { NernstCellStudio } from "./NernstCellStudio";
import { ArrheniusRateStudio } from "./ArrheniusRateStudio";
import { SolubilityStudio } from "./SolubilityStudio";
import { VanDerWaalsStudio } from "./VanDerWaalsStudio";
import { BufferSolutionStudio } from "./BufferSolutionStudio";
import { ElectrolysisStudio } from "./ElectrolysisStudio";
import { PharmacokineticsStudio } from "./PharmacokineticsStudio";
import { MichaelisMentenStudio } from "./MichaelisMentenStudio";
import { WindkesselStudio } from "./WindkesselStudio";
import { CardiacActionPotentialStudio } from "./CardiacActionPotentialStudio";
import { MutationSelectionStudio } from "./MutationSelectionStudio";
import { PhyloDistanceStudio } from "./PhyloDistanceStudio";
import { TumorGrowthStudio } from "./TumorGrowthStudio";
import { OxygenDissociationStudio } from "./OxygenDissociationStudio";
import { BondDurationStudio } from "./BondDurationStudio";
import { OptionsGreeksStudio } from "./OptionsGreeksStudio";
import { BinomialOptionStudio } from "./BinomialOptionStudio";
import { CapmBetaStudio } from "./CapmBetaStudio";
import { DcfValuationStudio } from "./DcfValuationStudio";
import { KellyCriterionStudio } from "./KellyCriterionStudio";
import { MonteCarloRetirementStudio } from "./MonteCarloRetirementStudio";
import { DividendDiscountStudio } from "./DividendDiscountStudio";
import { PidTunerStudio } from "./PidTunerStudio";
import { RootLocusStudio } from "./RootLocusStudio";
import { StepResponseStudio } from "./StepResponseStudio";
import { BodeNyquistStudio } from "./BodeNyquistStudio";
import { StateSpaceStudio } from "./StateSpaceStudio";
import { LeadLagStudio } from "./LeadLagStudio";
import { FeedbackLoopStudio } from "./FeedbackLoopStudio";
import { SecondOrderResponseStudio } from "./SecondOrderResponseStudio";
import { FirFilterStudio } from "./FirFilterStudio";
import { DftAnalysisStudio } from "./DftAnalysisStudio";
import { WindowFunctionsStudio } from "./WindowFunctionsStudio";
import { QuantizationNoiseStudio } from "./QuantizationNoiseStudio";
import { AmFmModulationStudio } from "./AmFmModulationStudio";
import { MatchedFilterStudio } from "./MatchedFilterStudio";
import { SamplingTheoremStudio } from "./SamplingTheoremStudio";
import { PoleZeroStudio } from "./PoleZeroStudio";
import { PerceptronStudio } from "./PerceptronStudio";
import { KmeansClusterStudio } from "./KmeansClusterStudio";
import { DecisionTreeStudio } from "./DecisionTreeStudio";
import { KnnClassifierStudio } from "./KnnClassifierStudio";
import { LogisticRegressionStudio } from "./LogisticRegressionStudio";
import { SvmMarginStudio } from "./SvmMarginStudio";
import { NaiveBayesStudio } from "./NaiveBayesStudio";
import { QLearningStudio } from "./QLearningStudio";
import { SIRStudio } from "./SIRStudio";
import { NeuronHHStudio } from "./NeuronHHStudio";
import { LotkaVolterraStudio } from "./LotkaVolterraStudio";
import { HardyWeinbergStudio } from "./HardyWeinbergStudio";
import { EnzymeKineticsStudio } from "./EnzymeKineticsStudio";
import { LogisticGrowthStudio } from "./LogisticGrowthStudio";
import { GeneticDriftStudio } from "./GeneticDriftStudio";
import { SequenceAlignmentStudio } from "./SequenceAlignmentStudio";
import { BeamDeflectionStudio } from "./BeamDeflectionStudio";
import { ColumnBucklingStudio } from "./ColumnBucklingStudio";
import { MohrsCircleStudio } from "./MohrsCircleStudio";
import { ShearMomentStudio } from "./ShearMomentStudio";
import { RetainingWallStudio } from "./RetainingWallStudio";
import { BaseShearStudio } from "./BaseShearStudio";
import { SoilBearingStudio } from "./SoilBearingStudio";
import { ConcreteBeamStudio } from "./ConcreteBeamStudio";
import { BodePlotStudio } from "./BodePlotStudio";
import { FilterDesignerStudio } from "./FilterDesignerStudio";
import { PIDControlStudio } from "./PIDControlStudio";
import { TransmissionLineStudio } from "./TransmissionLineStudio";
import { OpAmpStudio } from "./OpAmpStudio";
import { ThreePhaseStudio } from "./ThreePhaseStudio";
import { TransistorBiasStudio } from "./TransistorBiasStudio";
import { AliasingStudio } from "./AliasingStudio";
import { HypothesisTestStudio } from "./HypothesisTestStudio";
import { LinearRegressionStudio } from "./LinearRegressionStudio";
import { CentralLimitStudio } from "./CentralLimitStudio";
import { ConfidenceIntervalStudio } from "./ConfidenceIntervalStudio";
import { BayesInferenceStudio } from "./BayesInferenceStudio";
import { BootstrapStudio } from "./BootstrapStudio";
import { PCAStudio } from "./PCAStudio";
import { ABTestStudio } from "./ABTestStudio";
import { ForwardKinematicsStudio } from "./ForwardKinematicsStudio";
import { InverseKinematicsStudio } from "./InverseKinematicsStudio";
import { DifferentialDriveStudio } from "./DifferentialDriveStudio";
import { CartPoleStudio } from "./CartPoleStudio";
import { QuadcopterStudio } from "./QuadcopterStudio";
import { RRTStudio } from "./RRTStudio";
import { DCMotorStudio } from "./DCMotorStudio";
import { KalmanFilterStudio } from "./KalmanFilterStudio";
import { ParticleBoxStudio } from "./ParticleBoxStudio";
import { QuantumTunnelingStudio } from "./QuantumTunnelingStudio";
import { BlochSphereStudio } from "./BlochSphereStudio";
import { HydrogenOrbitalStudio } from "./HydrogenOrbitalStudio";
import { RelativityStudio } from "./RelativityStudio";
import { PhotoelectricStudio } from "./PhotoelectricStudio";
import { QHOStudio } from "./QHOStudio";
import { SternGerlachStudio } from "./SternGerlachStudio";
import { HarmonicSeriesStudio } from "./HarmonicSeriesStudio";
import { EqualTemperamentStudio } from "./EqualTemperamentStudio";
import { ChladniStudio } from "./ChladniStudio";
import { HelmholtzStudio } from "./HelmholtzStudio";
import { RoomModesStudio } from "./RoomModesStudio";
import { ReverbTimeStudio } from "./ReverbTimeStudio";
import { SoundLevelsStudio } from "./SoundLevelsStudio";
import { AdditiveSynthStudio } from "./AdditiveSynthStudio";
import { StressStrainStudio } from "./StressStrainStudio";
import { CarnotCycleStudio } from "./CarnotCycleStudio";
import { OttoCycleStudio } from "./OttoCycleStudio";
import { PhaseDiagramStudio } from "./PhaseDiagramStudio";
import { ThermalExpansionStudio } from "./ThermalExpansionStudio";
import { FatigueStudio } from "./FatigueStudio";
import { EntropyStudio } from "./EntropyStudio";
import { ThermalResistanceStudio } from "./ThermalResistanceStudio";
import { LinearProgrammingStudio } from "./LinearProgrammingStudio";
import { KnapsackStudio } from "./KnapsackStudio";
import { QueueingStudio } from "./QueueingStudio";
import { EOQStudio } from "./EOQStudio";
import { SimulatedAnnealingStudio } from "./SimulatedAnnealingStudio";
import { CriticalPathStudio } from "./CriticalPathStudio";
import { GameTheoryStudio } from "./GameTheoryStudio";
import { MaxFlowStudio } from "./MaxFlowStudio";
import { GraphShortestPathStudio } from "./GraphShortestPathStudio";
import { MSTStudio } from "./MSTStudio";
import { GraphColoringStudio } from "./GraphColoringStudio";
import { SmallWorldStudio } from "./SmallWorldStudio";
import { PageRankStudio } from "./PageRankStudio";
import { BipartiteMatchingStudio } from "./BipartiteMatchingStudio";
import { CentralityStudio } from "./CentralityStudio";
import { GraphTraversalStudio } from "./GraphTraversalStudio";
import { SupplyDemandStudio } from "./SupplyDemandStudio";
import { ElasticityStudio } from "./ElasticityStudio";
import { MonopolyStudio } from "./MonopolyStudio";
import { CobbDouglasStudio } from "./CobbDouglasStudio";
import { LorenzGiniStudio } from "./LorenzGiniStudio";
import { LafferStudio } from "./LafferStudio";
import { ComparativeAdvantageStudio } from "./ComparativeAdvantageStudio";
import { IndifferenceCurveStudio } from "./IndifferenceCurveStudio";
import { AirfoilPolarStudio } from "./AirfoilPolarStudio";
import { GlideStudio } from "./GlideStudio";
import { RocketStagingStudio } from "./RocketStagingStudio";
import { ReentryStudio } from "./ReentryStudio";
import { StandardAtmosphereStudio } from "./StandardAtmosphereStudio";
import { MachConeStudio } from "./MachConeStudio";
import { PropellerStudio } from "./PropellerStudio";
import { OrbitalElementsStudio } from "./OrbitalElementsStudio";
import { AtmosphericStabilityStudio } from "./AtmosphericStabilityStudio";
import { CoriolisStudio } from "./CoriolisStudio";
import { HurricaneStudio } from "./HurricaneStudio";
import { WindChillStudio } from "./WindChillStudio";
import { PsychrometricsStudio } from "./PsychrometricsStudio";
import { GeostrophicWindStudio } from "./GeostrophicWindStudio";
import { RossbyWaveStudio } from "./RossbyWaveStudio";
import { RankineVortexStudio } from "./RankineVortexStudio";
import { LaserCavityStudio } from "./LaserCavityStudio";
import { FiberOpticsStudio } from "./FiberOpticsStudio";
import { GaussianBeamStudio } from "./GaussianBeamStudio";
import { PolarizationStudio } from "./PolarizationStudio";
import { ThinFilmStudio } from "./ThinFilmStudio";
import { SingleSlitStudio } from "./SingleSlitStudio";
import { BraggMirrorStudio } from "./BraggMirrorStudio";
import { LEDStudio } from "./LEDStudio";
import { BindingEnergyStudio } from "./BindingEnergyStudio";
import { FissionReactorStudio } from "./FissionReactorStudio";
import { FusionLawsonStudio } from "./FusionLawsonStudio";
import { RadiometricDatingStudio } from "./RadiometricDatingStudio";
import { RadiationShieldingStudio } from "./RadiationShieldingStudio";
import { RadiationDoseStudio } from "./RadiationDoseStudio";
import { ReactorKineticsStudio } from "./ReactorKineticsStudio";
import { NeutronTransportStudio } from "./NeutronTransportStudio";
import { SolarPanelStudio } from "./SolarPanelStudio";
import { WindPowerStudio } from "./WindPowerStudio";
import { HydroPowerStudio } from "./HydroPowerStudio";
import { HeatPumpStudio } from "./HeatPumpStudio";
import { EVEfficiencyStudio } from "./EVEfficiencyStudio";
import { BatteryStorageStudio } from "./BatteryStorageStudio";
import { CarbonFootprintStudio } from "./CarbonFootprintStudio";
import { LCOEStudio } from "./LCOEStudio";
import { RSAStudio } from "./RSAStudio";
import { DiffieHellmanStudio } from "./DiffieHellmanStudio";
import { ClassicalCiphersStudio } from "./ClassicalCiphersStudio";
import { HashAvalancheStudio } from "./HashAvalancheStudio";
import { ShannonEntropyStudio } from "./ShannonEntropyStudio";
import { HuffmanStudio } from "./HuffmanStudio";
import { HammingStudio } from "./HammingStudio";
import { EllipticCurveStudio } from "./EllipticCurveStudio";
import { HaversineStudio } from "./HaversineStudio";
import { MapProjectionStudio } from "./MapProjectionStudio";
import { GPSTrilaterationStudio } from "./GPSTrilaterationStudio";
import { ViewshedStudio } from "./ViewshedStudio";
import { SpatialInterpolationStudio } from "./SpatialInterpolationStudio";
import { DeadReckoningStudio } from "./DeadReckoningStudio";
import { RhumbLineStudio } from "./RhumbLineStudio";
import { PointInPolygonStudio } from "./PointInPolygonStudio";
import { ToleranceStackupStudio } from "./ToleranceStackupStudio";
import { ProcessCapabilityStudio } from "./ProcessCapabilityStudio";
import { OEEStudio } from "./OEEStudio";
import { CNCStudio } from "./CNCStudio";
import { LineBalancingStudio } from "./LineBalancingStudio";
import { ControlChartStudio } from "./ControlChartStudio";
import { LearningCurveStudio } from "./LearningCurveStudio";
import { LittlesLawStudio } from "./LittlesLawStudio";
import { EloStudio } from "./EloStudio";
import { PythagoreanStudio } from "./PythagoreanStudio";
import { MarathonPacingStudio } from "./MarathonPacingStudio";
import { MagnusStudio } from "./MagnusStudio";
import { XGStudio } from "./XGStudio";
import { WinProbabilityStudio } from "./WinProbabilityStudio";
import { TournamentStudio } from "./TournamentStudio";
import { ShotArcStudio } from "./ShotArcStudio";
import { DiceProbabilityStudio } from "./DiceProbabilityStudio";
import { PokerOddsStudio } from "./PokerOddsStudio";
import { RouletteStudio } from "./RouletteStudio";
import { BirthdayParadoxStudio } from "./BirthdayParadoxStudio";
import { GamblersRuinStudio } from "./GamblersRuinStudio";
import { MontyHallStudio } from "./MontyHallStudio";
import { LawLargeNumbersStudio } from "./LawLargeNumbersStudio";
import { LotteryStudio } from "./LotteryStudio";

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
  "fire-spread": FireSpreadStudio,
  "hazmat-plume": HazmatPlumeStudio,
  evacuation: EvacuationStudio,
  triage: TriageStudio,
  "hose-flow": HoseFlowStudio,
  "skid-to-stop": SkidToStopStudio,
  "radio-range": RadioRangeStudio,
  "blast-standoff": BlastStandoffStudio,
  "exoplanet-transit": ExoplanetTransitStudio,
  "hr-diagram": HRDiagramStudio,
  "lagrange-points": LagrangeStudio,
  "roche-limit": RocheLimitStudio,
  "hubble-law": HubbleStudio,
  telescope: TelescopeStudio,
  parallax: ParallaxStudio,
  "escape-velocity": EscapeVelocityStudio,
  "energy-balance": EnergyBalanceStudio,
  daisyworld: DaisyworldStudio,
  milankovitch: MilankovitchStudio,
  tsunami: TsunamiStudio,
  "carbon-cycle": CarbonCycleStudio,
  seismic: SeismicStudio,
  groundwater: GroundwaterStudio,
  "lapse-rate": LapseRateStudio,
  "black-scholes": BlackScholesStudio,
  "option-payoff": OptionPayoffStudio,
  "monte-carlo": MonteCarloStudio,
  "efficient-frontier": EfficientFrontierStudio,
  "value-at-risk": VaRStudio,
  "bond-pricing": BondPricingStudio,
  "compound-interest": CompoundInterestStudio,
  amortization: AmortizationStudio,
  "sir-model": SIRStudio,
  neuron: NeuronHHStudio,
  "lotka-volterra": LotkaVolterraStudio,
  "hardy-weinberg": HardyWeinbergStudio,
  "enzyme-kinetics": EnzymeKineticsStudio,
  "logistic-growth": LogisticGrowthStudio,
  "genetic-drift": GeneticDriftStudio,
  "sequence-alignment": SequenceAlignmentStudio,
  "beam-deflection": BeamDeflectionStudio,
  "column-buckling": ColumnBucklingStudio,
  "mohrs-circle": MohrsCircleStudio,
  "shear-moment": ShearMomentStudio,
  "retaining-wall": RetainingWallStudio,
  "base-shear": BaseShearStudio,
  "soil-bearing": SoilBearingStudio,
  "concrete-beam": ConcreteBeamStudio,
  "bode-plot": BodePlotStudio,
  "filter-designer": FilterDesignerStudio,
  "pid-control": PIDControlStudio,
  "transmission-line": TransmissionLineStudio,
  "op-amp": OpAmpStudio,
  "three-phase": ThreePhaseStudio,
  "transistor-bias": TransistorBiasStudio,
  aliasing: AliasingStudio,
  "hypothesis-test": HypothesisTestStudio,
  "linear-regression": LinearRegressionStudio,
  "central-limit": CentralLimitStudio,
  "confidence-interval": ConfidenceIntervalStudio,
  "bayes-inference": BayesInferenceStudio,
  bootstrap: BootstrapStudio,
  pca: PCAStudio,
  "ab-test": ABTestStudio,
  "forward-kinematics": ForwardKinematicsStudio,
  "inverse-kinematics": InverseKinematicsStudio,
  "differential-drive": DifferentialDriveStudio,
  "cart-pole": CartPoleStudio,
  quadcopter: QuadcopterStudio,
  rrt: RRTStudio,
  "dc-motor": DCMotorStudio,
  "kalman-filter": KalmanFilterStudio,
  "particle-box": ParticleBoxStudio,
  "quantum-tunneling": QuantumTunnelingStudio,
  "bloch-sphere": BlochSphereStudio,
  "hydrogen-orbitals": HydrogenOrbitalStudio,
  "special-relativity": RelativityStudio,
  photoelectric: PhotoelectricStudio,
  "quantum-harmonic": QHOStudio,
  "stern-gerlach": SternGerlachStudio,
  "harmonic-series": HarmonicSeriesStudio,
  "equal-temperament": EqualTemperamentStudio,
  chladni: ChladniStudio,
  "helmholtz-resonator": HelmholtzStudio,
  "room-modes": RoomModesStudio,
  "reverb-time": ReverbTimeStudio,
  "sound-levels": SoundLevelsStudio,
  "additive-synthesis": AdditiveSynthStudio,
  "stress-strain": StressStrainStudio,
  "carnot-cycle": CarnotCycleStudio,
  "otto-cycle": OttoCycleStudio,
  "phase-diagram": PhaseDiagramStudio,
  "thermal-expansion": ThermalExpansionStudio,
  fatigue: FatigueStudio,
  entropy: EntropyStudio,
  "thermal-resistance": ThermalResistanceStudio,
  "linear-programming": LinearProgrammingStudio,
  knapsack: KnapsackStudio,
  queueing: QueueingStudio,
  eoq: EOQStudio,
  "simulated-annealing": SimulatedAnnealingStudio,
  "critical-path": CriticalPathStudio,
  "game-theory": GameTheoryStudio,
  "max-flow": MaxFlowStudio,
  "shortest-path": GraphShortestPathStudio,
  "spanning-tree": MSTStudio,
  "graph-coloring": GraphColoringStudio,
  "small-world": SmallWorldStudio,
  pagerank: PageRankStudio,
  "bipartite-matching": BipartiteMatchingStudio,
  centrality: CentralityStudio,
  "graph-traversal": GraphTraversalStudio,
  "supply-demand": SupplyDemandStudio,
  elasticity: ElasticityStudio,
  monopoly: MonopolyStudio,
  "cobb-douglas": CobbDouglasStudio,
  "lorenz-gini": LorenzGiniStudio,
  "laffer-curve": LafferStudio,
  "comparative-advantage": ComparativeAdvantageStudio,
  "indifference-curves": IndifferenceCurveStudio,
  "airfoil-polar": AirfoilPolarStudio,
  glide: GlideStudio,
  "rocket-staging": RocketStagingStudio,
  reentry: ReentryStudio,
  "standard-atmosphere": StandardAtmosphereStudio,
  "mach-cone": MachConeStudio,
  propeller: PropellerStudio,
  "orbital-elements": OrbitalElementsStudio,
  "atmospheric-stability": AtmosphericStabilityStudio,
  coriolis: CoriolisStudio,
  hurricane: HurricaneStudio,
  "wind-chill": WindChillStudio,
  psychrometrics: PsychrometricsStudio,
  "geostrophic-wind": GeostrophicWindStudio,
  "rossby-waves": RossbyWaveStudio,
  "rankine-vortex": RankineVortexStudio,
  "laser-cavity": LaserCavityStudio,
  "fiber-optics": FiberOpticsStudio,
  "gaussian-beam": GaussianBeamStudio,
  polarization: PolarizationStudio,
  "thin-film": ThinFilmStudio,
  "single-slit": SingleSlitStudio,
  "bragg-mirror": BraggMirrorStudio,
  led: LEDStudio,
  "binding-energy": BindingEnergyStudio,
  "fission-reactor": FissionReactorStudio,
  "fusion-lawson": FusionLawsonStudio,
  "radiometric-dating": RadiometricDatingStudio,
  "radiation-shielding": RadiationShieldingStudio,
  "radiation-dose": RadiationDoseStudio,
  "reactor-kinetics": ReactorKineticsStudio,
  "neutron-transport": NeutronTransportStudio,
  "solar-panel": SolarPanelStudio,
  "wind-power": WindPowerStudio,
  "hydro-power": HydroPowerStudio,
  "heat-pump": HeatPumpStudio,
  "ev-efficiency": EVEfficiencyStudio,
  "battery-storage": BatteryStorageStudio,
  "carbon-footprint": CarbonFootprintStudio,
  lcoe: LCOEStudio,
  rsa: RSAStudio,
  "diffie-hellman": DiffieHellmanStudio,
  "classical-ciphers": ClassicalCiphersStudio,
  "hash-avalanche": HashAvalancheStudio,
  "shannon-entropy": ShannonEntropyStudio,
  huffman: HuffmanStudio,
  "hamming-code": HammingStudio,
  "elliptic-curve": EllipticCurveStudio,
  haversine: HaversineStudio,
  "map-projection": MapProjectionStudio,
  "gps-trilateration": GPSTrilaterationStudio,
  viewshed: ViewshedStudio,
  "spatial-interpolation": SpatialInterpolationStudio,
  "dead-reckoning": DeadReckoningStudio,
  "rhumb-line": RhumbLineStudio,
  "point-in-polygon": PointInPolygonStudio,
  "tolerance-stackup": ToleranceStackupStudio,
  "process-capability": ProcessCapabilityStudio,
  oee: OEEStudio,
  "cnc-feeds-speeds": CNCStudio,
  "line-balancing": LineBalancingStudio,
  "control-chart": ControlChartStudio,
  "learning-curve": LearningCurveStudio,
  "littles-law": LittlesLawStudio,
  "elo-rating": EloStudio,
  "pythagorean-expectation": PythagoreanStudio,
  "marathon-pacing": MarathonPacingStudio,
  "magnus-effect": MagnusStudio,
  "xg-model": XGStudio,
  "win-probability": WinProbabilityStudio,
  "tournament-bracket": TournamentStudio,
  "shot-arc": ShotArcStudio,
  "dice-probability": DiceProbabilityStudio,
  "poker-odds": PokerOddsStudio,
  roulette: RouletteStudio,
  "birthday-paradox": BirthdayParadoxStudio,
  "gamblers-ruin": GamblersRuinStudio,
  "monty-hall": MontyHallStudio,
  "law-of-large-numbers": LawLargeNumbersStudio,
  "lottery-odds": LotteryStudio,
  gyroscope: GyroscopeStudio,
  "coupled-oscillators": CoupledOscillatorsStudio,
  "driven-resonance": DrivenResonanceStudio,
  "gear-train": GearTrainStudio,
  "rolling-motion": RollingMotionStudio,
  "rocket-equation": RocketEquationStudio,
  "collision-lab": CollisionLabStudio,
  "moment-of-inertia": MomentOfInertiaStudio,
  "pipe-flow": PipeFlowStudio,
  "pump-curve": PumpCurveStudio,
  "open-channel": OpenChannelStudio,
  "heat-exchanger": HeatExchangerStudio,
  "compressible-nozzle": CompressibleNozzleStudio,
  bernoulli: BernoulliStudio,
  "fin-cooling": FinCoolingStudio,
  "pitot-tube": PitotTubeStudio,
  "timer-555": Timer555Studio,
  "logic-gates": LogicGatesStudio,
  "binary-adder": BinaryAdderStudio,
  "bjt-amplifier": BjtAmplifierStudio,
  "active-filter": ActiveFilterStudio,
  "buck-converter": BuckConverterStudio,
  "antenna-pattern": AntennaPatternStudio,
  "motor-torque-speed": MotorTorqueSpeedStudio,
  "titration-curve": TitrationCurveStudio,
  "reaction-equilibrium": ReactionEquilibriumStudio,
  "nernst-cell": NernstCellStudio,
  "arrhenius-rate": ArrheniusRateStudio,
  solubility: SolubilityStudio,
  "van-der-waals": VanDerWaalsStudio,
  "buffer-solution": BufferSolutionStudio,
  electrolysis: ElectrolysisStudio,
  pharmacokinetics: PharmacokineticsStudio,
  "michaelis-menten": MichaelisMentenStudio,
  windkessel: WindkesselStudio,
  "cardiac-action-potential": CardiacActionPotentialStudio,
  "mutation-selection": MutationSelectionStudio,
  "phylo-distance": PhyloDistanceStudio,
  "tumor-growth": TumorGrowthStudio,
  "oxygen-dissociation": OxygenDissociationStudio,
  "bond-duration": BondDurationStudio,
  "options-greeks": OptionsGreeksStudio,
  "binomial-option": BinomialOptionStudio,
  "capm-beta": CapmBetaStudio,
  "dcf-valuation": DcfValuationStudio,
  "kelly-criterion": KellyCriterionStudio,
  "monte-carlo-retirement": MonteCarloRetirementStudio,
  "dividend-discount": DividendDiscountStudio,
  "pid-tuner": PidTunerStudio,
  "root-locus": RootLocusStudio,
  "step-response": StepResponseStudio,
  "bode-nyquist": BodeNyquistStudio,
  "state-space": StateSpaceStudio,
  "lead-lag": LeadLagStudio,
  "feedback-loop": FeedbackLoopStudio,
  "second-order-response": SecondOrderResponseStudio,
  "fir-filter": FirFilterStudio,
  "dft-analysis": DftAnalysisStudio,
  "window-functions": WindowFunctionsStudio,
  "quantization-noise": QuantizationNoiseStudio,
  "am-fm-modulation": AmFmModulationStudio,
  "matched-filter": MatchedFilterStudio,
  "sampling-theorem": SamplingTheoremStudio,
  "pole-zero": PoleZeroStudio,
  perceptron: PerceptronStudio,
  "kmeans-cluster": KmeansClusterStudio,
  "decision-tree": DecisionTreeStudio,
  "knn-classifier": KnnClassifierStudio,
  "logistic-regression": LogisticRegressionStudio,
  "svm-margin": SvmMarginStudio,
  "naive-bayes": NaiveBayesStudio,
  "q-learning": QLearningStudio,
};

export const STUDIO_SLUGS = Object.keys(STUDIO_COMPONENTS);
