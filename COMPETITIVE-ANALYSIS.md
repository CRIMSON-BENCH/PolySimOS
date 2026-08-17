# PolySim OS — Competitive Analysis

**Product:** PolySim OS ("The Everything Engine for simulation") — a browser-based, WebGPU + WebAssembly simulation workspace that connects physics, biology, chemistry, and math in one AI-copiloted node graph. Local rendering free forever; cloud scale metered via Compute Tokens.

**Current live pricing (polysimos.com):**
| Plan | Price | Highlights |
|---|---|---|
| Independent Researcher | $24/mo | 25 private cloud projects, 10k API calls, $10 Compute Tokens, publication rights |
| Lab / Agency | $64/user/mo | Unlimited projects, multiplayer, unlimited API, webhooks, $40/user tokens |
| Institution | $360/mo | SSO/SAML, up to 500 seats, priority queue, admin analytics |
| Enterprise | $480/mo | On-prem/air-gapped, dedicated clusters, custom SLAs |

**Live status:** Site runs on Lovable (`polymath-sim.lovable.app`), only 7 pages indexed (home, capabilities, how-it-works, use-cases, developers, community, pricing). Essentially zero SEO surface today. Sitemap still points at the raw Lovable subdomain, not the custom domain — an indexing bug to fix.

---

## Competitor Scorecard (ranked by threat level)

| # | Competitor | Pricing | Indexed pages* | Monetization | Key weakness we exploit |
|---|---|---|---|---|---|
| 1 | **SimScale** | Community free (10 sims, 3k core-hrs); Mechanical/Professional/Enterprise = quote-only | ~1,700+ (886 pages, 550 posts, 172 KB) | Seat + core-hour subscription, quote-gated | Opaque quote-only pricing; CAE/engineering only (no bio/chem/math); no AI copilot depth |
| 2 | **Ansys (Discovery/Cloud)** | Quote-only; Discovery est. ~$2k–$20k+/yr; enterprise 6-figure | 5,500+ | Perpetual + subscription + HPC burst | Desktop-first, heavyweight, expensive, steep learning curve; not browser-native |
| 3 | **COMSOL Multiphysics** | Base ~$3,495/yr commercial, ~$1,495 academic; modules $600–$4,500 each | 4,000+ (models, papers) | Base license + per-module + maintenance | Per-module pricing explodes cost; desktop install; no real-time browser render |
| 4 | **MATLAB / Simulink** | Student Suite $119/yr; Home ~$149; commercial per-toolbox thousands | 10,000+ | Per-toolbox subscription | Not simulation-first; programming barrier; toolbox sprawl; no visual node physics |
| 5 | **Wolfram (Mathematica/One)** | Perpetual ~$3,445; annual sub; student discounted | 5,600+ | License + cloud credits | Symbolic-first, niche syntax; not real-time 3D/physics render |
| 6 | **Luminary Cloud** | Consumption-based, no per-seat; quote | Small marketing site | Usage-based cloud CAE + Lumi AI copilot | Aerospace/CFD niche; enterprise-only feel; no consumer/education tier |
| 7 | **Flexcompute (Flow360 / Tidy3D)** | Pay-per-sim FlexCredits; 2-week free CFD trial | Docs-heavy | Credit-per-simulation | Narrow (CFD + photonics); credits only; no multi-domain workspace |
| 8 | **PhysicsX / Emmi (Mistral) / Neural Concept** | Enterprise contracts (PhysicsX $300M Series C, $2.4B val) | Marketing only | AI surrogate models, enterprise | No self-serve product, no browser tool, no long-tail SEO — pure enterprise |
| 9 | **Rescale (ScaleX)** | Consumption HPC, 1–3yr commit discounts; quote | Moderate | Cloud HPC brokerage (650+ apps) | Infra layer, not an authoring tool; no node graph or AI copilot |
| 10 | **PhET / GeoGebra / Desmos** | Free (grants/donations) | 1,000s (huge edu traffic) | Nonprofit / freemium edu | Toy-grade sims, no cloud compute, no monetization, no pro/research path |

\*Page counts from live sitemap.xml crawls (Aug 2026) except quote-only marketing sites.

---

## The #1 target to destroy: **SimScale**

SimScale is the closest analog — genuinely browser-based CAE with a free community tier and a real SEO footprint (~1,700 pages driving developer/engineer search traffic). We beat it on four axes:

1. **Transparent, self-serve pricing.** SimScale hides everything behind "request a quote" above the free tier. PolySim publishes flat $24/$64 tiers — the single biggest conversion lever against them.
2. **Multi-domain, not just engineering CFD/FEA.** PolySim spans physics + biology + chemistry + math in one node graph. SimScale is mechanical/thermal/fluid only.
3. **AI copilot as a first-class citizen** (fine-tuned on arXiv/PubMed, plain-English → nodes). SimScale has no comparable generative authoring.
4. **Local-first WebGPU render, free forever.** Zero core-hour anxiety for the entry user; cloud only "when reality gets heavy."

**Where SimScale still beats us today:** validated solver credibility, verified benchmark library, 500k-engineer community, and 1,700 indexed pages of SEO. The plan closes all four — especially the SEO gap, where we go from 7 pages to 30,000+.

---

## Feature Gap Analysis

**They have, we must match:**
- Validated/verified solver benchmark library (build a public "Validation Gallery")
- Public simulation template/example library (build "Community Library" of forkable projects)
- Materials database (physical properties lookup)
- Meshing controls & convergence reporting
- Integration/API + webhooks (we have API calls; expose docs + SDK pages)

**They lack, we should own:**
- **True multi-physics-across-disciplines** graph (fluid node → particle → reaction → math) in one canvas
- **AI copilot authoring** (plain English → runnable node graph) with arXiv/PubMed grounding
- **Instant browser render** with no install and no core-hour meter on local
- **Consumer + education + research tiers** — an entire market (students, indie researchers, educators) that Ansys/COMSOL/Luminary ignore
- **AI surrogate/"instant preview" mode** — bring PhysicsX-style speed to a self-serve product (nobody offers this self-serve)

---

## Monetization models observed
- Seat + core-hour subscription (SimScale)
- Perpetual license + per-module + maintenance (COMSOL, Wolfram)
- Per-toolbox subscription (MATLAB)
- Consumption/usage-based cloud compute (Luminary, Rescale, Flexcompute FlexCredits)
- Enterprise contracts / AI surrogate services (PhysicsX, Emmi, Neural Concept)
- Nonprofit freemium (PhET, GeoGebra)

**PolySim's edge:** combine the *self-serve subscription* of SimScale, the *metered compute* of Luminary/Flexcompute, and a *marketplace + education layer* nobody in the pro CAE space touches — then blanket the long tail with SEO none of them (except MATLAB/Wolfram) invest in for self-serve discovery.

Sources: SimScale, Ansys, COMSOL, MathWorks, Wolfram, Luminary Cloud, Flexcompute, Rescale, PhysicsX, PhET pricing pages and sitemaps (crawled Aug 2026).
