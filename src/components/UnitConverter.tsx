"use client";

import { useMemo, useState } from "react";
import { UnitCategory, convert } from "@/lib/units";

export function UnitConverter({ category, fromSlug, toSlug }: { category: UnitCategory; fromSlug?: string; toSlug?: string }) {
  const [from, setFrom] = useState(fromSlug ?? category.units[0].slug);
  const [to, setTo] = useState(toSlug ?? category.units[1]?.slug ?? category.units[0].slug);
  const [value, setValue] = useState("1");

  const result = useMemo(() => {
    const f = category.units.find((u) => u.slug === from)!;
    const t = category.units.find((u) => u.slug === to)!;
    const v = parseFloat(value);
    if (isNaN(v)) return "";
    const r = convert(v, f, t);
    return Math.abs(r) >= 1e6 || (Math.abs(r) < 1e-4 && r !== 0) ? r.toExponential(6) : String(Math.round(r * 1e6) / 1e6);
  }, [category, from, to, value]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div>
          <label className="mb-1 block text-xs text-slate-500">From</label>
          <input value={value} onChange={(e) => setValue(e.target.value)} className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <select value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            {category.units.map((u) => <option key={u.slug} value={u.slug}>{u.name} ({u.symbol})</option>)}
          </select>
        </div>
        <button onClick={() => { setFrom(to); setTo(from); }} className="mb-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-500 hover:border-cyan-400 dark:border-slate-700" title="Swap">⇄</button>
        <div>
          <label className="mb-1 block text-xs text-slate-500">To</label>
          <div className="mb-2 w-full overflow-x-auto rounded-lg bg-cyan-50 px-3 py-2 text-lg font-bold text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300">{result}</div>
          <select value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
            {category.units.map((u) => <option key={u.slug} value={u.slug}>{u.name} ({u.symbol})</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
