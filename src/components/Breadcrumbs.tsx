import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { breadcrumbLd } from "@/lib/seo";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500 dark:text-slate-400">
      <JsonLd data={breadcrumbLd(items)} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.path} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
            {i < items.length - 1 ? (
              <Link href={it.path} className="hover:text-cyan-600 dark:hover:text-cyan-400">
                {it.name}
              </Link>
            ) : (
              <span className="text-slate-700 dark:text-slate-300">{it.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
