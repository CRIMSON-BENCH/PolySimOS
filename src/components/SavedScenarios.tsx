"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Scenario = { id: number; slug: string; name: string; path: string; created_at: string };

// Lists the signed-in user's saved solver setups on the Dashboard, with open + delete.
export function SavedScenarios() {
  const [items, setItems] = useState<Scenario[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/scenarios")
      .then((r) => r.json())
      .then((d) => { if (alive) setItems(Array.isArray(d.scenarios) ? d.scenarios : []); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, []);

  const remove = async (id: number) => {
    setItems((cur) => (cur ? cur.filter((s) => s.id !== id) : cur)); // optimistic
    try { await fetch(`/api/scenarios?id=${id}`, { method: "DELETE" }); } catch { /* ignore */ }
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Saved setups</h2>
      {items === null ? (
        <p className="mt-2 text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          No saved setups yet. Open any <Link href="/studio" className="text-cyan-600 hover:underline dark:text-cyan-400">simulator</Link>, tune the parameters, and hit <span className="font-medium">★ Save this setup</span>.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link href={s.path} className="block truncate font-semibold text-slate-900 hover:text-cyan-600 dark:text-slate-100 dark:hover:text-cyan-400">{s.name}</Link>
                <span className="text-xs text-slate-500">{s.slug}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link href={s.path} className="text-sm font-semibold text-cyan-600 hover:underline dark:text-cyan-400">Open →</Link>
                <button onClick={() => remove(s.id)} aria-label="Delete" className="rounded-md p-1 text-slate-400 hover:text-rose-500">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
