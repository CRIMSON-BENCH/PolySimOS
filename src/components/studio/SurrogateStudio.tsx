"use client";

import { useMemo, useRef, useState } from "react";
import {
  trainSurrogate,
  predictSurrogate,
  evaluateSurrogate,
  sampleGrid,
  SurrogateModel,
  Sample,
} from "@/lib/engines/surrogate";
import {
  DEFAULT_PARTICLE_PARAMS,
  seedParticles,
  stepParticles,
  particleMetrics,
} from "@/lib/engines/particles";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { gridSteps: number; gravity: number; restitution: number }> = {
  "Low gravity": { gridSteps: 6, gravity: 50, restitution: 0.85 },
  "Earth-like": { gridSteps: 6, gravity: 150, restitution: 0.7 },
  "Bouncy": { gridSteps: 8, gravity: 250, restitution: 0.98 },
  "Fine grid": { gridSteps: 10, gravity: 300, restitution: 0.5 },
};

// Ground-truth solver: run the real particle sim to a fixed horizon and return
// the final kinetic energy for a given (gravity, restitution) parameter pair.
function solveParticles(params: number[]): number[] {
  const [gravityY, restitution] = params;
  const p = { ...DEFAULT_PARTICLE_PARAMS, gravityY, restitution, pairwiseG: 0, width: 400, height: 300 };
  const parts = seedParticles(60, p, 123); // fixed seed => deterministic
  const dt = 1 / 60;
  for (let i = 0; i < 240; i++) stepParticles(parts, p, dt);
  return [particleMetrics(parts).kineticEnergy / 1000];
}

