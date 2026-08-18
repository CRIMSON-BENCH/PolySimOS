import type { Metadata } from "next";
import Link from "next/link";
import { EmbeddedStudio } from "@/components/studio/EmbeddedStudio";
import { STUDIO_SLUGS } from "@/components/studio/registry";
import { SIMS } from "@/app/studio/page";

export const dynamicParams = true;

export function generateStaticParams() {
  return STUDIO_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sim = SIMS.find((s) => s.slug === slug);
  return {
    title: `${sim?.name ?? "Simulation"} — embedded`,
    robots: { index: false, follow: false }, // embeds shouldn't be indexed; the /studio page is canonical
  };
}

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sim = SIMS.find((s) => s.slug === slug);

  return (
    <div className="min-h-screen bg-slate-950 p-2">
      <EmbeddedStudio slug={slug} kind="solver" />
      <div className="mt-1.5 px-1 text-right text-[11px] text-slate-500">
        <Link
          href={`https://www.polysimos.com/studio/${slug}`}
          target="_blank"
          rel="noopener"
          className="transition hover:text-cyan-400"
        >
          {sim?.name ?? "Live simulation"} · made with <span className="font-semibold">PolySim OS</span> ↗
        </Link>
      </div>
    </div>
  );
}
