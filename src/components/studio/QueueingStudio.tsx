"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { lambda: number; mu: number }> = {
  "Light load": { lambda: 0.3, mu: 1.0 },
  "Moderate (ρ≈0.7)": { lambda: 0.7, mu: 1.0 },
  "Heavy (ρ≈0.9)": { lambda: 0.9, mu: 1.0 },
  "Overloaded (ρ>1)": { lambda: 1.3, mu: 1.0 },
};

// M/M/1 queue metrics + live simulation.
export function QueueingStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ lambda, mu }, update] = useShareableNumbers({ lambda: 0.7, mu: 1.0 });
  const [running, setRunning] = useState(true);
  const queue = useRef(0);
  const [display, setDisplay] = useState(0);

  const rho = lambda / mu; const stable = rho < 1;
  const L = stable ? rho / (1 - rho) : Infinity; const W = stable ? 1 / (mu - lambda) : Infinity; const Lq = stable ? rho * rho / (1 - rho) : Infinity;

  useEffect(() => {
    if (!running) return; let raf = 0; let s = 21; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const loop = () => {
      if (rnd() < lambda * 0.05) queue.current++;
      if (queue.current > 0 && rnd() < mu * 0.05) queue.current--;
      if (queue.current > 60) queue.current = 60;
      setDisplay(queue.current);
      const ctx = hidpi(canvasRef.current!, 540, 240); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 540, 240);
      // server
      ctx.fillStyle = "#a3e635"; ctx.fillRect(460, 100, 50, 50); ctx.fillStyle = "#0b1220"; ctx.font = "11px sans-serif"; ctx.fillText("server", 468, 128);
      // queue of customers
      for (let i = 0; i < Math.min(queue.current, 30); i++) { ctx.fillStyle = i === 0 ? "#f472b6" : "#22d3ee"; ctx.beginPath(); ctx.arc(440 - i * 14, 125, 5, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#94a3b8"; ctx.fillText(`in system: ${queue.current}`, 20, 30);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [running, lambda, mu]);

  const explain = !stable
    ? `With λ=${lambda} ≥ μ=${mu} the utilization ρ=${rho.toFixed(2)} exceeds 1: arrivals outpace service, so the queue is unstable and grows without bound. No steady-state average exists — you need a faster server or fewer arrivals.`
    : rho >= 0.9
    ? `Near saturation: ρ=${rho.toFixed(2)} sits just below 1. By Little's law L=λW, the average in system L≈${L.toFixed(1)} and wait W≈${W.toFixed(1)} blow up nonlinearly — a tiny bump in λ now causes a huge jump in delay. This is why real systems avoid running this hot.`
    : rho >= 0.6
    ? `Moderate load: ρ=${rho.toFixed(2)}. On average L≈${L.toFixed(1)} in the system waiting W≈${W.toFixed(1)}. You are on the steep part of the curve — pushing ρ toward 1 makes waits climb far faster than the extra traffic would suggest.`
    : `Light load: ρ=${rho.toFixed(2)}. The server is mostly idle, so L≈${L.toFixed(1)} and wait W≈${W.toFixed(1)} stay short. There is ample headroom before the ρ→1 blow-up kicks in.`;

  const code = `# M/M/1 queue: closed-form metrics
lam, mu = ${lambda}, ${mu}      # arrival rate, service rate
rho = lam / mu                  # utilization
if rho >= 1:
    print("unstable: rho >=1, queue grows without bound")
else:
    L  = rho / (1 - rho)        # avg number in system
    Lq = rho**2 / (1 - rho)     # avg number waiting in queue
    W  = 1 / (mu - lam)         # avg time in system
    Wq = rho / (mu - lam)       # avg time waiting
    print(f"rho={rho:.3f}  L={L:.3f}  Lq={Lq:.3f}  W={W:.3f}  Wq={Wq:.3f}")
    # Little's law check: L == lam * W
    assert abs(L - lam * W) < 1e-9`;

  return (
    <StudioChrome title="M/M/1 Queue" tagline="queueing theory"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Arrival rate λ" value={lambda} min={0.1} max={1.5} step={0.05} onChange={(v) => update({ lambda: v })} />
        <Slider label="Service rate μ" value={mu} min={0.3} max={2} step={0.05} onChange={(v) => update({ mu: v })} />
        <button onClick={() => setRunning((r) => !r)} className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white">{running ? "Pause" : "Run"}</button>
        <p className="mt-3 text-xs text-slate-500">The M/M/1 queue models a single server with random arrivals and service — a checkout, help desk, or router. The utilization ρ = λ/μ decides everything: as it approaches 1, the average wait and queue length explode toward infinity. This nonlinear blow-up is why systems run at, say, 80% and not 99% capacity.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Utilization ρ" value={rho.toFixed(2)} />
        <Stat label="Avg in system L" value={stable ? L.toFixed(2) : "∞"} />
        <Stat label="Avg in queue Lq" value={stable ? Lq.toFixed(2) : "∞"} />
        <Stat label="Avg wait W" value={stable ? `${W.toFixed(2)}` : "∞"} />
        <Stat label="Live count" value={String(display)} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={240} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
