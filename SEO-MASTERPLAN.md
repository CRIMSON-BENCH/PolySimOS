# PolySim OS — SEO Page Master Plan (Road to 100k+ pages)

## The idea
Every solver is a magnet. Wrap each in **combinatorial page factories** — solver × audience × place × institution — so we own the long tail of every "simulate X" / "X calculator" / "X for [audience]" search. Target: **100,000–200,000 indexed pages**, each anchored to a live simulator.

## The page-count math (factories × data)
With ~300 solvers and the data sets below, the counts compound fast:

| Factory | URL pattern | Formula | Pages |
|---|---|---|---|
| Solvers (built) | `/studio/[slug]` | 300 | 300 |
| Solver × audience | `/solve/[solver]/[audience]` | 300 × 25 | **7,500** |
| Solver × industry | `/solve/[solver]/[industry]` | 300 × 20 | **6,000** |
| "How to simulate X" (built) | `/simulate/[topic]` + ×industry | 300 + 300×20 | **6,300** |
| Guides audience × topic (built) | `/guides/[audience]/[topic]` | 25 × 300 | **7,500** |
| Institution × department (built) | `/education/[inst]/[dept]` | 1,000 × 10 | **10,000** |
| Institution × solver | `/education/[inst]/sim/[solver]` | 1,000 × 30 top | **30,000** |
| **Local: city × solver-category** | `/local/[city]/[category]` | 3,000 cities × 15 | **45,000** |
| Materials × property (built) | `/materials/[mat]/[prop]` | 300 × 7 | **2,100** |
| Unit conversions (built) | `/convert/[cat]/[pair]` | ~600 → expand | **2,000** |
| Glossary / models / methods (built) | — | 500 + 100 + 100 | **700** |
| Courses × curriculum (built) | — | 200 + 50 | **250** |
| Alternatives / compare (built) | — | 60 | **60** |
| Named labs / companies | `/labs/[name]`, `/companies/[name]` | 500 | **500** |
| **Total** | | | **~125,000+** |

Push institution list to 3,000 and cities to 10,000 and it clears **200k**.

## Architecture — how to serve 100k+ without dying
Full static generation (SSG) of 100k+ pages would make Vercel builds take hours and bloat git. So:
1. **Keep small/high-value factories fully static** (solvers, audiences, materials, glossary, courses — the ~20k that convert).
2. **Put the giant factories (city×solver, institution×solver) on ISR** — `dynamicParams = true`, `generateStaticParams` returns only the top few thousand, and the rest render **on-demand and cache** (`export const revalidate = 86400`). Infinite URL space, tiny build.
3. **Sitemaps:** split into multiple sitemap files (Google caps at 50k URLs each) via a sitemap index — `/sitemap/[n].xml`.
4. **Data stays lean:** generate city/institution data from compact seed lists + procedural expansion; never a 100MB file (GitHub limit).

## Audience/GTM hubs (the money pages)
- `/for/first-responders` → `/for/fire`, `/for/police`, `/for/ems`, `/for/hazmat`, `/for/search-rescue`
- `/for/research-labs`, `/for/quant-finance`, `/for/aerospace` (built), `/for/[industry]` (built)
- `/labs/[national-lab]` — LLNL, LANL, Sandia, NIST, NASA JPL, CERN, Fermilab, Oak Ridge, Argonne…
- `/first` — the "first of its kind" manifesto + full simulator index (link magnet)

## Local SEO factory (the 45k lever)
`/local/[city]/[category]` — "Physics simulations in Austin, TX", "CFD tools for Houston engineers". City data: population, state, region. Category = solver cluster. Each links the relevant live solvers + local institutions. This is the single biggest volume lever and the classic programmatic-SEO playbook.

## Execution order (after solvers reach ~150)
1. Solver × audience + solver × industry factories (~13k, static).
2. Audience hubs incl. first responders (~15 pages, high-intent).
3. Local city × category factory (~45k, ISR).
4. Institution × solver (~30k, ISR) + expand institutions to 3,000.
5. Named labs/companies (~500).
6. Split sitemaps into a sitemap index.

## Quality guardrails (avoid thin-content penalties)
- Every generated page must carry: a live/linked solver, unique intro sentence (data-driven), FAQ JSON-LD, and internal cross-links. No empty templates.
- Canonical tags on every page (built). Noindex any page with no solver match.
- Lead with the honest "first of its kind / largest simulation library" positioning.
