import { slugify } from "./seo";

export type Billing = "one-time" | "subscription";
export type ProductCategory =
  | "core"
  | "premium"
  | "bundle"
  | "service"
  | "addon"
  | "report"
  | "education"
  | "consumer-sub"
  | "business-sub"
  | "membership"
  | "affiliate"
  | "marketplace"
  | "advertising";

export interface Product {
  slug: string;
  name: string;
  price: number; // USD; 0 for affiliate/free-to-user
  billing: Billing;
  interval?: "month" | "year";
  category: ProductCategory;
  categoryLabel: string;
  blurb: string;
  includes: string[];
  stripeType: "payment" | "subscription" | "none";
  competitorNote?: string;
  rating: number;
  reviewCount: number;
}

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  core: "Compute & Credits",
  premium: "Premium Tools",
  bundle: "Bundles & Kits",
  service: "Expert Services",
  addon: "Add-Ons",
  report: "Reports & Intelligence",
  education: "Courses & Training",
  "consumer-sub": "Consumer Plans",
  "business-sub": "Business & B2B Plans",
  membership: "Annual Memberships",
  affiliate: "Partner Programs",
  marketplace: "Marketplace",
  advertising: "Advertising & Sponsorship",
};

type Seed = [
  name: string,
  price: number,
  billing: Billing,
  category: ProductCategory,
  blurb: string,
  includes: string[],
  interval?: "month" | "year",
  competitorNote?: string,
];

// Deterministic pseudo-rating so pages are stable across builds (no Math.random).
function ratingFor(slug: string): { rating: number; reviewCount: number } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const rating = 4.6 + (h % 4) / 10; // 4.6–4.9
  const reviewCount = 40 + (h % 460); // 40–499
  return { rating: Math.round(rating * 10) / 10, reviewCount };
}