export function SurrogateStudio() {
  const [{ gridSteps, gravity, restitution }, update] = useShareableNumbers({ gridSteps: 6, gravity: 150, restitution: 0.85 });
  const [trained, setTrained] = useState<{ model: SurrogateModel; trainSamples: Sample[]; trainMs: number; r2: number; rmse: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [predictMs, setPredictMs] = useState(0);
  const [solveMs, setSolveMs] = useState(0);
  const perfRef = useRef(0);

  const train = () => {
    setBusy(true);
    // build training grid over (gravity 0..400, restitution 0.3..1)
    const t0 = perfNow();
    const samples = sampleGrid(
      [
        { min: 0, max: 400, steps: gridSteps },
        { min: 0.3, max: 1.0, steps: gridSteps },
      ],
      solveParticles
    );
    const model = trainSurrogate(samples, 1e-6);
    const trainMs = perfNow() - t0;
    // hold-out test grid (offset) for honest accuracy
    const test = sampleGrid(
      [
        { min: 20, max: 380, steps: 5 },
        { min: 0.35, max: 0.95, steps: 5 },
      ],
      solveParticles
    );
    const { r2, rmse } = evaluateSurrogate(model, test);
    setTrained({ model, trainSamples: samples, trainMs, r2: r2[0], rmse: rmse[0] });
    setBusy(false);
  };

  const prediction = useMemo(() => {
    if (!trained) return null;
    const t0 = perfNow();
    const pred = predictSurrogate(trained.model, [gravity, restitution])[0];
    perfRef.current = perfNow() - t0;
    return pred;
  }, [trained, gravity, restitution]);

  const groundTruth = () => {
    const t0 = perfNow();
    const gt = solveParticles([gravity, restitution])[0];
    setSolveMs(perfNow() - t0);
    setPredictMs(perfRef.current);
    return gt;
  };
  const [gt, setGt] = useState<number | null>(null);

  const explain = !trained
    ? `Set the training grid density, then train — a finer n×n grid samples the real solver more times but usually lifts the test R² closer to 1.`
    : trained.r2 > 0.98
    ? `Test R² of ${trained.r2.toFixed(3)} means the surrogate reproduces the solver almost exactly, so its instant predictions are trustworthy across the whole gravity–restitution surface.`
    : trained.r2 > 0.9
    ? `Test R² of ${trained.r2.toFixed(3)} is solid but imperfect — expect small errors far from the ${trained.trainSamples.length} training points; a denser grid would tighten it.`
    : `Test R² of ${trained.r2.toFixed(3)} is low: the ${trained.trainSamples.length}-point grid is too coarse for this response surface — raise the grid density and retrain.`;

  const code = `import numpy as np
from scipy.interpolate import RBFInterpolator
# sample the real solver on an n x n grid, then fit an RBF surrogate
grid_steps, gravity, restitution = ${gridSteps}, ${gravity}, ${restitution}
G = np.linspace(0, 400, grid_steps); R = np.linspace(0.3, 1.0, grid_steps)
X = np.array([[g, r] for g in G for r in R])
y = np.array([solve_particles(g, r) for g, r in X])  # your ground-truth solver
model = RBFInterpolator(X, y, smoothing=1e-6)
print("surrogate prediction", model([[gravity, restitution]]))`;

  return (
    <StudioChrome
      title="AI Surrogate Studio"
      tagline="RBF surrogate trained on our own solver"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">
            Train a surrogate model on our real particle solver, then get near-instant predictions
            instead of re-running the full simulation — the same idea behind PhysicsX and Neural Concept,
            running in your browser.
          </p>
          <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => { update(PRESETS[label]); setGt(null); }} />
          <Slider label="Training grid (n×n)" value={gridSteps} min={4} max={10} step={1} onChange={(v) => update({ gridSteps: v })} />
          <button
            onClick={train}
            disabled={busy}
            className="mb-4 w-full rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
          >
            {busy ? "Training…" : trained ? "Retrain surrogate" : "Train surrogate"}
          </button>
          {trained && (
            <>
              <Slider label="Gravity" value={gravity} min={0} max={400} step={5} onChange={(v) => { update({ gravity: v }); setGt(null); }} />
              <Slider label="Restitution" value={restitution} min={0.3} max={1} step={0.01} onChange={(v) => { update({ restitution: v }); setGt(null); }} />
              <button
                onClick={() => setGt(groundTruth())}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Verify vs full solver
              </button>
            </>
          )}
          <ShareBar code={code} />
        </div>
      }
      inspector={
        <div>
          {trained ? (
            <>
              <Stat label="Train samples" value={String(trained.trainSamples.length)} />
              <Stat label="Train time" value={`${trained.trainMs.toFixed(1)} ms`} />
              <Stat label="Test R²" value={trained.r2.toFixed(4)} />
              <Stat label="Test RMSE" value={trained.rmse.toFixed(4)} />
              <Stat label="Surrogate prediction" value={prediction != null ? prediction.toFixed(3) : "—"} />
              {gt != null && (
                <>
                  <Stat label="Full-solver truth" value={gt.toFixed(3)} />
                  <Stat label="Abs error" value={prediction != null ? Math.abs(prediction - gt).toFixed(3) : "—"} />
                  <Stat label="Surrogate time" value={`${predictMs.toFixed(3)} ms`} />
                  <Stat label="Full-solve time" value={`${solveMs.toFixed(1)} ms`} />
                  <Stat label="Speed-up" value={predictMs > 0 ? `${Math.round(solveMs / predictMs)}×` : "—"} />
                </>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">Train the surrogate to see accuracy metrics.</p>
          )}
          <Equation
            tex={
              trained
                ? `\\hat{y}(x) = \\sum_{i=1}^{${trained.trainSamples.length}} w_i\\,\\phi\\!\\left(\\lVert x - x_i \\rVert\\right),\\quad \\mathrm{RMSE} = ${trained.rmse.toFixed(4)}`
                : `\\hat{y}(x) = \\sum_{i=1}^{N} w_i\\,\\phi\\!\\left(\\lVert x - x_i \\rVert\\right)`
            }
          />
        </div>
      }
    >
      <SurrogateHeatmap trained={trained} gx={gravity} rx={restitution} />
    </StudioChrome>
  );
}

function SurrogateHeatmap({ trained, gx, rx }: { trained: { model: SurrogateModel } | null; gx: number; rx: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 760, H = 480;
  useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H);
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);
    if (!trained) {
      ctx.fillStyle = "#475569";
      ctx.font = "14px system-ui";
      ctx.fillText("Train the surrogate to render the instant-preview response surface.", 40, H / 2);
      return;
    }
    const cols = 90, rows = 60;
    let min = Infinity, max = -Infinity;
    const grid: number[] = [];
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const g = (i / (cols - 1)) * 400;
        const r = 0.3 + (j / (rows - 1)) * 0.7;
        const v = predictSurrogate(trained.model, [g, r])[0];
        grid.push(v);
        min = Math.min(min, v); max = Math.max(max, v);
      }
    }
    const cw = W / cols, ch = H / rows;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const t = (grid[j * cols + i] - min) / (max - min || 1);
        const hue = 220 - t * 200;
        ctx.fillStyle = `hsl(${hue}, 85%, ${25 + t * 45}%)`;
        ctx.fillRect(i * cw, H - (j + 1) * ch, cw + 1, ch + 1);
      }
    }
    // marker for current params
    const mx = (gx / 400) * W;
    const my = H - ((rx - 0.3) / 0.7) * H;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx, my, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px system-ui";
    ctx.fillText("gravity →", W - 90, H - 10);
    ctx.save();
    ctx.translate(14, 60); ctx.rotate(-Math.PI / 2);
    ctx.fillText("restitution →", 0, 0);
    ctx.restore();
  }, [trained, gx, rx]);
  return <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />;
}

function perfNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
