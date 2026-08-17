"use client";

import { STUDIO_COMPONENTS } from "./registry";

const OVERRIDES: Record<string, string> = {
  rsa: "RSA", "gps-trilateration": "GPS Trilateration", oee: "OEE", "cnc-feeds-speeds": "CNC Feeds & Speeds",
  lcoe: "LCOE", "ev-efficiency": "EV Efficiency", "xg-model": "Expected Goals (xG)", rrt: "RRT Path Planning",
  pca: "PCA", "ab-test": "A/B Test", "hr-diagram": "H-R Diagram", "dc-motor": "DC Motor", "pid-control": "PID Control",
  fft: "FFT", "led": "LED", "rlc": "RLC Circuit", "fea": "FEA Truss", "fea-3d": "3D FEA", "cfd-3d": "3D CFD",
  "sir-model": "SIR Model", "hamming-code": "Hamming Code", "littles-law": "Little's Law", "wolfram-ca": "Elementary CA",
};
const title = (slug: string) => OVERRIDES[slug] || slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

export function MultiStudioSteps({ steps }: { steps: string[] }) {
  const valid = steps.filter((s) => STUDIO_COMPONENTS[s]);
  return (
    <div className="space-y-10">
      {valid.map((slug, i) => {
        const Studio = STUDIO_COMPONENTS[slug];
        return (
          <div key={slug}>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">{i + 1}</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title(slug)}</h3>
              <a href={`/studio/${slug}`} className="text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400">open full solver →</a>
            </div>
            <Studio />
            {i < valid.length - 1 && <div className="mt-8 flex justify-center text-2xl text-slate-400">↓</div>}
          </div>
        );
      })}
    </div>
  );
}