const SEEDS: Seed[] = [
  // A. Core — Compute Token Packs & per-run credits ($1–$5)
  ["Starter Token Pack", 3, "one-time", "core", "300 Compute Tokens to run your first cloud simulations without a subscription.", ["300 Compute Tokens", "Never expires while account is active", "Works on any solver"]],
  ["Quick-Sim Credit ×5", 4, "one-time", "core", "Five cloud simulation runs for quick iteration on the go.", ["5 cloud sim runs", "Small/medium job sizes", "Rollover unused runs"]],
  ["GPU-Minute Pack (Small)", 5, "one-time", "core", "60 cloud GPU-minutes for compute-heavy renders and solves.", ["60 GPU-minutes", "WebGPU-class cloud GPUs", "Live usage meter"]],
  ["Render Export Credit ×10", 3, "one-time", "core", "Export ten high-resolution simulation renders at publication quality.", ["10 hi-res PNG/SVG exports", "Up to 4K resolution", "No watermark"]],
  ["Video Export Credit ×3", 4, "one-time", "core", "Render three 4K simulation videos of your time-domain results.", ["3 × 4K MP4 exports", "Custom frame rate", "Camera keyframing"]],
  ["Data Export Pack", 2, "one-time", "core", "Unlock bulk CSV/HDF5 export for a project's full result set.", ["CSV + HDF5 export", "Per-project unlock", "Field & time-series data"]],
  ["Extra API Calls +5k", 3, "one-time", "core", "Top up 5,000 additional API calls without upgrading your plan.", ["+5,000 API calls", "One-time top-up", "Applies instantly"]],
  ["Single Private Project Slot", 2, "one-time", "core", "Add one extra private cloud project beyond your plan limit.", ["+1 private project", "Full version history", "Private by default"]],
  ["Long-Run Extension +2h", 5, "one-time", "core", "Extend a single cloud job's wall-clock limit by two hours.", ["+2h wall-clock", "For long transient solves", "Auto-checkpointing"]],
  ["High-Res Mesh Credit", 4, "one-time", "core", "Unlock a fine-mesh solve for higher spatial accuracy on one run.", ["Fine-mesh solve", "Adaptive refinement", "Convergence report"]],
  ["Snapshot Pack ×20", 2, "one-time", "core", "Save twenty simulation states you can branch and restore.", ["20 saved snapshots", "Branch from any state", "One-click restore"]],
  ["AI Copilot Credits ×50", 4, "one-time", "core", "Fifty extra AI Copilot generations for node-graph authoring.", ["50 copilot generations", "Flash model", "Plain-English to nodes"]],
  ["Priority Queue Boost", 5, "one-time", "core", "Jump the cloud queue for a single high-priority job.", ["2× queue priority", "Single job", "Guaranteed launch < 5 min"]],
  ["Dataset Import Credit", 3, "one-time", "core", "Import one large external dataset for data-driven simulation.", ["Up to 5GB import", "CSV/HDF5/NetCDF", "Auto schema mapping"]],
  ["Physics Node Unlock", 3, "one-time", "core", "Unlock a single premium physics node for your project library.", ["1 premium node", "Yours permanently", "Docs + example"]],
  ["Reproducibility Bundle", 4, "one-time", "core", "Pin environment + random seed and archive a reproducible run.", ["Pinned solver version", "Seed archive", "One-click re-run"]],
  ["Citation / DOI Mint", 5, "one-time", "core", "Mint a citable DOI for a published simulation project.", ["Registered DOI", "Citation metadata", "Public landing page"]],
  ["Shareable Interactive Embed", 3, "one-time", "core", "Publish one live, interactive embed of a simulation to any site.", ["1 live embed", "Interactive controls", "Responsive iframe"]],

  // B. Premium ($5–$15)
  ["Multi-Physics Solver Session", 12, "one-time", "premium", "A coupled multi-physics solve linking fluid, thermal, and structural nodes.", ["Coupled solve", "Up to 3 physics", "Priority compute"]],
  ["AI Copilot Pro Session", 9, "one-time", "premium", "200 generations on the Pro model for complex graph authoring.", ["200 Pro generations", "arXiv/PubMed grounding", "Explains each node"]],
  ["Convergence Auto-Tuner", 8, "one-time", "premium", "Automatically tune solver settings until your run converges.", ["Auto step/relaxation tuning", "Convergence report", "Saves settings"]],
  ["Surrogate Instant Preview", 14, "one-time", "premium", "Build an AI surrogate model for near-instant parameter previews.", ["Trained surrogate", "Millisecond previews", "Accuracy report"], undefined, "PhysicsX offers this only via enterprise contracts."],
  ["Parameter Sweep (50 runs)", 12, "one-time", "premium", "Run up to fifty parameter variations and compare results.", ["Up to 50 runs", "Design-of-experiments grid", "Comparison dashboard"]],
  ["Uncertainty Quantification Run", 13, "one-time", "premium", "Quantify how input uncertainty propagates to your results.", ["Monte Carlo UQ", "Sensitivity ranking", "Confidence bands"]],
  ["Batch Render (100 frames)", 10, "one-time", "premium", "Render a hundred frames of your simulation in one batch job.", ["100 frames", "Parallel rendering", "Assembled video"]],
  ["Notebook-to-Sim Converter", 7, "one-time", "premium", "Convert a Python/MATLAB snippet into a runnable node graph.", ["Code to node graph", "Python & MATLAB", "Editable output"]],
  ["LaTeX / Report Auto-Generator", 6, "one-time", "premium", "Turn your results into a formatted LaTeX report with figures.", ["LaTeX + PDF", "Auto figures & tables", "Citation-ready"]],
  ["3D Model → Mesh Auto-Prep", 11, "one-time", "premium", "Import a CAD/3D model and auto-generate a simulation-ready mesh.", ["STEP/STL/OBJ import", "Auto meshing", "Quality audit"]],
  ["Materials Property Deep Lookup", 5, "one-time", "premium", "Detailed, sourced property sheet for any material in your model.", ["Full property sheet", "Temperature dependence", "Source references"]],
  ["Sim Debugger / Stability Analyzer", 9, "one-time", "premium", "Diagnose why a simulation blew up or failed to converge.", ["Instability diagnosis", "Log analysis", "Fix suggestions"]],

  // C. Bundles ($15–$50)
  ["Physics Starter Kit", 19, "one-time", "bundle", "Everything you need to start simulating classical & modern physics.", ["Core physics nodes", "10 templates", "500 tokens"]],
  ["Biology Simulation Kit", 19, "one-time", "bundle", "Population dynamics, reaction networks, and cellular models.", ["Bio node pack", "10 templates", "500 tokens"]],
  ["Chemistry Reaction Kit", 19, "one-time", "bundle", "Reaction kinetics, equilibrium, and transport simulations.", ["Chem node pack", "10 templates", "500 tokens"]],
  ["Math / Dynamical Systems Kit", 19, "one-time", "bundle", "ODEs, PDEs, chaos, and dynamical-systems exploration.", ["Math node pack", "10 templates", "500 tokens"]],
  ["CFD Pro Pack", 39, "one-time", "bundle", "A professional computational-fluid-dynamics toolset and templates.", ["Turbulence models", "Meshing tools", "2,000 tokens"], undefined, "SimScale gates comparable CFD behind quote-only tiers."],
  ["FEA / Structural Pro Pack", 39, "one-time", "bundle", "Structural, thermal, and modal finite-element analysis toolset.", ["Nonlinear FEA", "Contact & modal", "2,000 tokens"]],
  ["Full Multi-Physics Bundle", 49, "one-time", "bundle", "Every domain node pack plus a large compute allotment.", ["All node packs", "40+ templates", "4,000 tokens"]],
  ["Educator Classroom Kit", 45, "one-time", "bundle", "Set up a class of 30 students for one term with shared projects.", ["30 seats / 1 term", "Assignment templates", "Instructor dashboard"]],
  ["Research Paper Repro Kit", 29, "one-time", "bundle", "Tools to reproduce and publish results from a paper.", ["Repro environment", "DOI mint", "Figure package"]],
  ["Hackathon / Team Sprint Pack", 35, "one-time", "bundle", "A short-term team workspace with pooled compute for sprints.", ["5 collaborators", "2 weeks", "3,000 pooled tokens"]],
  ["Compute Mega Pack", 50, "one-time", "bundle", "Best-value bulk compute: 6,000 Compute Tokens.", ["6,000 tokens", "Best per-token price", "Never expires"]],

  // D. Services ($50–$200)
  ["Expert Simulation Review", 99, "one-time", "service", "A simulation specialist reviews your model and reports issues.", ["Model audit", "Written report", "30-min call"]],
  ["Done-For-You Model Setup", 199, "one-time", "service", "We build your simulation model from your specification.", ["Full model build", "Validated setup", "Handover session"]],
  ["Solver Validation & Benchmarking", 149, "one-time", "service", "Validate your setup against benchmark cases and report accuracy.", ["Benchmark comparison", "Accuracy report", "Recommendations"]],
  ["Custom Node Development", 200, "one-time", "service", "We develop a custom simulation node to your specification.", ["Bespoke node", "Source + docs", "Support window"]],
  ["1:1 Onboarding & Training", 120, "one-time", "service", "A two-hour guided onboarding for you or your team.", ["2h live session", "Recording", "Follow-up notes"]],
  ["Migration Service", 175, "one-time", "service", "We migrate a model from COMSOL, Ansys, or MATLAB to PolySim.", ["Model translation", "Validation pass", "Training session"], undefined, "Move off $3,000+/yr desktop licenses."],
  ["Grant / Publication Figure Package", 85, "one-time", "service", "Publication-ready figures and animations from your results.", ["5 figures", "1 animation", "Journal formatting"]],
  ["Priority Bug / Model Rescue", 60, "one-time", "service", "Fast-turnaround help when a model is broken before a deadline.", ["Same-day triage", "Fix or workaround", "Priority queue"]],

  // E. Add-ons ($3–$15)
  ["Rush Compute", 8, "one-time", "addon", "Run a job at 2× priority for faster turnaround.", ["2× priority", "Single job", "Add to any run"]],
  ["Extended Storage +50GB", 5, "one-time", "addon", "Add 50GB of project and result storage for a month.", ["+50GB", "30 days", "Auto-renews if kept"], "month"],
  ["Certified Reproducibility Seal", 12, "one-time", "addon", "A verified seal certifying a run is fully reproducible.", ["Verified seal", "Public badge", "Audit trail"]],
  ["Premium Formatting", 6, "one-time", "addon", "Polished formatting for figures and exports.", ["Styled figures", "Brand palette", "Vector output"]],
  ["Priority Support Pass", 10, "one-time", "addon", "30 days of priority support responses.", ["Priority queue", "30 days", "Faster SLAs"]],
  ["Watermark Removal", 4, "one-time", "addon", "Remove watermarks from exported media.", ["Clean exports", "Per project", "Instant"]],
  ["Extra Collaborator Seat", 7, "one-time", "addon", "Add one collaborator to a single project.", ["+1 collaborator", "One project", "Full edit access"]],
  ["Outcome / Accuracy Assurance Review", 15, "one-time", "addon", "A specialist sanity-checks a result before you rely on it.", ["Sanity check", "Written note", "24h turnaround"]],
  ["Custom Branding on Embeds", 9, "one-time", "addon", "Put your own logo and colors on public embeds.", ["Custom logo", "Brand colors", "Remove PolySim mark"]],
  ["Overage Protection", 5, "one-time", "addon", "A soft-cap buffer so a job never fails mid-run on token limits.", ["Token buffer", "No mid-run failures", "Alerts"]],

  // F. Reports ($1–$10)
  ["Materials Property Report", 6, "one-time", "report", "A sourced report on a material's mechanical & thermal properties.", ["Property tables", "Temperature curves", "References"]],
  ["Solver Method Recommendation Report", 4, "one-time", "report", "Describe your problem; get the recommended method and settings.", ["Method pick", "Settings", "Rationale"]],
  ["Mesh Quality Audit Report", 7, "one-time", "report", "An audit of your mesh with quality metrics and fixes.", ["Skewness/aspect metrics", "Problem cells", "Fixes"]],
  ["Simulation Cost Estimate Report", 2, "one-time", "report", "Estimate the compute tokens and time a run will take.", ["Token estimate", "Time estimate", "Cost-saving tips"]],
  ["Benchmark Comparison Report", 9, "one-time", "report", "Compare your results to published benchmark cases.", ["Benchmark table", "Error metrics", "Verdict"]],
  ["arXiv / PubMed Literature Digest", 8, "one-time", "report", "A cited digest of recent literature on your topic.", ["10+ sources", "Key findings", "Citations"]],
  ["Convergence Diagnostics Report", 5, "one-time", "report", "A diagnosis of convergence behavior from your solver logs.", ["Residual analysis", "Root cause", "Fixes"]],
  ["Compute Usage Analytics Report", 3, "one-time", "report", "A breakdown of where your compute tokens are going.", ["Usage breakdown", "Top projects", "Savings tips"]],

  // G. Education ($5–$25)
  ["Intro to Simulation (Course)", 19, "one-time", "education", "A beginner video course on browser-based simulation.", ["3h video", "Exercises", "Certificate"]],
  ["CFD Masterclass", 25, "one-time", "education", "An in-depth masterclass on computational fluid dynamics.", ["5h video", "Sample models", "Certificate"]],
  ["FEA Masterclass", 25, "one-time", "education", "An in-depth masterclass on finite-element analysis.", ["5h video", "Sample models", "Certificate"]],
  ["AI Copilot Power-User Workshop", 15, "one-time", "education", "Get expert-level results from the AI Copilot.", ["2h workshop", "Prompt library", "Recording"]],
  ["Physics Node Graph Fundamentals", 12, "one-time", "education", "Learn to build simulations with the visual node graph.", ["2h video", "Starter graphs", "Certificate"]],
  ["Reproducible Research with PolySim", 18, "one-time", "education", "Publish reproducible, citable computational research.", ["Best practices", "DOI workflow", "Templates"]],
  ["Live Monthly Office Hours", 9, "one-time", "education", "A live Q&A session with a simulation specialist.", ["Live Q&A", "Recording", "Slides"]],

  // H. Consumer subs ($3–$29/mo)
  ["Student", 5, "subscription", "consumer-sub", "Verified-student plan with cloud projects and copilot access.", ["5 cloud projects", "500 tokens/mo", "Standard copilot"], "month", "MATLAB Student Suite is $119/yr just for toolboxes."],
  ["Hobbyist", 9, "subscription", "consumer-sub", "For makers and enthusiasts exploring simulation.", ["10 cloud projects", "Standard copilot", "Community library"], "month"],
  ["Independent Researcher", 24, "subscription", "consumer-sub", "The independent researcher's plan with publication rights.", ["25 cloud projects", "10k API calls/mo", "$10 tokens/mo", "Publication rights"], "month"],
  ["Creator / Educator", 19, "subscription", "consumer-sub", "Share classrooms, publish embeds, and teach with PolySim.", ["Classroom sharing", "Live embeds", "Assignment tools"], "month"],
  ["Pro Unlimited", 29, "subscription", "consumer-sub", "Unlimited local rendering and priority AI copilot.", ["Unlimited local", "Priority copilot", "Priority support"], "month"],
  ["Family / Group (5)", 29, "subscription", "consumer-sub", "Five linked seats for a family or study group.", ["5 seats", "Shared library", "Pooled tokens"], "month"],

  // I. Business subs ($29–$499/mo)
  ["Lab / Agency", 64, "subscription", "business-sub", "For labs and agencies: multiplayer, unlimited projects, webhooks.", ["Unlimited projects", "Multiplayer", "$40/user tokens", "Webhooks"], "month"],
  ["Team Starter", 129, "subscription", "business-sub", "A small team plan with pooled seats and compute.", ["5 pooled seats", "Shared workspace", "Pooled tokens"], "month"],
  ["API / Developer Plan", 99, "subscription", "business-sub", "High API limits and webhooks for building on PolySim.", ["High API limits", "Webhooks", "SDK access"], "month"],
  ["White-Label / Embedded Widget", 299, "subscription", "business-sub", "Embed PolySim in your product under your own brand.", ["White-label embed", "Custom domain", "Priority support"], "month"],
  ["Institution", 360, "subscription", "business-sub", "For universities: SSO, up to 500 seats, admin analytics.", ["SSO/SAML", "Up to 500 seats", "Admin analytics"], "month"],
  ["Enterprise", 480, "subscription", "business-sub", "On-prem/air-gapped deployment with dedicated clusters.", ["On-prem option", "Dedicated clusters", "Custom SLAs", "24/7 support"], "month"],

  // J. Memberships ($10–$50/yr)
  ["Verified Researcher Badge", 19, "subscription", "membership", "An annual verified-researcher badge on your public profile.", ["Verified badge", "Profile boost", "Priority listing"], "year"],
  ["Community Supporter", 29, "subscription", "membership", "Support development and get early access to new nodes.", ["Early node access", "Supporter badge", "Roadmap votes"], "year"],
  ["Annual Reproducibility Audit", 49, "subscription", "membership", "An annual audit certifying your key projects are reproducible.", ["Yearly audit", "Certificates", "Priority review"], "year"],

  // K. Affiliate (free to user)
  ["Cloud GPU Provider Referral", 0, "one-time", "affiliate", "Get matched with a discounted cloud-GPU provider for big jobs.", ["Provider match", "Exclusive credits", "Free to use"]],
  ["HPC Burst-Compute Referral", 0, "one-time", "affiliate", "Access on-demand HPC burst compute through our partners.", ["HPC match", "Trial credits", "Free to use"]],
  ["Workstation / Hardware Affiliate", 0, "one-time", "affiliate", "Recommended GPUs and workstations for local WebGPU work.", ["Curated picks", "Partner deals", "Free to use"]],
  ["Textbook & Course Affiliate", 0, "one-time", "affiliate", "Recommended textbooks and courses for each simulation domain.", ["Curated list", "Discount links", "Free to use"]],
  ["Journal / Preprint Submission Partner", 0, "one-time", "affiliate", "Streamlined submission to partner journals and preprint servers.", ["Submission help", "Partner discounts", "Free to use"]],
  ["CAD Software Affiliate", 0, "one-time", "affiliate", "Recommended CAD tools that pair with PolySim meshing.", ["Curated CAD picks", "Partner deals", "Free to use"]],
  ["Lab Equipment Marketplace Partner", 0, "one-time", "affiliate", "Find validated lab equipment to compare against your sims.", ["Equipment finder", "Partner pricing", "Free to use"]],
  ["Freelance Expert Matching", 0, "one-time", "affiliate", "Get matched with a freelance simulation expert.", ["Expert match", "Vetted specialists", "Free to browse"]],

  // L. Marketplace (30% rev share)
  ["Community Model Marketplace", 0, "one-time", "marketplace", "Buy and sell forkable simulation models and templates.", ["Sell your models", "70% payout", "Instant delivery"]],
  ["Custom Node / Plugin Marketplace", 0, "one-time", "marketplace", "Buy and sell custom nodes and plugins built by the community.", ["Sell your nodes", "70% payout", "Version updates"]],

  // M. Advertising
  ["Sponsored Library Listing", 49, "subscription", "advertising", "Feature your model or service in the Community Library.", ["Top placement", "Analytics", "Monthly slot"], "month"],
  ["Featured Partner Placement", 99, "subscription", "advertising", "Featured placement for hardware/cloud partners on guides.", ["Guide placement", "Logo + link", "Monthly slot"], "month"],
  ["Benchmark Page Sponsorship", 79, "subscription", "advertising", "\"Powered by\" sponsorship on validation/benchmark pages.", ["Powered-by mark", "High-traffic pages", "Monthly slot"], "month"],
  ["Sponsored Job Listing", 59, "subscription", "advertising", "Post a simulation-engineer role to our job board.", ["30-day listing", "Newsletter mention", "Applicant analytics"], "month"],
  ["Newsletter Sponsorship Slot", 129, "subscription", "advertising", "Sponsor an edition of the PolySim newsletter.", ["Dedicated slot", "50k+ subscribers", "Click analytics"], "month"],
];

