import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STUDIO_COMPONENTS, STUDIO_SLUGS } from "@/components/studio/registry";

export function generateStaticParams() {
  return STUDIO_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `PolySim ${slug} — embed`, robots: { index: false }, alternates: { canonical: `/embed/${slug}` } };
}

// Chromeless, embeddable single-studio view for iframes on any site.
export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Studio = STUDIO_COMPONENTS[slug];
  if (!Studio) notFound();
  return (
    <div className="min-h-screen bg-white p-3 dark:bg-slate-950">
      <Studio />
      <div className="mt-2 text-center">
        <Link href={`/studio/${slug}`} target="_blank" className="text-xs text-slate-400 hover:text-cyan-500">
          Powered by PolySim OS ↗
        </Link>
      </div>
    </div>
  );
}
