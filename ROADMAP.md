# PolySim OS — Roadmap: Solvers, App Improvements & SEO

Current state (2026-08): **301 solvers** across ~30 domains · **200 multi-solver workflows** (11 packs) · **~22k use-case pages** · Clerk auth live · Stripe live · auto-deploy fixed.

---

# PART A — Solvers & Multi-Solvers to Add

## A1. New single solvers (by domain)

### Domains we already have but are thin
**Physics / Mechanics**
- Gyroscope & precession · Coupled oscillators · Damped-driven resonance (full) · Gear train ratios · Cam-follower motion · Coriolis effect · Rolling without slipping · Center-of-mass / moment-of-inertia calculator · Elastic vs inelastic collision explorer · Rocket equation (Tsiolkovsky) with staging

**Fluids / Thermo (currently mostly under Aero/Energy)**
- Pipe flow & head loss (Darcy–Weisbach) · Pump curve / system curve · Open-channel flow (Manning) · Heat exchanger (LMTD) · Psychrometric chart · Compressible nozzle flow · Boundary layer · Pitot-tube airspeed · Bernoulli explorer · Fin heat dissipation

**Electrical / Electronics**
- 555 timer · Logic-gate simulator · Karnaugh map minimizer · Transistor bias (BJT/MOSFET) · Filter designer (Butterworth/Chebyshev) · SMPS ripple · Antenna radiation pattern · Transmission-line Smith chart · Battery charge/discharge curves · Motor torque-speed

**Chemistry**
- Titration curve (full polyprotic) · Reaction equilibrium (ICE table) · Nernst equation / galvanic cell · Rate law & Arrhenius · Phase diagram explorer · Ideal vs real gas (van der Waals) · Molarity/dilution calculator · Le Chatelier explorer · Chromatography retention · Radioactive-decay chains

**Biology / Medicine (underserved)**
- Pharmacokinetics (one/two-compartment) · Enzyme kinetics (Michaelis–Menten) · Hardy–Weinberg genetics · Lotka–Volterra (multi-species) · Hodgkin–Huxley (full) · Cardiac action potential · Blood-flow (Windkessel) · Epidemic on a network (beyond SIR) · Genetic drift · Phylogenetic distance

**Finance / Quant**
- Bond duration & convexity · Options greeks surface · Binomial option tree · Efficient frontier (Markowitz) · CAPM/beta · Amortization vs offset mortgage · DCF valuation · Monte-Carlo retirement · Kelly criterion · Credit-default probability

**Statistics / Data**
- Central-limit-theorem demo · Bootstrap resampling · Bayesian A/B (full posterior) · ANOVA · Chi-square test · Power analysis / sample size · Kaplan–Meier survival · Time-series decomposition · Confusion-matrix / ROC explorer · Gradient-descent visualizer

### New domains we should add
**Control Systems** — PID tuner (Ziegler–Nichols), root locus, Bode/Nyquist, state-space simulator, step-response explorer
**Signal / DSP** — FFT spectrogram, digital filter (FIR/IIR) designer, sampling & aliasing, convolution visualizer, wavelet transform
**Machine Learning** — perceptron, k-NN, SVM margin, decision-tree splits, k-means, PCA projection, neural-net playground, gradient boosting, reinforcement-learning gridworld
**Structural / Civil (expand)** — Mohr's circle, influence lines, moment distribution, reinforced-concrete design, footing/settlement, slope stability, truss method-of-joints
**Earth / Geo** — plate-tectonics, seismic-wave travel-time, groundwater Darcy flow, river-meander, carbon-cycle box model, tidal predictor
**Optics (expand)** — thin-lens ray tracer, interference/diffraction (double-slit full), polarization, fiber modes, thin-film color
**Acoustics / Music** — room-mode calculator, equal-temperament tuning, Chladni plate, reverb decay (RT60), Doppler
**Everyday / Consumer** — mortgage vs rent, EV vs gas TCO, solar-panel payback, cooking heat-transfer, tip/split, unit-of-measure everything
**Games / Probability** — poker odds, blackjack strategy, Monty Hall, gambler's ruin, Elo rating, tournament bracket odds

**Target: +~90 single solvers → ~400 total.**

