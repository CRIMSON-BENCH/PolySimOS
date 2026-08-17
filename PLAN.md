# PolySim OS — Master Build Plan (for approval)

> Adaptation note: PolySim is a **developer/scientific SaaS**, not a consumer legal/medical app. So the master prompt's "50 states × cities × companies" SEO model maps onto **physics domains × methods × industries × the software-migration long tail**, and the "not legal advice" disclaimer becomes a **simulation-accuracy / no-warranty disclaimer**. Stripe, Gemini, SSG, JSON-LD, and 30k+ pages all stay exactly as specified.

---

## 1. Competitor Scorecard
See `COMPETITIVE-ANALYSIS.md`. Top threat: **SimScale** (browser CAE, free tier, ~1,700 SEO pages, but quote-gated pricing and engineering-only). We beat it on transparent pricing, multi-domain scope, AI copilot, and a 30,000-page SEO empire.

---

## 2. Full Pricing Table — 104 revenue points

All one-time products are Stripe one-time prices; all plans are Stripe recurring. Compute is metered via **Compute Token packs** (prepaid one-time top-ups) on top of plan allotments.

### A. Core Products — Compute Token Packs & per-run credits ($1–$5) — 18
1. Starter Token Pack — $3 · 300 compute tokens
2. Quick-Sim Credit ×5 — $4 · 5 cloud sim runs
3. GPU-Minute Pack (Small) — $5 · 60 cloud GPU-minutes
4. Render Export Credit ×10 — $3 · 10 hi-res image exports
5. Video Export Credit ×3 — $4 · 3 4K sim videos
6. Data Export Pack — $2 · CSV/HDF5 bulk export unlock (per project)
7. Extra API Calls +5k — $3 · one-time API top-up
8. Single Private Project Slot — $2 · one extra private cloud project
9. Long-Run Extension +2h — $5 · extend a cloud job wall-clock
10. High-Res Mesh Credit — $4 · fine-mesh solve unlock
11. Snapshot Pack ×20 — $2 · save 20 sim states
12. AI Copilot Credits ×50 — $4 · 50 extra copilot generations
13. Priority Queue Boost (single job) — $5
14. Dataset Import Credit — $3 · import large external dataset
15. Physics Node Unlock (single premium node) — $3
16. Reproducibility Bundle (single) — $4 · pinned env + seed archive
17. Citation/DOI Mint (single) — $5 · mint a DOI for a project
18. Shareable Interactive Embed (single) — $3 · publish 1 live embed

### B. Premium Products ($5–$15) — 12
19. Multi-Physics Solver Session — $12
20. AI Copilot Pro Session (pro model, 200 gens) — $9
21. Convergence Auto-Tuner run — $8
22. Surrogate "Instant Preview" model build — $14
23. Parameter Sweep (up to 50 runs) — $12
24. Uncertainty Quantification run — $13
25. Batch Render (100 frames) — $10
26. Notebook-to-Sim Converter — $7
27. LaTeX/Report Auto-Generator — $6
28. 3D Model → Mesh Auto-Prep — $11
29. Materials Property Deep Lookup — $5
30. Sim Debugger / Stability Analyzer — $9

### C. Bundles & Kits ($15–$50) — 11
31. Physics Starter Kit — $19
32. Biology Simulation Kit — $19
33. Chemistry Reaction Kit — $19
34. Math/Dynamical Systems Kit — $19
35. CFD Pro Pack — $39
36. FEA/Structural Pro Pack — $39
37. Full Multi-Physics Bundle — $49
38. Educator Classroom Kit (30 seats, 1 term) — $45
39. Research Paper Repro Kit — $29
40. Hackathon/Team Sprint Pack — $35
41. Compute Mega Pack — $50 · 6,000 tokens (best value)

### D. Premium Services ($50–$200) — 8
42. Expert Simulation Review — $99
43. Done-For-You Model Setup — $199
44. Solver Validation & Benchmarking — $149
45. Custom Node Development — $200
46. 1:1 Onboarding & Training (2h) — $120
47. Migration Service (from COMSOL/Ansys/MATLAB) — $175
48. Grant/Publication Figure Package — $85
49. Priority Bug/Model Rescue — $60

