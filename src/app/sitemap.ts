import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { DOMAINS, allDomainTopicPairs } from "@/lib/domains";
import { METHODS } from "@/lib/methods";
import { INDUSTRIES } from "@/lib/industries";
import { MATERIALS, materialPropertyPairs } from "@/lib/materials";
import { MODELS } from "@/lib/models";
import { GLOSSARY } from "@/lib/glossary";
import { PRODUCTS } from "@/lib/products";
import { COMPARISONS } from "@/lib/comparisons";
import { MIGRATION_SLUGS } from "@/lib/migrations";
import { INSTITUTIONS } from "@/lib/institutions";
import { SIM_TOPICS } from "@/lib/simulate";
import { ARTICLES } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-08-16");
  const u = (path: string, priority = 0.6, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") =>
    ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });

  const staticPages = [
    u("/", 1.0), u("/studio", 0.9), u("/pricing", 0.8), u("/domains", 0.8), u("/methods", 0.7),
    u("/for", 0.7), u("/materials", 0.7), u("/models", 0.7), u("/glossary", 0.7), u("/tools", 0.8),
    u("/compare", 0.7), u("/migrate", 0.7), u("/education", 0.7), u("/simulate", 0.7), u("/blog", 0.7),
    u("/templates", 0.6), u("/about", 0.5), u("/for-business", 0.6), u("/community", 0.5), u("/developers", 0.6),
    u("/developers/sdk", 0.4), u("/developers/webhooks", 0.4), u("/login", 0.3), u("/signup", 0.4), u("/dashboard", 0.3),
    u("/terms", 0.3), u("/privacy", 0.3), u("/refund", 0.3), u("/acceptable-use", 0.3),
    u("/studio/graph", 0.9), u("/studio/particles", 0.8), u("/studio/fluid", 0.8), u("/studio/dynamics", 0.8), u("/studio/fields", 0.8), u("/studio/cas", 0.8), u("/studio/surrogate", 0.8),
    u("/studio/3d", 0.8), u("/studio/fea", 0.8), u("/studio/electromagnetics", 0.8), u("/studio/molecular-dynamics", 0.8), u("/studio/mesh", 0.8), u("/studio/vector-field", 0.8), u("/studio/optimize", 0.8), u("/studio/notebook", 0.8),
    u("/studio/gpu", 0.9), u("/studio/fea-3d", 0.8),
    u("/product/node-graph", 0.5), u("/product/live-render", 0.5), u("/product/ai-copilot", 0.6), u("/product/data-inspector", 0.5), u("/product/hybrid-compute", 0.5),
  ];

  const dynamic: MetadataRoute.Sitemap = [
    ...DOMAINS.map((d) => u(`/domains/${d.slug}`, 0.7)),
    ...allDomainTopicPairs().map((p) => u(`/domains/${p.domain}/${p.topic}`)),
    ...METHODS.map((m) => u(`/methods/${m.slug}`)),
    ...METHODS.filter((m) => !/^(explicit|implicit|2d|3d|transient|steady-state|gpu-accelerated) /i.test(m.name))
      .flatMap((m) => INDUSTRIES.map((ind) => u(`/methods/${m.slug}/${ind.slug}`, 0.5))),
    ...INDUSTRIES.map((i) => u(`/for/${i.slug}`, 0.6)),
    ...MATERIALS.map((m) => u(`/materials/${m.slug}`)),
    ...materialPropertyPairs().map((p) => u(`/materials/${p.material}/${p.property}`, 0.5)),
    ...MODELS.map((m) => u(`/models/${m.slug}`, 0.7)),
    ...GLOSSARY.map((t) => u(`/glossary/${t.slug}`)),
    ...PRODUCTS.map((p) => u(`/tools/${p.slug}`, 0.7)),
    ...COMPARISONS.map((c) => u(`/compare/${c.slug}`, 0.6)),
    ...MIGRATION_SLUGS.map((s) => u(`/migrate/${s}`, 0.6)),
    ...INSTITUTIONS.map((i) => u(`/education/${i.slug}`, 0.5)),
    ...SIM_TOPICS.map((t) => u(`/simulate/${t.slug}`, 0.6)),
    ...SIM_TOPICS.flatMap((t) => INDUSTRIES.slice(0, 12).map((ind) => u(`/simulate/${t.slug}/${ind.slug}`, 0.5))),
    ...ARTICLES.map((a) => u(`/blog/${a.slug}`, 0.6)),
  ];

  return [...staticPages, ...dynamic];
}