## A2. New multi-solver workflows (chain existing solvers)
1. **Full building design** (loads → beam → column → foundation → seismic → cost)
2. **HVAC system design** (heat load → duct → fan → psychrometrics → energy)
3. **EV powertrain** (motor → battery → thermal → range → charging)
4. **Rocket mission** (thrust → trajectory → staging → reentry → landing)
5. **Drug development** (dose → PK → PD → toxicity → trial power)
6. **Portfolio to retirement** (risk → allocation → Monte-Carlo → drawdown → tax)
7. **Solar farm feasibility** (irradiance → panel → inverter → grid → LCOE → payback)
8. **Water treatment plant** (flow → coagulation → filtration → disinfection → dosing)
9. **Bridge lifecycle** (traffic load → fatigue → deflection → inspection → retrofit)
10. **Epidemic response** (SIR → hospital surge → resource → policy → economic impact)
11. **Chip design flow** (logic → timing → power → thermal → yield)
12. **Wind-turbine siting** (wind → aerodynamics → structural → grid → economics)
13. **Chemical plant** (reaction → separation → heat integration → safety → cost)
14. **Robot pick-and-place** (kinematics → path plan → dynamics → control → cycle time)
15. **Climate scenario** (emissions → carbon cycle → temperature → sea level → impact)

**Target: +~40 multi-solvers → ~240 total.**

---

# PART B — App-Wide Improvements

## B1. Unlock what auth now enables (highest ROI — auth just went live)
- **Saved projects / parameter sets** per account (Clerk user → Supabase or KV store)
- **Account-synced entitlements** (replace device-local; wire the Clerk webhook → store)
- **Purchase history & receipts** on the dashboard (Stripe + Resend email receipts)
- **"My unlocks" library** and re-download of exports
- **Cross-device sync** of favorites/recents

## B2. Solver / Studio UX
- **Preset library** per solver ("textbook example", "real-world case")
- **Shareable state URLs** (encode params in querystring → deep links, huge for SEO + virality)
- **Compare mode** (two parameter sets side-by-side)
- **Step-by-step explainer** panel (the equations + worked numbers)
- **Copy-as** (LaTeX, Python, CSV) from any result
- **Units toggle** (SI/imperial) everywhere
- **Reset / randomize / share** button row standard on every solver
- **Guided tour** on first visit

## B3. Discovery & navigation
- **Global search** (fuzzy across solvers, use-cases, glossary) — currently missing, big gap
- **"Related solvers" + "used in these workflows"** cross-links on every studio page
- **Filter/sort the Studio index** by domain, difficulty, popularity
- **Breadcrumb + category landing pages** for each of the 30 domains

