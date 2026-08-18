import Link from "next/link";

// Shared visual shell for every live Studio simulation.
export function StudioChrome({
  title,
  tagline,
  children,
  controls,
  inspector,
}: {
  title: string;
  tagline: string;
  children: React.ReactNode; // the canvas
  controls: React.ReactNode;
  inspector?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/[0.02] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-white px-4 py-3 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
          </span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</span>
          <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">Live</span>
        </div>
        <span className="hidden text-xs text-slate-400 sm:block">{tagline}</span>
      </div>
      <div className="grid gap-0 lg:grid-cols-[1fr_18rem]">
        <div className="grid-bg relative min-h-[360px] overflow-hidden bg-slate-950 p-3">{children}</div>
        <div className="border-t border-slate-200 p-4 lg:border-l lg:border-t-0 dark:border-slate-800">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Controls</p>
          {controls}
          {inspector && (
            <>
              <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Data Inspector</p>
              {inspector}
            </>
          )}
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-2 dark:border-slate-800">
        <p className="text-xs text-slate-400">
          Runs locally in your browser — free forever.{" "}
          <Link href="/pricing" className="text-cyan-600 hover:underline dark:text-cyan-400">
            Scale to the cloud
          </Link>{" "}
          when reality gets heavy.
        </p>
      </div>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-3 block">
      <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-slate-500">{Math.round(value * 1000) / 1000}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-500"
      />
    </label>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1 text-xs last:border-0 dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}
