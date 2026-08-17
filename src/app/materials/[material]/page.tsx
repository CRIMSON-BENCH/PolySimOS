import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, H2 } from "@/components/PageShell";
import { getMaterial, getAllMaterialSlugs, PROPERTIES, formatProp } from "@/lib/materials";
import { ProductGrid } from "@/components/ProductCard";
import { PremiumCTA } from "@/components/PremiumCTA";
import { contextualProducts, premiumUpsell } from "@/lib/products";
import { ACCURACY_NOTE } from "@/lib/disclaimer";
import { faqLd } from "@/lib/seo";
import { StudioPromo } from "@/components/StudioPromo";

export function generateStaticParams() {
  return getAllMaterialSlugs().map((material) => ({ material }));
}

export async function generateMetadata({ params }: { params: Promise<{ material: string }> }): Promise<Metadata> {
  const { material } = await params;
  const m = getMaterial(material);
  if (!m) return {};
  return {
    title: `${m.name} — Material Properties for Simulation`,
    description: `${m.name} (${m.category}): density ${m.density} kg/m³, Young's modulus ${m.youngsModulus} GPa, thermal conductivity ${m.thermalConductivity} W/(m·K), and more.`,
    alternates: { canonical: `/materials/${m.slug}` },
  };
}

export default async function MaterialPage({ params }: { params: Promise<{ material: string }> }) {
  const { material } = await params;
  const m = getMaterial(material);
  if (!m) notFound();

  const faqs = [
    { q: `What is the density of ${m.name}?`, a: `${m.name} has an approximate density of ${m.density} kg/m³.` },
    { q: `What is the Young's modulus of ${m.name}?`, a: `${m.name} has an approximate Young's modulus of ${m.youngsModulus} GPa.` },
  ];

  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Materials", path: "/materials" }, { name: m.name, path: `/materials/${m.slug}` }]}
      jsonLd={faqLd(faqs)}
      eyebrow={m.category}
      title={`${m.name} — Properties`}
      lede={`Representative simulation properties for ${m.name}. Click any property for a detailed comparison across materials.`}
      disclaimerNote={ACCURACY_NOTE}
    >
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <tbody>
            {PROPERTIES.map((p) => (
              <tr key={p.slug} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-3">
                  <Link href={`/materials/${m.slug}/${p.slug}`} className="font-medium text-cyan-600 hover:underline dark:text-cyan-400">{p.label}</Link>
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">{formatProp(m, p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Using {m.name} in a simulation</H2>
      <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-400">
        Assign these properties to a material node in PolySim to run structural, thermal, or multi-physics
        analyses with {m.name}. The AI Copilot can suggest which properties matter most for your specific study.
      </p>

      <PremiumCTA product={premiumUpsell(m.slug)} heading="Get the full sourced property sheet" />
      <ProductGrid products={contextualProducts(m.slug, 6)} title="Related products" />
      <StudioPromo heading="Put this material to work in a simulation" links={[{ name: "FEA Truss", href: "/studio/fea" }, { name: "3D FEA", href: "/studio/fea-3d" }, { name: "Heat & Wave", href: "/studio/fields" }, { name: "Molecular Dynamics", href: "/studio/molecular-dynamics" }]} />
    </PageShell>
  );
}