## B4. Performance & technical
- **Sitemap sharding** (`generateSitemaps()` → 50k-URL chunks) — REQUIRED before the site exceeds 50k URLs (we're close)
- **Lazy-load heavy WebGPU solvers** (dynamic import; keep first paint fast)
- **Image/OG generation** per use-case page (dynamic OG images boost CTR)
- **Analytics** (privacy-friendly: Plausible/Umami) + **conversion tracking** on monetization slots
- **Error boundaries + graceful fallbacks** on every embedded solver
- **Lighthouse pass** (CLS from canvas, font loading, etc.)

## B5. Monetization refinement (data-driven)
- **A/B test** slot copy/placement; track impression→click→purchase per slot
- **Free-trial / metered** free runs before the $2 prompt (don't gate too early)
- **Bundle offers** (domain packs at a discount vs à-la-carte)
- **Annual upsell** at the moment of the 2nd unlock
- **Post-purchase**: email receipt + "here's what else you unlocked"

## B6. Trust, polish, compliance
- **Real content on thin pages** (worked examples, references) — Google Helpful-Content safety
- **Testimonials / logos** (once you have users) on home + pricing
- **Status page / uptime**
- **Accessibility** (keyboard nav, ARIA on sliders, contrast) — also SEO signal
- **Cookie/consent** if you add analytics in EU
- **Light-mode** polish (currently dark-first)

## B7. Platform expansion (later)
- **PWA / offline** (installable, solvers cached) — you already have Capacitor scaffolding
- **Desktop app** (Electron/Tauri) with local compute
- **Embed/white-label** productization (the `/embed/[slug]` route → paid API)
- **Public API + SDK** (already have `/developers` marketing — build the real thing)

---

# PART C — SEO Audit

## C1. Page factories we HAVE (live)
| Factory | Route | ~Count |
|---|---|---|
| Solvers | `/studio/[slug]` | 301 |
| Multi-solvers | `/multi/[slug]` | 200 |
| **Use cases** | `/use-cases/[usecase]` | ~15,000 |
| Use case × audience | `/use-cases/[u]/for/[audience]` | ~7,350 |
| Institutions | `/education/[institution]` (+ `/[department]`, `/country/[c]`) | ~1,000 |
| K-12 schools | `/schools/[slug]` | 30 |
| Courses / Curriculum | `/courses/[code]`, `/curriculum/[standard]` | ~80 |
| Domains | `/domains/[domain]` (+ `/[topic]`) | ~100 |
| Materials | `/materials/[m]` (+ `/[property]`) | ~200 |
| Methods | `/methods/[m]` (+ `/[industry]`) | ~500 |
| Models / Equations | `/models/[model]` | ~90 |
| Glossary | `/glossary/[term]` | ~56 |
| Constants | `/constants/[slug]` | ~50 |
| Unit converters | `/convert/[cat]` (+ `/[pair]`) | ~300 |
| Industries | `/for/[industry]` | ~20 |
| Simulate topics | `/simulate/[topic]` (+ `/[industry]`) | ~200 |
| Comparisons / Alternatives | `/compare/[slug]`, `/alternatives/[slug]` | ~200 |
| Migrate-from | `/migrate/[software]` | ~15 |
| Products | `/tools/[slug]` | ~90 |
| Marketplace | `/marketplace/[slug]` | ~40 |
| Blog | `/blog/[slug]` | ~10 |
| Guides | `/guides/[audience]` (+ `/[topic]`) | ~50 |

## C2. Page factories we SHOULD create (prioritized by traffic value)

**Tier 1 — highest intent, build first**
1. **Solver × real application "calculators"** → `/calculators/[topic]` (e.g. "beam deflection calculator") — people search "X calculator" enormously
2. **Formula/equation pages** → `/formulas/[name]` (equation + interactive solver + derivation)
3. **"How to [do X]" tutorials** → `/how-to/[task]` (step-by-step + embedded solver)
4. **Worked-example pages** → `/examples/[topic]` (fully solved problems with numbers)
5. **Solver × grade level** → `/studio/[slug]/[grade]` (AP Physics, GCSE, etc.)

**Tier 2 — institutional (from the earlier plan, US + Europe)**
6. **University × subject** → `/education/[school]/[subject]` (US ~3k + EU ~2.5k unis × ~16 subjects)
7. **National / DOE + EU lab × subject** → `/labs/[lab]/[subject]` (~400 labs)
8. **High school × subject** (dataset-driven — NCES/Eurydice) → `/schools/[school]/[subject]`

**Tier 3 — comparison & competitive**
9. **"X vs Y" tool comparisons** → `/vs/[a]-vs-[b]` (PolySim vs MATLAB, COMSOL, etc., and solver vs solver)
10. **"Best [tool] for [use case]"** → `/best/[category]`
11. **Free-alternative pages** → `/free-alternative-to/[software]`

**Tier 4 — long-tail concept expansion**
12. **Glossary expansion** to ~500 terms
13. **Topic × industry** deepening (existing, expand coverage)
14. **Country/region × subject** education hubs (expand beyond current)
15. **"[Concept] explained" / "[Concept] for beginners"** → `/learn/[concept]`
16. **Career/role pages** → `/for/role/[role]` (what an engineer/quant/teacher uses)

**Technical SEO prerequisites (do alongside)**
- Sitemap **index + sharding** (mandatory past 50k URLs)
- **Internal linking** — every new factory must cross-link into use-cases & solvers
- **Dynamic OG images** per page
- **Schema.org** (SoftwareApplication, FAQ, HowTo, Course) — partially done, extend HowTo/Course
- **Phased rollout** — ship in tiers so indexing ramps naturally (avoid doorway-spam signals)

## C3. Rough page-count trajectory
- Today: **~30k unique pages** live (mostly use-cases)
- + Tier 1 (calculators/formulas/how-to/examples/grade): **~40k**
- + Tier 2 (universities/labs/high schools): **~130k**
- + Tier 3–4 (comparisons/concepts/careers): **~60k**
- **→ 220k+ target reachable**, all with real embedded solvers (not thin pages)
