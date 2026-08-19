"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { SIM_CLIPS } from "@/lib/simClips";

const pretty = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// A small grid of live preview clips (silent, looping) that link to their solvers.
// Only renders slugs that actually have a clip; plays a clip only while it's in view
// (IntersectionObserver + preload=none) so a page never loads a wall of video at once.
export function ClipShowcase({ slugs, max = 6 }: { slugs: string[]; max?: number }) {
  const items = slugs.filter((s) => SIM_CLIPS.has(s)).slice(0, max);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const vids = Array.from(root.querySelectorAll("video"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.25 },
    );
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((slug) => (
        <Link
          key={slug}
          href={`/studio/${slug}`}
          className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500"
        >
          <div className="aspect-video overflow-hidden bg-slate-950">
            <video
              poster={`/sim-clips/${slug}.jpg`}
              muted
              loop
              playsInline
              preload="none"
              className="h-full w-full object-cover transition group-hover:scale-[1.03]"
            >
              <source src={`/sim-clips/${slug}.webm`} type="video/webm" />
              <source src={`/sim-clips/${slug}.mp4`} type="video/mp4" />
            </video>
          </div>
          <div className="flex items-center justify-between p-3 text-sm font-semibold text-slate-800 group-hover:text-cyan-600 dark:text-slate-200 dark:group-hover:text-cyan-400">
            {pretty(slug)}
            <span aria-hidden>→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
