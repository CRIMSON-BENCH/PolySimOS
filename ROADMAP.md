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

---

# PART D — Integrations & Interop (be the interface layer, not the compute host)

**Guiding principle:** PolySim's edge is the interactive front-end + solver library, not raw compute. Integrate by *exporting to* and *being called by* real tools — and only host others' compute at the enterprise tier (BYOC, where they pay). Keeps hosting near-zero.

## D1. Free in-browser math libraries to pull in (all client-side = $0 hosting)
- **Pyodide** — Python + NumPy/SciPy/SymPy/pandas in WebAssembly, lazy-loaded. The big one: real scientific Python in-browser, makes PolySim a genuine compute environment.
- **math.js** — expression eval, units, matrices → powers a universal "type any calculation" box.
- **Nerdamer / Algebrite** — lightweight JS symbolic algebra (differentiate/integrate/solve) when full SymPy is overkill.
- **MathLive** — WYSIWYG equation input field (type math naturally) — the "easier for people used to such tools" piece.
- **KaTeX** — render LaTeX everywhere so it reads like real math.
- **WebR** — R in the browser for the stats crowd.
- Free *data* APIs (factual, not compute): CODATA constants, USGS earthquakes, NOAA, NASA, arXiv/PubMed (already wired).

## D2. Computational notebooks "as a set"
Turn the existing Notebook into a **curated library of ready-to-run notebooks** — prose + live LaTeX + editable Python cell (Pyodide) + embedded solver, one per topic. A "set" per domain = textbook-style chapters. Each notebook is **also an SEO page and a monetizable unit**. Highest-leverage feature for power users.

## D3. Bring-your-own-compute & Qiskit (phased)
| Phase | Pattern | Effort | Notes |
|---|---|---|---|
| 1. **Export to code** | Every solver → runnable **Qiskit / Python / MATLAB** snippet; run Python in-browser (Pyodide) | Low | Instant interop, no infra |
| 2. **They connect to us** | Real **PolySim API + SDK + MCP server** so Jupyter/VS Code/AI agents call our solvers | Medium | Lowest infra burden; API revenue tier (`/developers` already marketed) |
| 3. **We connect to them (BYOC)** | "Connect your compute": user supplies an endpoint — **IBM Quantum token**, Jupyter kernel gateway, their cloud GPU — PolySim dispatches heavy/quantum jobs there | High | Enterprise; **they** pay for compute |

**Qiskit concretely:** a visual **Quantum Circuit Studio** that (a) simulates small circuits locally, (b) exports Qiskit code, (c) optionally submits to IBM Quantum with the user's own token (BYOC). Builds on existing quantum solvers.

**Build order:** Phase 1 first (Pyodide compute cell + export-to-code) — biggest "feels like a real tool" jump for the least infra, and it unlocks D2.

---

# PART E — Competing with MATLAB (be the free, browser-native alternative)

**Reality check:** MATLAB itself is proprietary/paid — there is no fully-free MATLAB API to embed. So we don't "integrate MATLAB," we **become the free browser-native MATLAB alternative** using open tools, and interop via files + code export. MATLAB's moat is (a) the language + workspace, (b) plotting, (c) toolboxes, (d) Simulink. We already have a node-graph editor (= Simulink), 373 solvers (= toolboxes pre-built), a CAS, and a notebook. We close the rest with Octave/Pyodide.

## E1. Core numerical environment (the MATLAB heart)
1. In-browser **compute console / REPL** (Pyodide: NumPy/SciPy/SymPy)
2. **GNU Octave (WASM)** console — ~95% MATLAB-syntax compatible, runs `.m` code free in the browser
3. **Workspace / variable inspector** (MATLAB-style)
4. **Matrix / array editor** (spreadsheet-like)
5. **Live scripts / notebooks** (prose + code + output) — enhance existing Notebook
6. Command **history + recall**
7. Built-in **function-library browser** with docs
8. Unit-aware calculations (math.js units)
9. **LaTeX rendering (KaTeX)** + **MathLive** equation input
10. Vectorized-array operations helper UI

## E2. Plotting & visualization (MATLAB figures)
11. 2D plots: plot / scatter / bar / hist / stem
12. **3D surface & mesh** plots (WebGPU viewport we already have)
13. Interactive zoom / pan / **data cursor**
14. **Subplots / tiled layouts**
15. Colormaps, colorbars, legends, annotations
16. **Publication export** (SVG / PDF / PNG)
17. **Animation / movie** export
18. Quiver / streamlines / vector fields (have viz)

