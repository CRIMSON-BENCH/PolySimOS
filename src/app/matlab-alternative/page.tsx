import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, H2 } from "@/components/PageShell";
import { ClipShowcase } from "@/components/ClipShowcase";
import { faqLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free MATLAB Alternative — Run It in Your Browser | PolySim OS",
  description:
    "A free, browser-native alternative to MATLAB & Simulink for interactive simulation, teaching, and prototyping. 390+ live tools across linear algebra, numerical methods, signal processing, control, image processing, communications, and ML — no install, no license.",
  alternates: { canonical: "/matlab-alternative" },
};

// MATLAB toolbox → PolySim solver mapping. Every slug is a real /studio page.
const TOOLBOXES: { mat: string; blurb: string; sims: [string, string][] }[] = [
  {
    mat: "Core & Linear Algebra",
    blurb: "MATLAB is the “matrix laboratory.” Explore the matrix math it's named for — visually.",
    sims: [
      ["SVD (image compression)", "svd"],
      ["Linear Transformation", "linear-transform"],
      ["Gaussian Elimination / LU", "matrix-elimination"],
      ["Least Squares", "least-squares"],
      ["Eigenvectors", "eigenvectors"],
      ["PCA", "pca"],
    ],
  },
  {
    mat: "Numerical Methods",
    blurb: "The core numerical routines — see the algorithms converge step by step.",
    sims: [
      ["Root Finding (Newton/bisection)", "root-finding"],
      ["Numerical Integration", "numerical-integration"],
      ["ODE Solvers (Euler vs RK4)", "ode-methods"],
      ["Curve Fitting (Gauss–Newton)", "curve-fitting"],
      ["Newton's Method", "newton"],
    ],
  },
  {
    mat: "Signal Processing Toolbox",
    blurb: "FFTs, filters, and time–frequency analysis, live in the browser.",
    sims: [
      ["FFT", "fft"],
      ["Spectrogram (STFT)", "spectrogram"],
      ["Z-Transform (pole-zero)", "z-transform"],
      ["Wavelet Transform", "wavelet"],
      ["FIR Filter", "fir-filter"],
      ["Filter Designer", "filter-designer"],
    ],
  },
  {
    mat: "Control System Toolbox",
    blurb: "Design and analyze feedback controllers — drag the poles, tune the gains.",
    sims: [
      ["Bode / Nyquist", "bode-nyquist"],
      ["Root Locus", "root-locus"],
      ["PID Tuner", "pid-tuner"],
      ["State-Space", "state-space"],
      ["LQR Control", "lqr"],
      ["State Observer", "state-observer"],
      ["Kalman Filter", "kalman-filter"],
    ],
  },
  {
    mat: "Simulink",
    blurb: "Wire a block diagram and run it — a free, browser-native Simulink alternative.",
    sims: [["Block Diagram Simulator", "block-diagram"]],
  },
  {
    mat: "Image Processing Toolbox",
    blurb: "Convolution, edges, morphology, and frequency-domain filtering on a live image.",
    sims: [
      ["Convolution Kernels", "image-convolution"],
      ["Edge Detection (Canny)", "edge-detection"],
      ["Morphology", "morphology"],
      ["2D Image FFT", "image-fft"],
      ["Histogram Equalization", "histogram-equalization"],
      ["Thresholding (Otsu)", "thresholding"],
    ],
  },
  {
    mat: "Communications Toolbox",
    blurb: "Modulation, constellations, and link performance under noise.",
    sims: [
      ["Digital Modulation (QAM/PSK)", "digital-modulation"],
      ["Eye Diagram", "eye-diagram"],
      ["BER vs SNR", "ber-snr"],
      ["Matched Filter", "matched-filter"],
    ],
  },
  {
    mat: "Statistics & Machine Learning",
    blurb: "Fit, classify, and quantify uncertainty — with the math on screen.",
    sims: [
      ["k-Means", "kmeans"],
      ["Linear Regression", "linear-regression"],
      ["Logistic Regression", "logistic-regression"],
      ["SVM Margin", "svm-margin"],
      ["Gaussian Process", "gaussian-process"],
    ],
  },
];

