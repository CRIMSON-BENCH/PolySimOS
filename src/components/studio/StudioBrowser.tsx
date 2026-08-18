"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Sim = { slug: string; name: string; desc: string; tag: string };

// Curate ~40 raw tags into a handful of top-level domains for clean filter chips.
function domainOf(tag: string): string {
  const t = tag.toLowerCase();
  if (/(webgpu|gpu|3d)/.test(t)) return "GPU & 3D";
  if (/(chem)/.test(t)) return "Chemistry";
  if (/(bio|med|gene)/.test(t)) return "Biology";
  if (/(finance|quant|econ|market)/.test(t)) return "Finance";
  if (/(astro|space|orbit|earth|climate|weather|geo|meteor)/.test(t)) return "Earth & Space";
  if (/(signal|dsp|acoustic|electr|circuit|antenna|filter)/.test(t)) return "Signals & EE";
  if (/(cs|ai|ml|data|network|graph|crypto)/.test(t)) return "CS & AI";
  if (/(engineer|fea|cfd|structural|civil|mech|robot|aero|manufactur)/.test(t)) return "Engineering";
  if (/(math|pde|cas|calculus|stat|probab)/.test(t)) return "Math";
  if (/(phys|flagship)/.test(t)) return "Physics";
  return "Other";
}

const DOMAIN_ORDER = ["Physics", "Math", "Engineering", "Signals & EE", "CS & AI", "Chemistry", "Biology", "Finance", "Earth & Space", "GPU & 3D", "Other"];

function scoreSim(s: Sim, words: string[]): number {
  const name = s.name.toLowerCase(), desc = s.desc.toLowerCase(), tag = s.tag.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (!w) continue;
    if (name.includes(w)) score += 3;
    if (tag.includes(w)) score += 2;
    if (desc.includes(w)) score += 1;
  }
  return score;
}

function Card({ s }: { s: Sim }) {
  return (
    <Link
      href={`/studio/${s.slug}`}
      className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-cyan-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500"
    >
      <span className="text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{s.tag}</span>
      <h2 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{s.name}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.desc}</p>
      <span className="mt-3 inline-block text-sm font-semibold text-cyan-600 dark:text-cyan-400">Launch →</span>
    </Link>
  );
}

export function StudioBrowser({ sims }: { sims: Sim[] }) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("All");
  const [finderOpen, setFinderOpen] = useState(false);
  const [finderQuery, setFinderQuery] = useState("");

  // open the finder automatically when arriving via ?find=1 (e.g. the home idle prompt)
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("find") === "1") setFinderOpen(true);
    } catch { /* ignore */ }
  }, []);

  const domains = useMemo(() => {
    const set = new Map<string, number>();
    for (const s of sims) { const d = domainOf(s.tag); set.set(d, (set.get(d) || 0) + 1); }
    return DOMAIN_ORDER.filter((d) => set.has(d)).map((d) => ({ d, n: set.get(d)! }));
  }, [sims]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sims.filter((s) => {
      if (domain !== "All" && domainOf(s.tag) !== domain) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.tag.toLowerCase().includes(q);
    });
  }, [sims, query, domain]);

  const finderResults = useMemo(() => {
    const words = finderQuery.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (!words.length) return [];
    return sims.map((s) => ({ s, score: scoreSim(s, words) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map((x) => x.s);
  }, [sims, finderQuery]);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${sims.length} simulators…`}
            aria-label="Search simulators"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <button
          onClick={() => setFinderOpen(true)}
          className="shrink-0 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
        >
          ✦ What do you want to calculate?
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[{ d: "All", n: sims.length }, ...domains].map(({ d, n }) => (
          <button
            key={d}
            onClick={() => setDomain(d)}
            className={
              domain === d
                ? "rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-900"
                : "rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"
            }
          >
            {d} <span className="opacity-60">{n}</span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">{filtered.length} of {sims.length} simulators{domain !== "All" ? ` in ${domain}` : ""}{query ? ` matching "${query}"` : ""}</p>

      {filtered.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => <Card key={s.slug} s={s} />)}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No simulators match that. <button onClick={() => { setQuery(""); setDomain("All"); }} className="font-semibold text-cyan-600 hover:underline">Clear filters</button>
        </div>
      )}

      {finderOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 pt-[10vh] backdrop-blur-sm" onClick={() => setFinderOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">What do you want to calculate?</h3>
              <button onClick={() => setFinderOpen(false)} aria-label="Close" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>
            <p className="mt-1 text-sm text-slate-500">Describe it in plain English — we&apos;ll point you to the right simulator.</p>
            <input
              autoFocus
              value={finderQuery}
              onChange={(e) => setFinderQuery(e.target.value)}
              placeholder="e.g. heat spreading through a metal plate, option pricing, orbit of a comet…"
              aria-label="Describe what you want to calculate"
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <div className="mt-4 space-y-2">
              {finderQuery.trim() === "" ? (
                <div className="flex flex-wrap gap-1.5">
                  {["heat diffusion", "option pricing", "projectile", "epidemic", "orbit", "Fourier", "gradient descent", "beam bending"].map((ex) => (
                    <button key={ex} onClick={() => setFinderQuery(ex)} className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300">{ex}</button>
                  ))}
                </div>
              ) : finderResults.length ? (
                finderResults.map((s) => (
                  <Link key={s.slug} href={`/studio/${s.slug}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-cyan-400 dark:border-slate-800">
                    <div><div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{s.name}</div><div className="text-xs text-slate-500">{s.desc}</div></div>
                    <span className="shrink-0 text-xs font-semibold text-cyan-600 dark:text-cyan-400">Open →</span>
                  </Link>
                ))
              ) : (
                <p className="py-2 text-sm text-slate-500">No match yet — try different words, or browse the domains above.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
