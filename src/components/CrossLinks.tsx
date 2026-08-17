import Link from "next/link";

export function CrossLinks({
  title,
  links,
}: {
  title: string;
  links: { name: string; href: string }[];
}) {
  if (!links.length) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-400"
          >
            {l.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
