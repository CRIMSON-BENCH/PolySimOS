# PolySim OS — Solver Master Plan (Road to 280+)

## Vision
Be the **Wolfram Alpha of interactive simulation** — the first place on the internet where anyone (student, researcher, engineer, first responder, hobbyist) can open a browser and *run* real science, not just read about it. **First-of-a-kind: the largest interactive simulation library ever assembled, spanning every field, free to start, embeddable everywhere.**

Positioning line to repeat everywhere: *"Nothing like this has ever been built. 280+ real simulators across every science — running in your browser, free."*

## Status
- **Built & live: 57 simulators** (physics, math, CFD, FEA, EM, MD, GPU/WebGPU, chaos, CS, bio, complex systems).
- **Target: 280–300.** ~220 more, in ~28 batches of 8. Vercel + client-side rendering means page/scale cost is a non-issue.
- Two product words, used deliberately: **"solvers"** (you put numbers in, get answers/plots — calculators, equation tools) and **"simulations"** (dynamic, animated, interactive). Many pages offer both.

---

## The full solver catalog (by domain)

### Classical mechanics & dynamics
projectile ✓ · double pendulum ✓ · particles/N-body ✓ · Kepler orbits ✓ · gravity well ✓ · cloth/spring-mass ✓ · magnetic pendulum ✓ · Van der Pol ✓ · pendulum wave · gyroscope/precession · spinning top · billiards/elastic collisions · inclined plane + friction · pulley systems · center of mass/torque balance · rolling vs sliding · Atwood machine · ballistic pendulum · Hohmann transfer · gravitational slingshot · three-body (figure-8) · tidal forces · Coriolis/rotating frame · normal modes (coupled oscillators) · damped/driven resonance

### Fluids & gases
2D fluid CFD ✓ · 3D CFD ✓ · WebGPU fluid ✓ · WebGPU 3D fluid ✓ · smoke/plume · wind tunnel (airfoil) · Bernoulli/venturi · pipe flow (Poiseuille) · lift & drag calculator · buoyancy/fluid statics · kinetic theory (gas in a box) · Maxwell–Boltzmann distribution · barometric/atmosphere · ideal gas law (PV=nRT) · shock wave/sonic boom · vortex shedding · Rayleigh–Bénard convection · dam break (SPH)

### Waves, optics & acoustics
heat & wave ✓ · wave interference ✓ · double-slit ✓ · ray optics/lenses ✓ · standing waves on a string · Doppler effect · Snell's law/refraction · thin-film interference · diffraction grating · ripple tank + obstacles · beats/superposition · sound synthesis (additive) · sonar/echolocation · fiber-optic total internal reflection · polarization · mirror (concave/convex) · prism dispersion · Chladni plates

### Electromagnetism & circuits
electrostatics ✓ · RLC circuit ✓ · vector fields ✓ · Ohm's law/resistor networks · capacitor charging · magnetic field of currents (Biot–Savart) · Faraday induction · Lorentz force/cyclotron · transformer · AC waveform/phasors · logic gates & adders · transmission line · antenna radiation pattern · Wheatstone bridge · op-amp basics

### Thermodynamics & statistical mechanics
Ising model ✓ · 3D heat ✓ · random walk/diffusion ✓ · Carnot cycle/PV diagram · entropy/2nd law demo · blackbody radiation · heat engine efficiency · phase diagram (water) · latent heat/phase change · thermal conduction (materials) · Brownian motion ✓ · Boltzmann distribution · specific heat

### Chemistry & materials
molecular dynamics ✓ · materials database ✓ · titration curve · reaction kinetics/Arrhenius · chemical equilibrium (Le Chatelier) · pH/buffer calculator · gas laws combined · crystal lattice viewer (3D) · radioactive decay chains · half-life calculator · electrolysis/electrochem cell · bonding/orbital shapes · diffusion across membrane · polymer chain · combustion/stoichiometry balancer

### Biology & medicine
SIR epidemic ✓ · epidemic network ✓ · predator-prey spatial ✓ · Lotka–Volterra ✓ · Gray-Scott ✓ · population growth (logistic) · Hardy–Weinberg genetics · gene drift/selection · neuron (Hodgkin–Huxley) · action potential · enzyme kinetics (Michaelis–Menten) · blood flow (vessel CFD) · drug dosage/pharmacokinetics · tumor growth · heart rhythm/ECG · protein folding (toy) · ecosystem food web · cell membrane transport

### Mathematics
CAS ✓ · grapher ✓ · 3D surface ✓ · matrix calc ✓ · Fourier ✓ · Taylor ✓ · Newton ✓ · complex/domain coloring ✓ · distributions ✓ · vector fields ✓ · optimize/UQ ✓ · integration/Riemann sums · slope/direction fields · bifurcation diagram (logistic map) · parametric & polar grapher · eigenvector visualizer · Markov chains · cobweb plots · numerical method comparison (Euler/RK4/RK45) · linear regression/curve fit · root finder (bisection/secant) · complex integration · number theory (primes, GCD) · continued fractions · modular arithmetic clock · probability trees · Bayes theorem · Monte Carlo π · Buffon's needle · Galton board · random number tests