export const PRODUCTS: Product[] = SEEDS.map((s) => {
  const [name, price, billing, category, blurb, includes, interval, competitorNote] = s;
  const slug = slugify(name);
  const { rating, reviewCount } = ratingFor(slug);
  return {
    slug,
    name,
    price,
    billing,
    interval,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    blurb,
    includes,
    stripeType:
      price === 0 ? "none" : billing === "subscription" ? "subscription" : "payment",
    competitorNote,
    rating,
    reviewCount,
  };
});

export const CATEGORY_ORDER: ProductCategory[] = [
  "core", "premium", "bundle", "service", "addon", "report", "education",
  "consumer-sub", "business-sub", "membership", "affiliate", "marketplace", "advertising",
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
export function getAllProductSlugs(): string[] {
  return PRODUCTS.map((p) => p.slug);
}
export function getProductsByCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}
export function categoryLabel(category: ProductCategory): string {
  return CATEGORY_LABELS[category];
}
export function priceLabel(p: Product): string {
  if (p.price === 0) return "Free";
  if (p.billing === "subscription") return `$${p.price}/${p.interval === "year" ? "yr" : "mo"}`;
  return `$${p.price}`;
}

// Deterministic "related products" for cross-sell (varies by seed slug).
export function relatedProducts(slug: string, count = 4): Product[] {
  const idx = PRODUCTS.findIndex((p) => p.slug === slug);
  if (idx === -1) return PRODUCTS.slice(0, count);
  const out: Product[] = [];
  let step = 7;
  for (let i = 1; out.length < count && i < PRODUCTS.length; i++) {
    const p = PRODUCTS[(idx + i * step) % PRODUCTS.length];
    if (p.slug !== slug && !out.includes(p) && p.price > 0) out.push(p);
    if (i % PRODUCTS.length === 0) step++;
  }
  return out;
}

// Pick contextually relevant paid products for content pages (rotates by key).
export function contextualProducts(key: string, count = 6): Product[] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 33 + key.charCodeAt(i)) >>> 0;
  const paid = PRODUCTS.filter((p) => p.price > 0);
  const out: Product[] = [];
  for (let i = 0; out.length < count && i < paid.length * 2; i++) {
    const p = paid[(h + i * 13) % paid.length];
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

export function premiumUpsell(key: string): Product {
  const bundles = PRODUCTS.filter((p) => p.category === "bundle");
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 33 + key.charCodeAt(i)) >>> 0;
  return bundles[h % bundles.length];
}

export const PRODUCT_COUNT = PRODUCTS.length;