### E. Add-Ons ($3–$15) — 10
50. Rush Compute (2× priority) — $8
51. Extended Storage +50GB — $5/one-time month
52. Certified Reproducibility Seal — $12
53. Premium Formatting (figures/exports) — $6
54. Priority Support Pass (30 days) — $10
55. Watermark Removal (exports) — $4
56. Extra Collaborator Seat (one project) — $7
57. Outcome/Accuracy Assurance Review — $15
58. Custom Branding on Embeds — $9
59. Overage Protection (soft-cap buffer) — $5

### F. Reports & Intelligence ($1–$10) — 8
60. Materials Property Report — $6
61. Solver Method Recommendation Report — $4
62. Mesh Quality Audit Report — $7
63. Simulation Cost Estimate Report — $2
64. Benchmark Comparison Report — $9
65. arXiv/PubMed Literature Digest (topic) — $8
66. Convergence Diagnostics Report — $5
67. Compute Usage Analytics Report — $3

### G. Education & Training ($5–$25) — 7
68. Intro to Simulation (video course) — $19
69. CFD Masterclass — $25
70. FEA Masterclass — $25
71. AI Copilot Power-User Workshop — $15
72. Physics Node Graph Fundamentals — $12
73. Reproducible Research with PolySim — $18
74. Live Monthly Office Hours (single) — $9

### H. Consumer Subscriptions ($3–$29/mo) — 6
75. Student — $5/mo · verified .edu, 5 projects, 500 tokens/mo
76. Hobbyist — $9/mo · 10 projects, copilot standard
77. **Independent Researcher — $24/mo** *(existing)*
78. Creator/Educator — $19/mo · classroom sharing, embeds
79. Pro Unlimited — $29/mo · unlimited local, priority copilot
80. Family/Group (5) — $29/mo

### I. Business / B2B Subscriptions ($29–$499/mo) — 6
81. **Lab / Agency — $64/user/mo** *(existing)*
82. Team Starter — $129/mo (up to 5 seats pooled)
83. API/Developer Plan — $99/mo (high API + webhooks)
84. White-Label / Embedded Widget — $299/mo
85. **Institution — $360/mo** *(existing)*
86. **Enterprise — $480/mo** *(existing, "contact us" for on-prem)*

### J. Annual Memberships ($10–$50/yr) — 3
87. Verified Researcher Badge — $19/yr
88. Community Supporter (perks + early nodes) — $29/yr
89. Annual Reproducibility Audit — $49/yr

### K. Affiliate & Referral (free to user, we earn commission) — 8
90. Cloud GPU provider referral (CoreWeave/Lambda etc.)
91. HPC/Rescale burst-compute referral
92. Workstation/hardware affiliate (RTX/Threadripper)
93. Textbook & course affiliate (physics/eng)
94. Journal/preprint submission-service partner
95. CAD software affiliate (Onshape/Fusion)
96. Lab equipment marketplace partner
97. Freelance simulation-expert matching (referral fee)

### L. Marketplace (30% revenue share) — 2
98. Community Model/Template Marketplace (creators sell node graphs)
99. Custom Node/Plugin Marketplace (developers sell nodes)

### M. Advertising & Sponsorship — 3
100. Sponsored listing in Community Library
101. Featured placement for hardware/cloud partners on high-traffic guides
102. Sponsored "Powered by" on validation/benchmark pages
103. Job board (sponsored simulation-engineer listings)
104. Newsletter sponsorship slot

**Total: 104 revenue points** (target ≥75 ✓).

---

## 3. Revenue Projections (illustrative, 2% conversion)
Assumes blended $18 value per converting visitor (mix of $3 token packs, $24–$64 subs amortized, occasional services).

| Monthly visitors | Conversions (2%) | Est. monthly revenue |
|---|---|---|
| 1,000 | 20 | ~$360 |
| 10,000 | 200 | ~$3,600 |
| 100,000 | 2,000 | ~$36,000 |