### Computer science / AI / data
surrogate model ✓ · node graph ✓ · notebook ✓ · GPU compute ✓ · cellular automata ✓ · sorting ✓ · gradient descent ✓ · boids ✓ · traffic ✓ · pathfinding (A*/Dijkstra) · maze generation · neural network playground (train a tiny MLP) · k-means clustering · decision boundary/SVM · Turing machine · L-systems (fractal plants) · Huffman coding · hash table viz · binary search tree · recursion/tower of Hanoi · convex hull · Voronoi/Delaunay · perceptron · genetic algorithm · reinforcement learning gridworld · image convolution/filters · FFT of a signal · PID controller tuning

### Chaos, fractals & complex systems
attractors ✓ (Lorenz/Rössler/etc.) · fractals ✓ (Mandelbrot/Julia) · percolation ✓ · DLA ✓ · logistic map · Chua's circuit · Duffing oscillator · Hénon map · standard map · Feigenbaum diagram · Newton fractal · Barnsley fern · Koch snowflake · Sierpinski · forest fire model · sandpile (self-organized criticality) · Schelling segregation · ant colony/stigmergy · slime mold · Wolfram 2D CA · Langton's ant · rule-space explorer

### Astronomy & space
3D N-body ✓ · particle-mesh N-body ✓ · solar system orbits · exoplanet transit (light curve) · Kepler's laws demo · escape velocity calculator · rocket equation (Tsiolkovsky) · orbital rendezvous · gravitational lensing · galaxy collision · CMB/expansion toy · eclipse geometry · tides · Lagrange points

### Earth, climate & environment
pollutant dispersion · groundwater flow · climate energy balance (0-D) · CO₂/greenhouse toy · population/resource (limits to growth) · river meander · earthquake wave propagation · tsunami · glacier flow · wind farm wake · solar panel yield calculator · watershed/rainfall runoff

---

## Audience-driven clusters (who we sell to → what they need)

### 1. National labs & research institutes
CFD, FEA, MD, PDE solvers, surrogate models, N-body, plasma, Monte Carlo, UQ, reproducible/citable runs. **GTM:** `/for/research-labs`, per-lab pages (`/labs/[name]`), "reproducible simulation + DOI" messaging.

### 2. Universities & colleges (built ✓ factory)
Every course/department solver. **GTM:** institution × department pages ✓, course pages ✓, "replace $$$ desktop licenses."

### 3. K-12 / high schools (built ✓ factory)
Curriculum-aligned labs (AP/IB/A-Level ✓). **GTM:** `/schools` ✓, `/curriculum` ✓, teacher classroom kit.

### 4. First responders & public safety ← NEW, untapped
- **Fire:** fire spread model, smoke/plume dispersion, evacuation flow, water-flow/hydraulics for hoses, backdraft/flashover timing, wildfire spread (wind + terrain)
- **Police / traffic:** traffic flow ✓, crash reconstruction (speed from skid marks), stopping-distance calculator, intersection signal timing, crowd flow/evacuation, pursuit dynamics
- **EMS / medical:** drug-dosage calculator, triage flow, cardiac/ECG, blood-flow
- **Hazmat:** gas dispersion plume, spill spread, blast-radius calculator, radiation shielding
- **Search & rescue:** drift/current model, avalanche, flood inundation
**GTM:** `/for/first-responders`, `/for/fire`, `/for/police`, `/for/ems`, `/for/hazmat` — nobody targets this; huge differentiation.

### 5. Private industry & engineering firms
CFD/FEA/thermal, tolerance stack-up, beam/truss calculators, HVAC, pump sizing, control loops, Six-Sigma/DOE, reliability/Weibull. **GTM:** `/for/[industry]` ✓ + tool landing pages.

### 6. Finance & quantitative
Black-Scholes ✓(model) → option pricer, Monte Carlo portfolio, random walk/GBM, interest/compounding, risk (VaR), Markov credit. **GTM:** `/for/quant-finance`.

### 7. Makers / hobbyists / curious public
The "wow" ones — fractals, boids, fluids, chaos. **GTM:** viral embeds, `/guides/hobbyists` ✓.

---

## Go-to-market & SEO layer (built on the solver base)
1. **Audience hubs:** `/for/first-responders`, `/for/research-labs`, `/for/quant-finance`, `/for/fire`, `/for/police`, `/for/ems` — each linking its solver cluster.
2. **Solver × audience pages** (factory): "[Solver] for [audience]" — e.g. "Gas dispersion for hazmat teams."
3. **Named-institution outreach pages:** `/labs/[national-lab]` (LLNL, LANL, Sandia, NIST, CERN, NASA JPL, Fermilab, Oak Ridge, Argonne, Brookhaven…).
4. **"First of its kind" trust page:** `/first` — the manifesto + full simulator index.
5. **Every solver:** embeddable ✓, citable (DOI), shareable ✓ — the growth loops.

---

## Execution
- **Cadence:** batches of 8 (studio + page + registry + sitemap), one verified build each, pushed to GitHub → Vercel auto-deploys.
- **Order:** Physics II → Waves/Optics II → Chemistry → Math II → CS/AI → Complex systems → First responders → Astronomy → Earth/climate → Finance → fill gaps.
- **Milestones:** 100 (≈5 batches), 150, 200, 250, 300.
- **Quality bar:** each solver is *real* (actual numerics/physics), interactive, client-side, embeddable, with honest accuracy disclaimers.

*The intent is pure: put real science in everyone's hands and be, provably, the first and largest of its kind.*
