import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Disclaimer } from "@/components/Disclaimer";
import { JsonLd } from "@/components/JsonLd";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { CrossLinks } from "@/components/CrossLinks";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { softwareAppLd, faqLd } from "@/lib/seo";

const OTHER_SIMS = [
  { name: "Visual Node Graph", href: "/studio/graph" },
  { name: "Particle / N-Body", href: "/studio/particles" },
  { name: "2D Fluid (CFD)", href: "/studio/fluid" },
  { name: "Dynamical Systems", href: "/studio/dynamics" },
  { name: "Heat & Wave Fields", href: "/studio/fields" },
  { name: "Symbolic Math", href: "/studio/cas" },
  { name: "AI Surrogate", href: "/studio/surrogate" },
];

export function StudioPageShell({
  slug,
  name,
  lede,
  about,
  keyword,
  children,
}: {
  slug: string;
  name: string;
  lede: string;
  about: string;
  keyword: string;
  children: React.ReactNode;
}) {
  const faqs = [
    { q: `Is this ${keyword} tool really free?`, a: `Yes. ${name} runs entirely in your browser using your device's own compute, so local use is free forever. You only pay Compute Tokens if you scale a job to the cloud.` },
    { q: `Do I need to install anything?`, a: `No. Everything runs client-side in a modern browser — no downloads, no license, no account required to start.` },
    { q: `Can I save or share my simulation?`, a: `Create a free account to save projects, and use a shareable embed or minted DOI to publish a live, interactive version anywhere.` },
    { q: `How accurate are the results?`, a: `The solver uses established numerical methods, but results are for research and educational purposes and should be validated against experiment or professional review before you rely on them.` },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={[softwareAppLd({ name, description: lede, path: `/studio/${slug}` }), faqLd(faqs)]} />
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Studio", path: "/studio" }, { name, path: `/studio/${slug}` }]} />
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{name}</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-600 dark:text-slate-400">{lede}</p>

      <div className="mt-8">{children}</div>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">How it works</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">{about}</p>
      </section>

      <PremiumCTA product={premiumUpsell(slug)} />
      <ProductGrid products={contextualProducts(slug, 6)} title="Related products & compute" />
      <CrossLinks title="More live simulations" links={OTHER_SIMS.filter((s) => s.href !== `/studio/${slug}`)} />

      <section className="mt-12 max-w-3xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Frequently asked questions</h2>
        <dl className="mt-4 space-y-4">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-slate-800 dark:text-slate-200">{f.q}</dt>
              <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Disclaimer />
    </div>
  );
}