Subscription compounding (MRR retained month-over-month) and marketplace/affiliate layers push the 100k figure materially higher over 6–12 months; the table above is single-month new-revenue only.

---

## 4. Feature Gap Analysis
**Match:** validation/benchmark gallery, community template library, materials database, meshing + convergence reporting, API/SDK docs.
**Own (competitors lack self-serve):** cross-discipline node graph, AI copilot authoring (arXiv/PubMed), instant WebGPU render, education/consumer tiers, AI surrogate "instant preview," transparent pricing.

## 5. Proposed New Gemini-Powered Features
- **AI Copilot** (plain English → node graph JSON)
- **Solver Recommender** (describe problem → method + settings)
- **Convergence/Stability Analyzer** (paste logs → diagnosis)
- **Notebook → Sim Converter** (Python/MATLAB snippet → graph)
- **Report/LaTeX Generator** (results → publication figure + text)
- **Literature Digest** (topic → arXiv/PubMed summary with citations)
- **Materials Property Lookup** (structured JSON on any material)
- **Cost Estimator** (graph → predicted compute tokens)
- **Sim Chatbot** (docs + methods Q&A)
- **Migration Assistant** (COMSOL/Ansys/MATLAB model → PolySim equivalent)

---

## 6. SEO Page Architecture — DEEP TECHNICAL (city long-tail dropped per your decision)

| Page type | URL pattern | Count | Content |
|---|---|---|---|
| Domain hubs | `/domains/[domain]` | 6 | physics, biology, chemistry, math, engineering, data |
| Domain × topic | `/domains/[domain]/[topic]` | ~320 | fluid-dynamics, thermodynamics, kinetics… |
| Simulation guides | `/simulate/[topic]` | ~320 | "How to simulate X in the browser" |
| Simulate × industry | `/simulate/[topic]/[industry]` | ~2,600 | high-intent combinatorial (valid pairs) |
| Method pages | `/methods/[method]` | ~120 | FEM, FVM, CFD, Monte Carlo, MD… |
| Method × industry | `/methods/[method]/[industry]` | ~2,400 | "CFD for aerospace" |
| Industry verticals | `/for/[industry]` | 20 | aerospace, automotive, biotech, energy… |
| Materials database | `/materials/[material]` | ~2,000 | real material families + properties, DefinedTerm |
| Materials × property | `/materials/[material]/[property]` | ~4,000 | "thermal conductivity of X" high-intent |
| Equations/models | `/models/[equation]` | ~450 | Navier-Stokes, Schrödinger, Lotka-Volterra… |
| Glossary | `/glossary/[term]` | ~350 | thorough sim/physics definitions |
| Tool/product pages | `/tools/[slug]` | 104 | one per revenue point |
| Comparison pages | `/compare/[competitor]` | 10 | vs SimScale, Ansys, COMSOL, MATLAB… |
| Migration pages | `/migrate/[software]` | 12 | "Switch from COMSOL to PolySim" |
| Blog articles | `/blog/[slug]` | 45 | 5+ categories, 4–7 sections each |
| Templates/examples | `/templates/[slug]` | 40 | forkable example projects |
| Education/courses | `/education/[course]` | ~200 | course-aligned landing pages |

**Estimated total: ~12,900–13,000 high-intent pages** (deep-technical mode). Materials are a curated set of genuinely-known material families with realistic property ranges — not fabricated to inflate counts; the accuracy disclaimer applies. City long-tail dropped.

Every page ships: `generateStaticParams`, unique `generateMetadata` (title/desc/OG), JSON-LD (right schema), breadcrumb, 4–6 contextual product cards + 1 amber premium CTA, internal cross-links, simulation-accuracy disclaimer, dark mode, responsive.

---

