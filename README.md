# PolySim OS

**The Everything Engine for simulation.** Connect physics, biology, chemistry, and math in one AI-powered, browser-based workspace. WebGPU-accelerated. Local rendering free forever.

This is the consolidated Next.js 15 application: the entire public site, SEO empire, five real simulation engines, 104 products, Stripe checkout, Gemini AI routes, and Supabase-ready auth — all in one deployable app. (Lovable has been retired.)

## Real simulation engines (`src/lib/engines/`)
- **particles.ts** — N-body / rigid-body physics (symplectic Euler + impulse collisions)
- **fluid.ts** — 2D incompressible CFD (Jos Stam's Stable Fluids)
- **dynamics.ts** — ODE systems (RK4) + Gray–Scott reaction–diffusion PDE
- **cas.ts** — symbolic computer-algebra system (parser, differentiation, simplification)
- **surrogate.ts** — RBF surrogate-model trainer (the PhysicsX/Neural Concept idea, in-browser)

Each has a live interactive UI under `/studio/*`.

## Stack
- Next.js 15 (App Router, SSG) · React 19 · Tailwind CSS 4
- Stripe (checkout + webhooks) · Google Gemini (AI routes, server-side) · Supabase (auth/DB/storage)
- ~2,250+ statically generated SEO pages

## Develop
```bash
npm install
cp .env.example .env.local   # add your keys
npm run dev
```

## Build
```bash
npm run build   # exits 0; generates all static pages
```

## Deploy
See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel setup, environment variables, Stripe webhook configuration, Supabase, and domain pointing.

---
*PolySim OS is a simulation tool, not a certified engineering or scientific advisory service. Results are for research, educational, and informational purposes only.*