const faqs = [
  {
    q: "Is there a free alternative to MATLAB?",
    a: "Yes. PolySim OS runs 390+ interactive simulators in your browser for free — no install, no license, no account to start. It covers much of what MATLAB's core and toolboxes are used for in teaching, exploration, and prototyping: linear algebra, numerical methods, signal processing, control systems, image processing, communications, and machine learning.",
  },
  {
    q: "Is there a free alternative to Simulink?",
    a: "PolySim's Block Diagram Simulator lets you wire blocks — sources, gains, sums, integrators, transfer functions, and a scope — and run the model with a real RK4 solver, right in the browser. It's a free, browser-native alternative to Simulink for modeling and teaching dynamic systems.",
  },
  {
    q: "Can I get the code out?",
    a: "Every simulator exports its current setup as runnable Python, MATLAB, or Julia code with one click, so you can take your work into any environment.",
  },
  {
    q: "Does PolySim replace MATLAB?",
    a: "We're honest about this: PolySim is a free alternative for interactive exploration, teaching, and prototyping — not a certified replacement for MATLAB's validated production toolboxes. For accessible, instant, in-browser simulation, PolySim is often all you need; for certified engineering workflows, MATLAB still leads.",
  },
  {
    q: "How much does it cost?",
    a: "Local use is free forever. Optional paid plans add saving, cloud compute, exports, and an AI copilot — starting well below the cost of a MATLAB license.",
  },
];

export default function MatlabAlternativePage() {
  return (
    <PageShell
      crumbs={[{ name: "Home", path: "/" }, { name: "MATLAB Alternative", path: "/matlab-alternative" }]}
      jsonLd={faqLd(faqs)}
      title="A free, browser-native alternative to MATLAB"
      lede="Interactive simulation for students, engineers, and researchers — no install, no license. 390+ live tools spanning the toolboxes people actually use, plus a Simulink-style block simulator."
    >
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/studio" className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700">Launch the Studio — free →</Link>
        <Link href="/compare/matlab" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">MATLAB vs PolySim →</Link>
        <Link href="/compare/simulink" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">Simulink vs PolySim →</Link>
      </div>

      <H2>See it run</H2>
      <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">A few of the live simulators — every one runs in your browser, free.</p>
      <div className="mt-5">
        <ClipShowcase slugs={["fluid", "double-pendulum", "attractors", "bode-plot", "dynamics", "bloch-sphere", "aliasing", "black-scholes"]} max={6} />
      </div>

      <H2>MATLAB toolbox → PolySim, tool for tool</H2>
      <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
        Find the MATLAB or Simulink capability you need on the left; open the free, interactive PolySim equivalent on the right.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {TOOLBOXES.map((t) => (
          <div key={t.mat} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.mat}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.blurb}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {t.sims.map(([label, slug]) => (
                <li key={slug}>
                  <Link href={`/studio/${slug}`} className="inline-block rounded-lg border border-cyan-300/50 bg-cyan-500/5 px-3 py-1.5 text-sm font-medium text-cyan-800 transition hover:border-cyan-400 hover:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-300">
                    {label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <H2>Why teach and prototype in the browser</H2>
      <ul className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-2">
        {[
          ["Free & instant", "No install, no license, no account to start. Open a link and it runs."],
          ["Touch the math", "Drag sliders — and objects on the canvas — and watch systems respond live."],
          ["Real equations + code", "The governing math renders on screen; export runnable Python/MATLAB/Julia."],
          ["Share anywhere", "Every tool is a link you can embed in a page, slide deck, or LMS."],
        ].map(([h, b]) => (
          <li key={h} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="font-semibold text-slate-900 dark:text-slate-100">{h}</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{b}</div>
          </li>
        ))}
      </ul>

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
        MATLAB and Simulink are trademarks of The MathWorks, Inc. PolySim OS is an independent product and is not affiliated with or endorsed by MathWorks.
      </p>
    </PageShell>
  );
}