## 7. File List (Next.js — this repo)
**Data layer** `src/lib/`: `domains.ts`, `topics.ts`, `methods.ts`, `industries.ts`, `materials.ts`, `models.ts` (equations), `glossary.ts`, `blog.ts`, `templates.ts`, `comparisons.ts`, `products.ts` (all 104), `cities.ts`, `education.ts`, `disclaimer.ts`, `seo.ts` helpers. Each with TS interfaces + `getBySlug`/`getAllSlugs`/`getByCategory` helpers.
**Components** `src/components/`: `Navbar.tsx` (mega-dropdown), `Footer.tsx`, `ProductCard.tsx`, `PremiumCTA.tsx`, `Breadcrumbs.tsx`, `JsonLd.tsx`, `Disclaimer.tsx`, `CrossLinks.tsx`, `PricingTable.tsx`.
**Pages** `src/app/`: all route folders from the table above, plus `page.tsx` (home), `pricing/`, `about/`, `for-business/`, `sitemap.ts`, `robots.ts`, `layout.tsx`.
**Config:** `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `tailwind`.

## 8. Proposed Nav (mega-dropdown)
- **Product:** Node Graph, Live Render, AI Copilot, Data Inspector, Hybrid Compute
- **Solutions:** by Domain (Physics/Bio/Chem/Math/Engineering), by Industry (aerospace, automotive, biotech, energy…)
- **Resources:** Simulate guides, Methods, Materials, Models/Equations, Glossary, Blog, Templates
- **Compare:** vs SimScale / Ansys / COMSOL / MATLAB / Wolfram; Migrate from…
- **Developers:** API, SDK, Webhooks, Docs
- **Pricing** · **Community**

## 9. Proposed Footer (6 columns)
Product · Solutions · Resources · Developers · Company (About, Business, Careers, Contact) · Legal (Terms, Privacy, Refund, Acceptable Use) — plus simulation-accuracy disclaimer line.

## 10. Gemini AI Integration Plan (API routes, all server-side)
| Route | Model | Does | Returns |
|---|---|---|---|
| `/api/copilot` | pro | English → node graph | JSON graph |
| `/api/solver-recommend` | flash | problem → method/settings | JSON |
| `/api/analyze-convergence` | flash | logs → diagnosis | JSON |
| `/api/convert-notebook` | pro | code → graph | JSON |
| `/api/generate-report` | pro | results → LaTeX/figures | JSON/text |
| `/api/literature-digest` | pro | topic → arXiv/PubMed summary | JSON |
| `/api/materials-lookup` | flash | material → properties | JSON |
| `/api/estimate-cost` | flash | graph → token estimate | JSON |
| `/api/chatbot` | flash | docs Q&A | text |
| `/api/migrate` | pro | COMSOL/Ansys/MATLAB → PolySim | JSON |

All use `@google/generative-ai`, `GEMINI_API_KEY` server-only, `responseMimeType: application/json` where structured.

## 11. Upsell / Cross-sell Map
- Domain/topic/simulate pages → relevant **Kit** (B/C) + **Compute Token pack** (A) + **Pro Unlimited** sub.
- Method pages → **Solver session** + **matching Masterclass** + **Migration service**.
- Materials pages → **Materials Report** + **Copilot credits**.
- Compare pages → **Migration Service** + annual **Pro** (price-anchored vs competitor).
- Tool pages → 2 related tools + 1 bundle that contains them + relevant subscription.
- Blog → contextual tool + **Compute Mega Pack** + newsletter/affiliate.

## 12. Legal / Disclaimer (every page, output, email)
> "PolySim OS is a simulation and modeling tool, not a certified engineering, scientific, or professional-advisory service. Simulation results are for research, educational, and informational purposes only and are not a substitute for physical testing, professional engineering judgment, or regulatory certification. No warranty is made as to accuracy or fitness for any purpose."

---

## Build sequence once approved
Data files → components → templates → 104 tool pages → core pages (home/pricing/nav/footer/sitemap) → `npm run build` to exit 0 → report page count → git commit/push → `LOVABLE-FINAL-PROMPT.md` (12 parts) → live audit → fixes → iOS (Capacitor, icon, screenshots, Xcode) → App Store walkthrough.

**Awaiting your "go" before building anything.**