## E3. Toolbox equivalents (map our 373 solvers into "toolboxes")
19. **Control Systems** toolbox → PID, root locus, Bode, state-space (built)
20. **Signal Processing** → FIR/IIR, DFT, windows, filters (built)
21. **Optimization** → LP, routing, knapsack, etc. (built)
22. **Statistics & ML** → regression, clustering, SVM, trees (built)
23. **Symbolic Math** → our CAS (built)
24. **PDE** → heat/wave/FEA field solvers (built)
25. **Curve fitting** toolbox (new)
26. **Image processing** basics (new)
27. **Deep learning** → neural-net playground (expand perceptron)
28. Package each domain as a browser "toolbox" workspace

## E4. Simulink-style modeling (our flagship node graph, expanded)
29. Rich **block library** (transfer function, state-space, integrator, gain, sum, sat)
30. **Continuous + discrete solvers** (RK45/ODE on the graph)
31. **Scope blocks** (live plots inside the model)
32. **Subsystems / hierarchy** + signal mux/demux
33. Save / load / **share models** (have share links)
34. **Code generation** from a model → Python / C

## E5. Interop & migration (win MATLAB users over)
35. **`.m` and `.mat` file import/export** (data + scripts)
36. **Export any solver** as runnable `.m` / `.py` / Julia
37. **MATLAB → Python cheat-sheet** + auto-translate common snippets
38. **CSV / Excel / HDF5 / NetCDF** data import
39. **REST API + SDK + MCP** so MATLAB/Python/agents call our solvers
40. **BYOC**: connect your own MATLAB (MATLAB Engine) at enterprise tier
41. "**App**" packaging — turn a solver into a shareable mini-app (like App Designer)
42. One-click **"open in Octave console"** from any solver

## E6. Where PolySim already WINS over MATLAB (lead with these)
43. **$0**, runs in browser — MATLAB needs a paid license + install
44. **373 ready-made interactive solvers** — MATLAB is a blank canvas
45. **22k use-case pages + SEO** discovery — MATLAB has none
46. **Instant shareable links + embeds** — MATLAB Online is clunky
47. **AI copilot**: describe a system → get a running model
48. **Mobile-friendly**; **no install, no license servers**
49. **Micro-priced** ($2 unlocks) vs MATLAB's $$$ toolbox bundles
50. **Free forever locally** — the whole compute layer costs us near-zero

**Build order:** the single highest-leverage move is E1 #1–2 (Pyodide + Octave console) — that alone reframes PolySim from "a set of calculators" to "a free MATLAB in your browser." Then E4 (Simulink on the node graph we already own), then E5 interop.

---

# PART F — UI/UX & Product Polish (Tableau-inspired: curated, not dumps)

**Core problem the user identified:** the site has grown to show too many raw options everywhere ("total dump"). Fix = **curation, search, and dashboard-style UI** (Tableau vibes: clean, dropdown-driven, guided, elegant).

## F1. Kill the dumps
- **`/studio` index** → add a prominent **search / type-ahead** over all 373 solvers + a "**What do you want to calculate?**" guided finder (modal) that routes to solvers/use-cases from a plain-English answer. Domain **filter chips / dropdowns** instead of one long wall.
- **`/pricing`** → streamline to **4 clear tiers** (Free · Pro · Team · Enterprise) with a monthly/annual toggle; drop the confusing Family/Hobbyist/Independent/Creator sprawl (fold into Pro). One comparison table, not many boxes.
- **Solver-page bottom** → replace the "More live simulations" dump with **same-domain** related solvers (compact, relevant), and remove the big product-grid clutter.

## F2. Tableau-style UI system
- Consistent **top bar with dropdown menus** (Product / Solutions / Resources), cleaner nav.
- **Dashboard feel**: cards, filters, dropdowns, whitespace, restrained color — less "wall of buttons."
- A guided **"finder" pattern** reused across studio, home, and dashboard.
- Optional **30s-idle prompt** on the home page: "Tell me what you want to do →" routes to the finder.

