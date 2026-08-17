import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2, Prose } from "@/components/PageShell";
import { ProductGrid } from "@/components/ProductCard";
import { contextualProducts } from "@/lib/products";
import { softwareAppLd } from "@/lib/seo";

const FEATURES: Record<string, { name: string; lede: string; body: string[]; cta: string }> = {
  "node-graph": {
    name: "Visual Node Graph",
    lede: "Build simulations by wiring logic blocks — no boilerplate, no framework lock-in.",
    body: [
      "Drag physics, math, and data nodes onto an infinite canvas and connect them to compose a complete model. A fluid node can feed a particle system; a solver node can drive a plot.",
      "The graph is the source of truth: it's versioned, shareable, forkable, and exportable, so your model is reproducible by construction.",
    ],
    cta: "Open the node graph",
  },
  "live-render": {
    name: "Live Render Viewport",
    lede: "WebGPU + WebAssembly deliver high-fidelity 2D/3D output in real time, at near-native speed.",
    body: [
      "The viewport renders your simulation as it computes, so you see the effect of every parameter change immediately — no batch-and-wait cycle.",
      "Because rendering runs locally on your device's GPU, it's free forever; you only pay when a job is large enough to need the cloud.",
    ],
    cta: "See it live",
  },
  "ai-copilot": {
    name: "AI Copilot",
    lede: "Describe a system in plain English and get a runnable node graph, grounded in the literature.",
    body: [
      "The Copilot is tuned for scientific reasoning and can turn a sentence like 'model a damped driven pendulum' into a configured, runnable graph.",
      "It also recommends solvers, catches common setup errors, and can summarize relevant arXiv and PubMed literature for your topic — all AI-powered, server-side.",
    ],
    cta: "Try the Copilot",
  },
  "data-inspector": {
    name: "Data Inspector",
    lede: "Real-time graphs, heatmaps, and matrices that make your results legible as they compute.",
    body: [
      "Drop probes anywhere in your simulation and chart their values live. Inspect fields as heatmaps, watch scalar diagnostics evolve, and export the underlying data.",
      "Every quantity is exportable to CSV or HDF5, and figures are publication-ready with one click.",
    ],
    cta: "Explore the inspector",
  },
  "hybrid-compute": {
    name: "Hybrid Compute",
    lede: "Local-first by default; burst to serverless GPU clusters only when reality gets heavy.",
    body: [
      "Simulations run on your own device via WebGPU at no cost. When a problem outgrows your hardware, scale the exact same model to the cloud, metered by Compute Tokens.",
      "You control the trade-off: keep everything local and free, or spend tokens for speed and scale — with a live cost estimate before you commit.",
    ],
    cta: "See pricing",
  },
};

export function generateStaticParams() {
  return Object.keys(FEATURES).map((feature) => ({ feature }));
}

export async function generateMetadata({ params }: { params: Promise<{ feature: string }> }): Promise<Metadata> {
  const { feature } = await params;
  const f = FEATURES[feature];
  if (!f) return {};
  return {
    title: `${f.name} — PolySim OS`,
    description: f.lede,
    alternates: { canonical: `/product/${feature}` },
  };
}

export default async function FeaturePage({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = await params;
  const f = FEATURES[feature];
  if (!f) notFound();

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Product", path: "/product/node-graph" }, { name: f.name, path: `/product/${feature}` }]}
      jsonLd={softwareAppLd({ name: `PolySim OS — ${f.name}`, description: f.lede, path: `/product/${feature}` })}
      eyebrow="Product"
      title={f.name}
      lede={f.lede}
    >
      <Link href="/studio" className="mt-6 inline-block rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white transition hover:bg-cyan-700">
        {f.cta} →
      </Link>
      <Prose>
        {f.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </Prose>
      <H2>Related products</H2>
      <ProductGrid products={contextualProducts(feature, 6)} />
    </PageShell>
  );
}
