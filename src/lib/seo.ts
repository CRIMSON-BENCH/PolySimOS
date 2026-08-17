// Shared SEO helpers: slugify, title-case, and JSON-LD builders.

export const SITE_URL = "https://www.polysimos.com";
export const SITE_NAME = "PolySim OS";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['".,()/]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(input: string): string {
  return input
    .split(/[-\s]+/)
    .map((w) => (w.length <= 2 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// --- JSON-LD builders -----------------------------------------------------

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function articleLd(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    url: absUrl(opts.path),
    datePublished: opts.datePublished ?? "2026-01-15",
    dateModified: "2026-08-16",
    author: { "@type": "Organization", name: opts.author ?? SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function howToLd(opts: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function definedTermLd(opts: {
  term: string;
  definition: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: opts.term,
    description: opts.definition,
    url: absUrl(opts.path),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "PolySim OS Simulation Glossary",
      url: absUrl("/glossary"),
    },
  };
}

export function productLd(opts: {
  name: string;
  description: string;
  price: number;
  path: string;
  recurring?: boolean;
  rating?: number;
  reviewCount?: number;
}) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    url: absUrl(opts.path),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: opts.price.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absUrl(opts.path),
    },
  };
  if (opts.rating && opts.reviewCount) {
    base.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: opts.rating.toFixed(1),
      reviewCount: opts.reviewCount,
    };
  }
  return base;
}

export function softwareAppLd(opts: {
  name: string;
  description: string;
  path: string;
  price?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: opts.name,
    description: opts.description,
    url: absUrl(opts.path),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web (WebGPU-enabled browser)",
    offers: {
      "@type": "Offer",
      price: (opts.price ?? 0).toFixed(2),
      priceCurrency: "USD",
    },
  };
}
