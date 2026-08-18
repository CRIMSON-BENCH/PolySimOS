import Link from "next/link";

// An honest, genuinely-impressive social-proof band: a scrolling wall of the REAL simulators
// PolySim ships. No third-party logos, no endorsement claims — just the actual breadth of the
// library, every item real and one click from running. Pure-CSS marquee (no JS, SSR-safe).

const ROW_A = [
  "Navier–Stokes CFD", "Lorenz Attractor", "Schrödinger Well", "Kalman Filter", "Hodgkin–Huxley Neuron",
  "Black–Scholes Greeks", "Orbital Mechanics", "Reaction–Diffusion", "Ising Model", "Double Pendulum",
  "Fourier Transform", "Ideal Gas Law", "SIR Epidemic", "Bloch Sphere", "Root Locus",
  "Molecular Dynamics", "Gaussian Beam Optics", "Cart-Pole Control", "Rocket Equation", "Nuclear Binding Energy",
  "Turing Patterns", "Maxwell–Boltzmann", "Stress–Strain Curve", "PID Control", "Diffraction Grating",
];

const ROW_B = [
  "N-Body Gravity", "Heat Equation", "Neutron Transport", "Van der Waals EOS", "Michaelis–Menten",
  "Doppler Effect", "Standing Waves", "Monte Carlo VaR", "Gradient Descent", "Convolution",
  "Hohmann Transfer", "Otto Cycle", "Genetic Algorithm", "Photoelectric Effect", "Mohr's Circle",
  "Quantum Tunneling", "Rossby Waves", "Buck Converter", "Elliptic-Curve Crypto", "Predator–Prey",
  "Chladni Plates", "Compressible Nozzle", "Fiber-Optic NA", "Markov Chains", "Perceptron",
];

function Row({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items]; // duplicate so the loop is seamless
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div
        className="flex shrink-0 items-center gap-3 py-2"
        style={{ animation: `polysim-marquee ${reverse ? "58s" : "50s"} linear infinite`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {doubled.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SolverMarquee({ count = 370 }: { count?: number }) {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-950">
      <style>{`@keyframes polysim-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Built for researchers, engineers &amp; students worldwide
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {count}+ real simulators. Runs in your browser — no install required.
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          The models taught and used across physics, aerospace, quantum, climate, robotics, and quantitative finance —
          each one a live, runnable page.
        </p>
      </div>
      <div className="mt-6 space-y-3">
        <Row items={ROW_A} />
        <Row items={ROW_B} reverse />
      </div>
      <div className="mt-6 text-center">
        <Link href="/studio" className="text-sm font-semibold text-cyan-600 hover:underline dark:text-cyan-400">
          Browse all {count}+ simulators →
        </Link>
      </div>
    </section>
  );
}