## F3. Solver page cleanup (global — one shared-component pass)
- **Modernize the embed** (`StudioChrome`): remove the macOS traffic-light dots / "old screen" look → clean header with a live indicator.
- **Remove ALL fake reviews / star ratings** site-wide (products, tools, marketplace, schema.org) — "a math site; real people don't trust fake 4.7s."
- **Pro users never get nagged**: gate PremiumCTA + all upsells behind `!hasPlan` (contextual $2 unlock still fine for non-Pro).
- **Expand "How it works"** into a real explainer: equations, algorithm, assumptions, references per solver (content fill = the retroactive-polish pass across all 373).

**Priority:** F3 (shared-component fixes hit all 373 pages at once) → F1 pricing + studio finder → F2 system polish. This is the "retroactive polish" pass.

---

# PART G — Solver Engine v2 + Polish: execution order (LIVE PLAN)

The "make them look pro / take the solvers up a notch" program. Built a reusable kit so most of this is now cheap per solver:
- `src/lib/studioKit.ts` — `hidpi()` (retina canvas), `PALETTE` (color-blind-safe series), `useShareableNumbers()` (URL-mirrored params), `copyCurrentLink`/`copyText`.
- `src/components/studio/SolverExtras.tsx` — `Presets`, `ExplainResult`, `ShareBar` (copy-link + copy-as-code).
- `src/components/studio/ProjectileStudio.tsx` — the reference/template for the per-solver "depth" pass.

## ✅ Already shipped
- Pricing → 4 tiers (`PricingTiers.tsx`), monthly/annual toggle.
- `StudioChrome` modernized (no traffic-light dots; live indicator); fake reviews removed site-wide; Pro no-nag; same-domain related solvers; static "How it works" dropdowns.
- **Universal (all solvers):** type-in numeric sliders, keyboard/ARIA, Export-PNG.
- **Retina** migrated across 264 solvers (`scratchpad/retinafy.mjs`).
- **Depth** (presets + explain-this-result + copy-as-Python + shareable URLs) on 33 flagships (4 subagent batches of 8).

## ✅ Also done (this session, continued)
- **G1. Universal retina** — ~52 more solvers migrated via the retina-finish fan-out; **316 solvers** now use `hidpi()`. The rest are `putImageData` pixel-buffer sims (fractals, cellular grids, fluid density fields) where retina doesn't apply without rewriting their render loop — correctly left alone.
- **G2. Killed the last dumps** — `StudioBrowser` (search + curated domain chips + "What do you want to calculate?" modal that keyword-routes plain English → solver) replaced the /studio wall; `IdleFinderPrompt` fires a gentle finder prompt after 30s idle on the home page (deep-links `/studio?find=1`).
- **G3. Transport controls** — shared `useTransport` hook + `TransportBar` (play/pause/**step**/reset/**speed**); DoublePendulum converted as the reference. (Rollout to other animated solvers still per-solver.)
- **G4. Depth — COMPLETE across ALL solvers.** Presets + explain-this-result + copy-as-Python + shareable URLs on every solver (364/365; EmbeddedStudio is a routing wrapper). Done via 14 parallel-subagent batches (A–N), each build-gated + committed.

## ✅ G3b — DONE. Transport on EVERY animated solver.
`useTransport`/`TransportBar` (play/pause/step/reset/speed) rolled out to **67 solvers** across batches T1–T3 (build-gated + live-verified on Particle). Zero animated solvers remain without it. DoublePendulum was the reference; the recipe moved each rAF loop body into `frame(steps)` with params mirrored into refs, preserving physics/draw byte-identical.

## ⏳ Remaining — in logical order
- **G5. Live KaTeX equations (#11)** — governing equation with current values substituted, in the inspector; per-solver, top solvers first (adds `katex`).
- **G6. Direct-canvas manipulation (#6)** — drag the pendulum bob / place a charge / move a load / drag graph nodes; highest-wow, per-solver on flagships.
- **G7. Save named scenarios to account (#15)** — persist `useShareableNumbers` param sets to the logged-in user (Clerk + entitlements store); retention + sign-up reason.
- **G8. Tableau-style nav + dashboard polish (F2)** — top-bar dropdown menus, card/filter system, restrained color.

**Order rationale:** finish the two remaining *global* wins first (G1 retina, G2 finder) so every page benefits, then the shared *instrument* upgrade (G3 transport), then grind *per-solver depth* (G4), then the advanced per-solver features (G5–G7), then system-wide visual polish (G8).
