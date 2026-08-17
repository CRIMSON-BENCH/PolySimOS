import { Breadcrumbs } from "./Breadcrumbs";
import { Disclaimer } from "./Disclaimer";
import { JsonLd } from "./JsonLd";

// Standard content-page wrapper: breadcrumbs, JSON-LD, title, lede, body, disclaimer.
export function PageShell({
  crumbs,
  jsonLd,
  title,
  lede,
  eyebrow,
  children,
  disclaimerNote,
}: {
  crumbs: { name: string; path: string }[];
  jsonLd?: object | object[];
  title: string;
  lede?: string;
  eyebrow?: string;
  children: React.ReactNode;
  disclaimerNote?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {jsonLd && <JsonLd data={jsonLd} />}
      <Breadcrumbs items={crumbs} />
      {eyebrow && (
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">{eyebrow}</p>
      )}
      <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{title}</h1>
      {lede && <p className="mt-3 max-w-3xl text-lg text-slate-600 dark:text-slate-400">{lede}</p>}
      {children}
      <Disclaimer note={disclaimerNote} />
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 max-w-3xl space-y-4 text-slate-600 dark:text-slate-400">{children}</div>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 text-2xl font-bold text-slate-900 dark:text-slate-100">{children}</h2>;
}
