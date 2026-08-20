import Link from "next/link";
import { DISCLAIMER_SHORT } from "@/lib/disclaimer";

const COLUMNS: { title: string; links: { name: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { name: "Node Graph", href: "/product/node-graph" },
      { name: "Live Render", href: "/product/live-render" },
      { name: "AI Copilot", href: "/product/ai-copilot" },
      { name: "Data Inspector", href: "/product/data-inspector" },
      { name: "Launch Studio", href: "/studio" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { name: "Physics", href: "/domains/physics" },
      { name: "Biology", href: "/domains/biology" },
      { name: "Chemistry", href: "/domains/chemistry" },
      { name: "Mathematics", href: "/domains/mathematics" },
      { name: "Engineering", href: "/domains/engineering" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Simulation Guides", href: "/simulate" },
      { name: "Methods", href: "/methods" },
      { name: "Models & Equations", href: "/models" },
      { name: "Materials", href: "/materials" },
      { name: "Unit Converters", href: "/convert" },
      { name: "Constants", href: "/constants" },
      { name: "Courses", href: "/courses" },
      { name: "Curriculum", href: "/curriculum" },
      { name: "High Schools", href: "/schools" },
      { name: "Alternatives", href: "/alternatives" },
      { name: "MATLAB Alternative", href: "/matlab-alternative" },
      { name: "Simulate → Build", href: "/making" },
      { name: "Glossary", href: "/glossary" },
      { name: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Developers",
    links: [
      { name: "API", href: "/developers" },
      { name: "SDK", href: "/developers/sdk" },
      { name: "Webhooks", href: "/developers/webhooks" },
      { name: "Templates", href: "/templates" },
      { name: "Marketplace", href: "/marketplace" },
      { name: "Courses", href: "/education" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "For Business", href: "/for-business" },
      { name: "Custom Solvers", href: "/custom-solvers" },
      { name: "Pricing", href: "/pricing" },
      { name: "Compare", href: "/compare/simscale" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Terms", href: "/terms" },
      { name: "Privacy", href: "/privacy" },
      { name: "Security", href: "/security" },
      { name: "Cookies", href: "/cookies" },
      { name: "DPA", href: "/dpa" },
      { name: "Refund Policy", href: "/refund" },
      { name: "Acceptable Use", href: "/acceptable-use" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 pb-24 dark:border-slate-800 dark:bg-slate-950 sm:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-slate-600 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-lime-400 text-xs font-black text-slate-950">P</span>
            <span className="text-slate-900 dark:text-slate-100">PolySim OS</span>
          </div>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-500">{DISCLAIMER_SHORT}</p>
          <p className="mt-4 text-xs text-slate-400">© 2026 PolySim OS Labs. The Everything Engine for simulation.</p>
        </div>
      </div>
    </footer>
  );
}
