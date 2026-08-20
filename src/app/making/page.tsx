import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, H2 } from "@/components/PageShell";
import { ClipShowcase } from "@/components/ClipShowcase";
import { faqLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Simulate It. Then Build It — PolySim Maker | PolySim OS",
  description:
    "PolySim closes the loop from equation to physical object — free, in your browser. Connect real hardware over WebSerial, generate flashable Arduino/C code from a controller you tuned, export DXF/STL + a bill of materials, fit models to real data, and size a part to a spec. A free alternative to Simulink + Simulink Coder + Hardware Support Packages.",
  alternates: { canonical: "/making" },
};

const TOOLS: { name: string; slug: string; blurb: string }[] = [
  { name: "Hardware Bridge", slug: "hardware-bridge", blurb: "Connect a real Arduino/sensor/motor over WebSerial — live data in, control out. No install." },
  { name: "Controller → Code", slug: "controller-code", blurb: "Tune a PID, preview the closed loop, export a ready-to-flash Arduino/C/Python sketch." },
  { name: "Fabricate", slug: "fabricate", blurb: "Design a part → exact DXF (laser/CNC), STL (3D print), and a bill of materials with fasteners." },
  { name: "Model Fit & Validate", slug: "model-fit", blurb: "Paste real measured data → identify a validated model (system ID) with R² and residuals." },
  { name: "Design Optimizer", slug: "design-optimizer", blurb: "State a load + deflection spec → the lightest or cheapest material and section that meets it." },
];

const faqs = [
  { q: "Can I control a real Arduino from the browser?", a: "Yes. The Hardware Bridge uses the browser's WebSerial API to talk to an Arduino, ESP32, or any board that prints newline-delimited numbers — stream live sensor data and send a control value back, with no install. It needs a Chromium browser (Chrome or Edge) on desktop; a built-in demo device lets you try the whole loop with no hardware." },
  { q: "Is there a free alternative to Simulink and Simulink Coder?", a: "PolySim's Block Diagram Simulator models dynamic systems, and Controller → Code generates a ready-to-flash Arduino/C sketch from a controller you tuned — the free, browser-native version of what Simulink + Simulink Coder + a Hardware Support Package cost thousands to do." },
  { q: "Can I 3D-print or laser-cut a part designed in PolySim?", a: "Yes. Fabricate exports a watertight STL for 3D printing and an exact DXF (with circular holes) for laser cutting, CNC, or waterjet, plus a bill of materials listing the stock and correctly-sized fasteners." },
  { q: "How do I turn real measurements into a model?", a: "Paste your logged data into Model Fit & Validate and it identifies a model — including a first-order system-ID mode that hands the identified plant straight to Controller → Code, so you can tune a PID for your actual system." },
  { q: "Is this certified for production engineering?", a: "No — PolySim is for prototyping, learning, and design exploration. Always verify fit, load, and safety with full analysis and physical testing before relying on a part or controller." },
];

export default function MakingPage() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "Making", path: "/making" }]}
      jsonLd={faqLd(faqs)}
      title="Simulate it. Then build it."
      lede="PolySim now reaches out of the browser and into the real world — connect hardware, generate firmware, export fab files, fit models to real data, and size parts to a spec. Free, no install."
    >
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/studio/hardware-bridge" className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">Connect real hardware →</Link>
        <Link href="/studio/controller-code" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">Generate firmware →</Link>
        <Link href="/studio/fabricate" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">Export a part →</Link>
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-300/40 bg-cyan-500/5 p-5 text-sm text-slate-700 dark:border-cyan-500/30 dark:text-slate-300">
        <b>What it replaces:</b> Simulink + Simulink Coder + a Hardware Support Package + a CAD exporter — thousands of dollars in licenses and toolboxes, here for free in a browser tab.
      </div>

      <H2>Two loops, closed in the browser</H2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">The control loop</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Log a real system through the <Link href="/studio/hardware-bridge" className="text-cyan-600 hover:underline dark:text-cyan-400">Hardware Bridge</Link> → identify its model in <Link href="/studio/model-fit" className="text-cyan-600 hover:underline dark:text-cyan-400">Model Fit</Link> → design & export a controller in <Link href="/studio/controller-code" className="text-cyan-600 hover:underline dark:text-cyan-400">Controller → Code</Link> → flash it → drive and monitor it live back through the Hardware Bridge.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">The making loop</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            State a spec in the <Link href="/studio/design-optimizer" className="text-cyan-600 hover:underline dark:text-cyan-400">Design Optimizer</Link> → it sizes the part and picks the material → send it to <Link href="/studio/fabricate" className="text-cyan-600 hover:underline dark:text-cyan-400">Fabricate</Link> for the exact DXF/STL and a bill of materials → build it.
          </p>
        </div>
      </div>

      <H2>The tools</H2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <Link key={t.slug} href={`/studio/${t.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500">
            <h3 className="font-bold text-slate-900 group-hover:text-cyan-600 dark:text-slate-100 dark:group-hover:text-cyan-400">{t.name} →</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.blurb}</p>
          </Link>
        ))}
      </div>

      <H2>See PolySim in action</H2>
      <div className="mt-5"><ClipShowcase slugs={["double-pendulum", "fluid", "bode-plot", "dynamics", "attractors", "bloch-sphere"]} max={6} /></div>

      <H2>Frequently asked</H2>
      <div className="mt-4 max-w-3xl divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {faqs.map((f) => (
          <details key={f.q} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2.5 font-semibold text-slate-800 hover:text-cyan-700 dark:text-slate-200 dark:hover:text-cyan-300">
              <span>{f.q}</span>
              <span className="shrink-0 text-slate-400 transition group-open:rotate-180">▾</span>
            </summary>
            <div className="pb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.a}</div>
          </details>
        ))}
      </div>

      <p className="mt-8 text-xs text-slate-400">
        PolySim OS is a prototyping and education tool, not a certified engineering service. Arduino and Simulink are trademarks of their respective owners; PolySim OS is independent and not affiliated with or endorsed by them.
      </p>
    </PageShell>
  );
}
