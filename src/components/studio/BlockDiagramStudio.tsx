"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { TransportBar, useTransport } from "./Transport";
import { hidpi, PALETTE } from "@/lib/studioKit";

// ---------------------------------------------------------------------------
// Block Diagram Simulator — a browser-native alternative to Simulink.
// Continuous-time block diagrams solved with fixed-step RK4. State-holding
// blocks (Integrator, Transfer Function) break algebraic loops, so closed
// feedback loops are solvable. Pure-algebraic loops are detected and warned.
// ---------------------------------------------------------------------------

const W = 760;
const H = 480;
const DT = 0.01; // integration step (s)
const BASE = 6; // RK4 substeps per frame per speed unit

type BlockType =
  | "step"
  | "sine"
  | "const"
  | "sum"
  | "gain"
  | "integrator"
  | "tf"
  | "saturation"
  | "scope";

interface Block {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  p: Record<string, number>;
}
interface Wire {
  id: string;
  from: string;
  fromPort: number;
  to: string;
  toPort: number;
}
interface Model {
  blocks: Block[];
  wires: Wire[];
}
type SimState = {
  t: number;
  states: Record<string, number>;
  scopes: Record<string, { t: number[]; s: number[][] }>;
};

const IN: Record<BlockType, number> = { step: 0, sine: 0, const: 0, sum: 2, gain: 1, integrator: 1, tf: 1, saturation: 1, scope: 2 };
const OUT: Record<BlockType, number> = { step: 1, sine: 1, const: 1, sum: 1, gain: 1, integrator: 1, tf: 1, saturation: 1, scope: 0 };

const dims = (t: BlockType) => (t === "scope" ? { w: 230, h: 140 } : { w: 96, h: 52 });
const inPortPos = (b: Block, i: number) => {
  const { h } = dims(b.type);
  const n = IN[b.type];
  return { x: b.x, y: b.y + (h * (i + 1)) / (n + 1) };
};
const outPortPos = (b: Block) => {
  const { w, h } = dims(b.type);
  return { x: b.x + w, y: b.y + h / 2 };
};
const fmt = (x: number) => (Math.abs(x) >= 100 || Number.isInteger(x) ? x.toFixed(x >= 100 ? 0 : 0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2));

// ---------------------------------------------------------------------------
// Simulation core
// ---------------------------------------------------------------------------

// Evaluate every block output for a given state vector and time. Sources and
// state-holding blocks resolve immediately; algebraic blocks are computed by
// memoized recursion (topological order), with cycle detection for pure
// algebraic loops (which have no unique solution).
function makeEval(blocks: Block[], wireFrom: Map<string, string>, t: number, states: Record<string, number>) {
  const bmap = new Map(blocks.map((b) => [b.id, b]));
  const cache = new Map<string, number>();
  const visiting = new Set<string>();
  let algLoop = false;

  const inVal = (id: string, port: number): number => {
    const src = wireFrom.get(id + ":" + port);
    return src === undefined ? 0 : out(src);
  };

  function out(id: string): number {
    const cached = cache.get(id);
    if (cached !== undefined) return cached;
    const b = bmap.get(id);
    if (!b) return 0;
    let v = 0;
    switch (b.type) {
      case "step":
        v = t >= (b.p.t0 ?? 0) ? (b.p.amp ?? 1) : 0;
        break;
      case "sine":
        v = (b.p.amp ?? 1) * Math.sin(2 * Math.PI * (b.p.freq ?? 0.2) * t);
        break;
      case "const":
        v = b.p.value ?? 1;
        break;
      case "integrator":
      case "tf":
        v = states[id] ?? 0;
        break;
      default: {
        if (visiting.has(id)) {
          algLoop = true;
          return 0; // break the loop with a provisional value
        }
        visiting.add(id);
        if (b.type === "gain") v = (b.p.k ?? 1) * inVal(id, 0);
        else if (b.type === "sum") v = (b.p.s0 ?? 1) * inVal(id, 0) + (b.p.s1 ?? -1) * inVal(id, 1);
        else if (b.type === "saturation") v = Math.max(b.p.lo ?? -1, Math.min(b.p.hi ?? 1, inVal(id, 0)));
        else v = 0; // scope: no output
        visiting.delete(id);
      }
    }
    cache.set(id, v);
    return v;
  }

  return { out, inVal, hadAlgLoop: () => algLoop };
}

// Derivatives of the state vector (integrator & TF states) at (states, t).
function derivs(blocks: Block[], wireFrom: Map<string, string>, t: number, states: Record<string, number>) {
  const ev = makeEval(blocks, wireFrom, t, states);
  const d: Record<string, number> = {};
  for (const b of blocks) {
    if (b.type === "integrator") d[b.id] = ev.inVal(b.id, 0);
    else if (b.type === "tf") {
      const tau = Math.max(1e-4, b.p.tau ?? 1);
      d[b.id] = (ev.inVal(b.id, 0) - (states[b.id] ?? 0)) / tau;
    }
  }
  return d;
}

function rk4(blocks: Block[], wireFrom: Map<string, string>, states: Record<string, number>, t: number, h: number, stateIds: string[]) {
  const add = (base: Record<string, number>, k: Record<string, number>, f: number) => {
    const o: Record<string, number> = {};
    for (const id of stateIds) o[id] = base[id] + (k[id] ?? 0) * f;
    return o;
  };
  const k1 = derivs(blocks, wireFrom, t, states);
  const k2 = derivs(blocks, wireFrom, t + h / 2, add(states, k1, h / 2));
  const k3 = derivs(blocks, wireFrom, t + h / 2, add(states, k2, h / 2));
  const k4 = derivs(blocks, wireFrom, t + h, add(states, k3, h));
  const o: Record<string, number> = {};
  for (const id of stateIds) o[id] = states[id] + (h / 6) * ((k1[id] ?? 0) + 2 * (k2[id] ?? 0) + 2 * (k3[id] ?? 0) + (k4[id] ?? 0));
  return o;
}

// ---------------------------------------------------------------------------
// Presets — pre-wired, correct diagrams. This is the headline demo value.
// ---------------------------------------------------------------------------

type PresetKey = "lag" | "pid" | "osc" | "msd";

function buildPreset(key: PresetKey): Model {
  const b = (id: string, type: BlockType, x: number, y: number, p: Record<string, number> = {}): Block => ({ id, type, x, y, p: { ...p } });
  const w = (from: string, fromPort: number, to: string, toPort: number): Wire => ({ id: `${from}.${fromPort}-${to}.${toPort}`, from, fromPort, to, toPort });

  if (key === "lag") {
    return {
      blocks: [b("src", "step", 30, 200, { t0: 1, amp: 1 }), b("tf", "tf", 220, 200, { tau: 2 }), b("scope", "scope", 430, 130, {})],
      wires: [w("src", 0, "tf", 0), w("tf", 0, "scope", 0)],
    };
  }
  if (key === "pid") {
    return {
      blocks: [
        b("src", "step", 10, 55, { t0: 0.5, amp: 1 }),
        b("sum1", "sum", 150, 60, { s0: 1, s1: -1 }),
        b("gainP", "gain", 300, 20, { k: 1 }),
        b("gainI", "gain", 300, 135, { k: 3 }),
        b("integI", "integrator", 430, 135, { x0: 0 }),
        b("sumPID", "sum", 545, 45, { s0: 1, s1: 1 }),
        b("plant", "tf", 655, 45, { tau: 1 }),
        b("scope", "scope", 290, 300, {}),
      ],
      wires: [
        w("src", 0, "sum1", 0),
        w("sum1", 0, "gainP", 0),
        w("sum1", 0, "gainI", 0),
        w("gainP", 0, "sumPID", 0),
        w("gainI", 0, "integI", 0),
        w("integI", 0, "sumPID", 1),
        w("sumPID", 0, "plant", 0),
        w("plant", 0, "scope", 0),
        w("src", 0, "scope", 1),
        w("plant", 0, "sum1", 1), // feedback
      ],
    };
  }
  if (key === "osc") {
    return {
      blocks: [
        b("gain", "gain", 70, 120, { k: -4 }),
        b("integV", "integrator", 210, 120, { x0: 0 }),
        b("integX", "integrator", 370, 120, { x0: 1 }),
        b("scope", "scope", 210, 260, {}),
      ],
      wires: [w("gain", 0, "integV", 0), w("integV", 0, "integX", 0), w("integX", 0, "gain", 0), w("integX", 0, "scope", 0)],
    };
  }
  // msd
  return {
    blocks: [
      b("src", "step", 10, 55, { t0: 0.5, amp: 1 }),
      b("sum1", "sum", 145, 60, { s0: 1, s1: -1 }),
      b("gainM", "gain", 285, 60, { k: 1 }), // 1/m
      b("integV", "integrator", 415, 60, { x0: 0 }),
      b("integX", "integrator", 540, 60, { x0: 0 }),
      b("gainK", "gain", 415, 200, { k: 4 }), // spring
      b("gainC", "gain", 260, 200, { k: 0.5 }), // damper
      b("sumFB", "sum", 130, 200, { s0: 1, s1: 1 }),
      b("scope", "scope", 300, 305, {}),
    ],
    wires: [
      w("src", 0, "sum1", 0),
      w("sum1", 0, "gainM", 0),
      w("gainM", 0, "integV", 0),
      w("integV", 0, "integX", 0),
      w("integX", 0, "gainK", 0),
      w("integV", 0, "gainC", 0),
      w("gainK", 0, "sumFB", 0),
      w("gainC", 0, "sumFB", 1),
      w("sumFB", 0, "sum1", 1),
      w("integX", 0, "scope", 0),
    ],
  };
}

const PRESET_META: Record<PresetKey, { label: string; hint: string }> = {
  lag: { label: "First-order lag", hint: "Step → 1/(τs+1) → Scope" },
  pid: { label: "Closed-loop PID", hint: "Setpoint → PI controller → plant, with feedback" },
  osc: { label: "Harmonic oscillator", hint: "Two integrators + negative gain → a sine" },
  msd: { label: "Mass–spring–damper", hint: "Force → 1/m → ∫ → ∫ with spring/damper feedback" },
};

// Quick tuning knobs bound to specific blocks of the active preset.
const KNOBS: Record<PresetKey, { label: string; id: string; key: string; min: number; max: number; step: number }[]> = {
  lag: [{ label: "τ  time constant", id: "tf", key: "tau", min: 0.2, max: 5, step: 0.1 }],
  pid: [
    { label: "Kp  proportional", id: "gainP", key: "k", min: 0, max: 8, step: 0.1 },
    { label: "Ki  integral", id: "gainI", key: "k", min: 0, max: 6, step: 0.1 },
    { label: "τ  plant lag", id: "plant", key: "tau", min: 0.2, max: 3, step: 0.1 },
  ],
  osc: [{ label: "k  restoring (−ω²)", id: "gain", key: "k", min: -14, max: -0.5, step: 0.5 }],
  msd: [
    { label: "1/m  inverse mass", id: "gainM", key: "k", min: 0.2, max: 2, step: 0.1 },
    { label: "k  spring", id: "gainK", key: "k", min: 0.5, max: 12, step: 0.5 },
    { label: "c  damper", id: "gainC", key: "k", min: 0, max: 4, step: 0.1 },
  ],
};

const defaultParams = (t: BlockType): Record<string, number> => {
  switch (t) {
    case "step":
      return { t0: 1, amp: 1 };
    case "sine":
      return { amp: 1, freq: 0.2 };
    case "const":
      return { value: 1 };
    case "sum":
      return { s0: 1, s1: -1 };
    case "gain":
      return { k: 1 };
    case "integrator":
      return { x0: 0 };
    case "tf":
      return { tau: 1 };
    case "saturation":
      return { lo: -1, hi: 1 };
    default:
      return {};
  }
};

const EDIT: Record<BlockType, { key: string; label: string; min: number; max: number; step: number; note?: string }[]> = {
  step: [
    { key: "t0", label: "Step time", min: 0, max: 5, step: 0.1 },
    { key: "amp", label: "Amplitude", min: -5, max: 5, step: 0.1 },
  ],
  sine: [
    { key: "amp", label: "Amplitude", min: 0, max: 5, step: 0.1 },
    { key: "freq", label: "Frequency (Hz)", min: 0.05, max: 2, step: 0.05 },
  ],
  const: [{ key: "value", label: "Value", min: -5, max: 5, step: 0.1 }],
  gain: [{ key: "k", label: "Gain k", min: -14, max: 14, step: 0.1 }],
  integrator: [{ key: "x0", label: "Initial value", min: -5, max: 5, step: 0.1, note: "applied on Reset" }],
  tf: [{ key: "tau", label: "τ (time constant)", min: 0.1, max: 5, step: 0.1 }],
  saturation: [
    { key: "lo", label: "Lower limit", min: -10, max: 0, step: 0.1 },
    { key: "hi", label: "Upper limit", min: 0, max: 10, step: 0.1 },
  ],
  sum: [],
  scope: [],
};

const TYPE_LABEL: Record<BlockType, string> = {
  step: "Step", sine: "Sine", const: "Const", sum: "Sum", gain: "Gain", integrator: "Integrator", tf: "Transfer Fn", saturation: "Saturation", scope: "Scope",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BlockDiagramStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<Model>(buildPreset("lag"));
  const sim = useRef<SimState>({ t: 0, states: {}, scopes: {} });
  const counter = useRef(0);
  const unstable = useRef(false);

  const [presetKey, setPresetKey] = useState<PresetKey>("lag");
  const [dirty, setDirty] = useState(false);
  const [rev, setRev] = useState(0); // bump to re-render controls after model edits
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  const [windowSec, setWindowSec] = useState(12);
  const [warn, setWarn] = useState<string>("");

  const bump = () => setRev((r) => r + 1);

  // Refs mirrored for the rAF draw loop (which runs outside React).
  const selIdRef = useRef(selectedId);
  selIdRef.current = selectedId;
  const selWireRef = useRef(selectedWire);
  selWireRef.current = selectedWire;
  const windowRef = useRef(windowSec);
  windowRef.current = windowSec;

  // Live pointer-interaction state (read by the rAF draw loop).
  type Act = { mode: "none" | "drag" | "wire"; id?: string; ox?: number; oy?: number; from?: string; fromPort?: number; x?: number; y?: number };
  const act = useRef<Act>({ mode: "none" });

  const findBlock = (id: string | null) => (id ? modelRef.current.blocks.find((b) => b.id === id) : undefined);
  const num = (id: string, key: string, def = 0) => findBlock(id)?.p[key] ?? def;

  // ---- simulation lifecycle -------------------------------------------------
  const reset = () => {
    const states: Record<string, number> = {};
    const scopes: Record<string, { t: number[]; s: number[][] }> = {};
    for (const b of modelRef.current.blocks) {
      if (b.type === "integrator") states[b.id] = b.p.x0 ?? 0;
      else if (b.type === "tf") states[b.id] = 0;
      else if (b.type === "scope") scopes[b.id] = { t: [], s: [[], []] };
    }
    sim.current = { t: 0, states, scopes };
    unstable.current = false;
    draw();
  };

  // Keep sim state consistent with the model after structural edits (no full reset).
  const reconcile = () => {
    const S = sim.current;
    const ids = new Set<string>();
    for (const b of modelRef.current.blocks) {
      if (b.type === "integrator" || b.type === "tf") {
        ids.add(b.id);
        if (S.states[b.id] === undefined) S.states[b.id] = b.type === "integrator" ? b.p.x0 ?? 0 : 0;
      }
      if (b.type === "scope" && !S.scopes[b.id]) S.scopes[b.id] = { t: [], s: [[], []] };
    }
    for (const id of Object.keys(S.states)) if (!ids.has(id)) delete S.states[id];
    for (const id of Object.keys(S.scopes)) if (!modelRef.current.blocks.some((b) => b.id === id && b.type === "scope")) delete S.scopes[id];
  };

  const applyPreset = (key: PresetKey) => {
    modelRef.current = buildPreset(key);
    setPresetKey(key);
    setDirty(false);
    setSelectedId(null);
    setSelectedWire(null);
    reset();
    bump();
  };

  // ---- per-frame physics + record ------------------------------------------
  const frame = (steps: number) => {
    const m = modelRef.current;
    const wireFrom = new Map(m.wires.map((wr) => [wr.to + ":" + wr.toPort, wr.from]));
    const stateIds = m.blocks.filter((b) => b.type === "integrator" || b.type === "tf").map((b) => b.id);
    const S = sim.current;
    const sub = steps * BASE;
    for (let i = 0; i < sub; i++) {
      S.states = rk4(m.blocks, wireFrom, S.states, S.t, DT, stateIds);
      S.t += DT;
      for (const id of stateIds) {
        if (!Number.isFinite(S.states[id])) {
          S.states[id] = 0;
          unstable.current = true;
        }
      }
      const ev = makeEval(m.blocks, wireFrom, S.t, S.states);
      const wmin = S.t - windowRef.current;
      for (const b of m.blocks) {
        if (b.type !== "scope") continue;
        const buf = S.scopes[b.id] ?? (S.scopes[b.id] = { t: [], s: [[], []] });
        buf.t.push(S.t);
        buf.s[0].push(wireFrom.has(b.id + ":0") ? ev.inVal(b.id, 0) : NaN);
        buf.s[1].push(wireFrom.has(b.id + ":1") ? ev.inVal(b.id, 1) : NaN);
        while (buf.t.length && buf.t[0] < wmin) {
          buf.t.shift();
          buf.s[0].shift();
          buf.s[1].shift();
        }
      }
    }
    draw();
  };

  const t = useTransport(frame);

  // ---- drawing --------------------------------------------------------------
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = hidpi(canvas, W, H);
    const m = modelRef.current;
    const S = sim.current;

    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);
    // faint dot grid
    ctx.fillStyle = "#0f172a";
    for (let gx = 20; gx < W; gx += 28) for (let gy = 20; gy < H; gy += 28) ctx.fillRect(gx, gy, 1, 1);

    const bmap = new Map(m.blocks.map((b) => [b.id, b]));

    // wires
    for (const wr of m.wires) {
      const src = bmap.get(wr.from);
      const dst = bmap.get(wr.to);
      if (!src || !dst) continue;
      const p0 = outPortPos(src);
      const p1 = inPortPos(dst, wr.toPort);
      const dx = Math.max(30, (p1.x - p0.x) * 0.5);
      const sel = wr.id === selWireRef.current;
      ctx.strokeStyle = sel ? "#f472b6" : "#475569";
      ctx.lineWidth = sel ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.bezierCurveTo(p0.x + dx, p0.y, p1.x - dx, p1.y, p1.x, p1.y);
      ctx.stroke();
      // arrowhead
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p1.x - 7, p1.y - 4);
      ctx.lineTo(p1.x - 7, p1.y + 4);
      ctx.closePath();
      ctx.fill();
    }

    // pending wire
    const a = act.current;
    if (a.mode === "wire" && a.from !== undefined && a.x !== undefined && a.y !== undefined) {
      const src = bmap.get(a.from);
      if (src) {
        const p0 = outPortPos(src);
        ctx.strokeStyle = PALETTE.primary;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(a.x, a.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // blocks
    for (const b of m.blocks) {
      const { w, h } = dims(b.type);
      const selected = b.id === selIdRef.current;
      ctx.fillStyle = "#0b1220";
      ctx.strokeStyle = selected ? PALETTE.primary : "#334155";
      ctx.lineWidth = selected ? 2.5 : 1.5;
      roundRect(ctx, b.x, b.y, w, h, 8);
      ctx.fill();
      ctx.stroke();

      if (b.type === "scope") {
        drawScope(ctx, b, S);
      } else {
        // labels
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const cx = b.x + w / 2;
        const lines = blockLabel(b);
        const lh = 13;
        const total = (lines.length - 1) * lh;
        lines.forEach((ln, i) => {
          ctx.fillStyle = i === 0 ? "#e2e8f0" : PALETTE.accent;
          ctx.font = i === 0 ? "bold 11px ui-sans-serif, system-ui, sans-serif" : "10px ui-monospace, monospace";
          ctx.fillText(ln, cx, b.y + h / 2 - total / 2 + i * lh);
        });
      }

      // ports
      for (let i = 0; i < IN[b.type]; i++) {
        const p = inPortPos(b, i);
        ctx.fillStyle = PALETTE.accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 7);
        ctx.fill();
        if (b.type === "sum") {
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((i === 0 ? b.p.s0 : b.p.s1) >= 0 ? "+" : "−", p.x + 12, p.y);
        }
      }
      if (OUT[b.type] > 0) {
        const p = outPortPos(b);
        ctx.fillStyle = PALETTE.primary;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 7);
        ctx.fill();
      }
    }

    // hint
    ctx.fillStyle = "#64748b";
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Drag blocks · click an output port then an input port to wire · click a block or wire to select", 12, H - 10);

    // time readout
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = "right";
    ctx.fillText(`t = ${S.t.toFixed(2)} s`, W - 12, 18);
  };

  const drawScope = (ctx: CanvasRenderingContext2D, b: Block, S: SimState) => {
    const { w, h } = dims("scope");
    const padL = 8, padR = 8, padT = 18, padB = 8;
    const x0 = b.x + padL, y0 = b.y + padT, pw = w - padL - padR, ph = h - padT - padB;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Scope", b.x + 8, b.y + 13);

    ctx.fillStyle = "#020617";
    ctx.fillRect(x0, y0, pw, ph);

    const buf = S.scopes[b.id];
    const tmax = S.t;
    const tmin = tmax - windowRef.current;

    // autoscale
    let lo = Infinity, hi = -Infinity;
    const connected = [buf && buf.s[0].some((v) => Number.isFinite(v)), buf && buf.s[1].some((v) => Number.isFinite(v))];
    if (buf) {
      for (let k = 0; k < 2; k++) if (connected[k]) for (const v of buf.s[k]) if (Number.isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) { lo = -1; hi = 1; }
    if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.12;
    lo -= pad; hi += pad;

    const mapX = (tt: number) => x0 + ((tt - tmin) / (tmax - tmin || 1)) * pw;
    const mapY = (v: number) => y0 + ph - ((v - lo) / (hi - lo)) * ph;

    // grid + zero line
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let g = 1; g < 4; g++) {
      const yy = y0 + (ph * g) / 4;
      ctx.beginPath();
      ctx.moveTo(x0, yy);
      ctx.lineTo(x0 + pw, yy);
      ctx.stroke();
    }
    if (lo < 0 && hi > 0) {
      ctx.strokeStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(x0, mapY(0));
      ctx.lineTo(x0 + pw, mapY(0));
      ctx.stroke();
    }

    // series
    if (buf) {
      for (let k = 0; k < 2; k++) {
        if (!connected[k]) continue;
        ctx.strokeStyle = PALETTE.series[k];
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < buf.t.length; i++) {
          const v = buf.s[k][i];
          if (!Number.isFinite(v)) { started = false; continue; }
          const px = mapX(buf.t[i]);
          const py = mapY(v);
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        }
        ctx.stroke();
        // latest value dot + label
        for (let i = buf.t.length - 1; i >= 0; i--) {
          if (Number.isFinite(buf.s[k][i])) {
            const py = mapY(buf.s[k][i]);
            ctx.fillStyle = PALETTE.series[k];
            ctx.beginPath();
            ctx.arc(x0 + pw, py, 2.5, 0, 7);
            ctx.fill();
            ctx.font = "9px ui-monospace, monospace";
            ctx.textAlign = "right";
            ctx.fillText(fmt(buf.s[k][i]), x0 + pw - 4, y0 + 9 + k * 10);
            break;
          }
        }
      }
    }
    // y range labels
    ctx.fillStyle = "#475569";
    ctx.font = "8px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(fmt(hi), x0 + 2, y0 + 8);
    ctx.fillText(fmt(lo), x0 + 2, y0 + ph - 2);
  };

  // ---- pointer interaction --------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const toLogical = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    };

    const hitOutPort = (x: number, y: number) => {
      for (let i = modelRef.current.blocks.length - 1; i >= 0; i--) {
        const b = modelRef.current.blocks[i];
        if (OUT[b.type] === 0) continue;
        const p = outPortPos(b);
        if (Math.hypot(p.x - x, p.y - y) < 11) return b;
      }
      return null;
    };
    const hitInPort = (x: number, y: number) => {
      for (let i = modelRef.current.blocks.length - 1; i >= 0; i--) {
        const b = modelRef.current.blocks[i];
        for (let k = 0; k < IN[b.type]; k++) {
          const p = inPortPos(b, k);
          if (Math.hypot(p.x - x, p.y - y) < 11) return { block: b, port: k };
        }
      }
      return null;
    };
    const hitBlock = (x: number, y: number) => {
      for (let i = modelRef.current.blocks.length - 1; i >= 0; i--) {
        const b = modelRef.current.blocks[i];
        const { w, h } = dims(b.type);
        if (x >= b.x && x <= b.x + w && y >= b.y && y <= b.y + h) return b;
      }
      return null;
    };
    const hitWire = (x: number, y: number) => {
      const bmap = new Map(modelRef.current.blocks.map((b) => [b.id, b]));
      for (const wr of modelRef.current.wires) {
        const src = bmap.get(wr.from);
        const dst = bmap.get(wr.to);
        if (!src || !dst) continue;
        const p0 = outPortPos(src);
        const p1 = inPortPos(dst, wr.toPort);
        const dx = Math.max(30, (p1.x - p0.x) * 0.5);
        let prev: { x: number; y: number } | null = null;
        for (let s = 0; s <= 12; s++) {
          const tt = s / 12;
          const mt = 1 - tt;
          const bx = mt * mt * mt * p0.x + 3 * mt * mt * tt * (p0.x + dx) + 3 * mt * tt * tt * (p1.x - dx) + tt * tt * tt * p1.x;
          const by = mt * mt * mt * p0.y + 3 * mt * mt * tt * p0.y + 3 * mt * tt * tt * p1.y + tt * tt * tt * p1.y;
          if (prev && distToSeg(x, y, prev.x, prev.y, bx, by) < 7) return wr;
          prev = { x: bx, y: by };
        }
      }
      return null;
    };

    const onDown = (e: PointerEvent) => {
      const { x, y } = toLogical(e);
      const op = hitOutPort(x, y);
      if (op) {
        act.current = { mode: "wire", from: op.id, fromPort: 0, x, y };
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        return;
      }
      const bl = hitBlock(x, y);
      if (bl) {
        act.current = { mode: "drag", id: bl.id, ox: x - bl.x, oy: y - bl.y };
        setSelectedId(bl.id);
        setSelectedWire(null);
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        draw();
        return;
      }
      const wr = hitWire(x, y);
      if (wr) {
        setSelectedWire(wr.id);
        setSelectedId(null);
        act.current = { mode: "none" };
        draw();
        return;
      }
      setSelectedId(null);
      setSelectedWire(null);
      draw();
    };
    const onMove = (e: PointerEvent) => {
      const a = act.current;
      if (a.mode === "none") return;
      const { x, y } = toLogical(e);
      if (a.mode === "drag" && a.id) {
        const b = modelRef.current.blocks.find((bb) => bb.id === a.id);
        if (b) {
          const { w, h } = dims(b.type);
          b.x = Math.max(0, Math.min(W - w, x - (a.ox ?? 0)));
          b.y = Math.max(0, Math.min(H - h, y - (a.oy ?? 0)));
          draw();
        }
      } else if (a.mode === "wire") {
        a.x = x;
        a.y = y;
        draw();
      }
      e.preventDefault();
    };
    const onUp = (e: PointerEvent) => {
      const a = act.current;
      if (a.mode === "wire" && a.from !== undefined && a.x !== undefined && a.y !== undefined) {
        const tgt = hitInPort(a.x, a.y);
        if (tgt && tgt.block.id !== a.from) connect(a.from, 0, tgt.block.id, tgt.port);
      }
      act.current = { mode: "none" };
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = (from: string, fromPort: number, to: string, toPort: number) => {
    const m = modelRef.current;
    m.wires = m.wires.filter((wr) => !(wr.to === to && wr.toPort === toPort));
    m.wires.push({ id: `${from}.${fromPort}-${to}.${toPort}-${Date.now()}`, from, fromPort, to, toPort });
    setDirty(true);
    reconcile();
    bump();
  };

  const addBlock = (type: BlockType) => {
    const id = `b${++counter.current}`;
    const x = 40 + (counter.current % 6) * 14;
    const y = 40 + (counter.current % 6) * 14;
    modelRef.current.blocks.push({ id, type, x, y, p: defaultParams(type) });
    setDirty(true);
    setSelectedId(id);
    setSelectedWire(null);
    reconcile();
    bump();
  };

  const deleteSelected = () => {
    const m = modelRef.current;
    if (selectedWire) {
      m.wires = m.wires.filter((wr) => wr.id !== selectedWire);
      setSelectedWire(null);
    } else if (selectedId) {
      m.blocks = m.blocks.filter((b) => b.id !== selectedId);
      m.wires = m.wires.filter((wr) => wr.from !== selectedId && wr.to !== selectedId);
      setSelectedId(null);
    }
    setDirty(true);
    reconcile();
    bump();
  };

  const setParam = (id: string, key: string, v: number) => {
    const b = modelRef.current.blocks.find((bb) => bb.id === id);
    if (b) {
      b.p[key] = v;
      bump();
      if (!t.playing) draw();
    }
  };

  // Initialise sim + detect algebraic loops whenever structure changes.
  useEffect(() => {
    reconcile();
    const m = modelRef.current;
    const wireFrom = new Map(m.wires.map((wr) => [wr.to + ":" + wr.toPort, wr.from]));
    const ev = makeEval(m.blocks, wireFrom, 0, sim.current.states);
    for (const b of m.blocks) ev.out(b.id);
    setWarn(ev.hadAlgLoop() ? "Algebraic loop detected — a pure algebraic path feeds back on itself with no integrator or transfer function to break it. Insert an Integrator or Transfer Fn in the loop." : "");
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rev]);

  // Initial seed.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw on view-only changes.
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedWire, windowSec]);

  // ---- derived copy (equation / explain / code) ----------------------------
  const selBlock = findBlock(selectedId);
  const { equationTex, explain, code } = buildCopy(presetKey, dirty, num, windowSec);

  const nInteg = modelRef.current.blocks.filter((b) => b.type === "integrator" || b.type === "tf").length;

  return (
    <StudioChrome
      title="Block Diagram Simulator"
      tagline="continuous-time block diagrams · RK4"
      controls={
        <div>
          <TransportBar playing={t.playing} onToggle={t.toggle} onStep={t.step} onReset={reset} speed={t.speed} onSpeed={t.setSpeed} />
          <p className="mb-3 text-xs text-slate-500">
            A browser-native alternative to Simulink. Wire up sources, gains, integrators and transfer functions, then watch the Scope. Feedback loops solve because integrators break the algebraic loop.
          </p>

          <Presets presets={(Object.keys(PRESET_META) as PresetKey[]).map((k) => ({ label: PRESET_META[k].label, hint: PRESET_META[k].hint }))} onApply={(label) => {
            const key = (Object.keys(PRESET_META) as PresetKey[]).find((k) => PRESET_META[k].label === label);
            if (key) applyPreset(key);
          }} />

          {warn && (
            <div className="mb-3 rounded-lg border border-red-400/40 bg-red-50/70 p-2.5 text-[12px] leading-relaxed text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
              <span className="font-semibold">Warning: </span>{warn}
            </div>
          )}
          {unstable.current && (
            <div className="mb-3 rounded-lg border border-amber-400/40 bg-amber-50/70 p-2.5 text-[12px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-300">
              A state grew unbounded (unstable configuration) and was clamped. Reduce a gain or press Reset.
            </div>
          )}

          {/* Quick tuning knobs for the active preset */}
          {!dirty && KNOBS[presetKey].map((kn) => (
            <Slider key={kn.id + kn.key} label={kn.label} value={num(kn.id, kn.key)} min={kn.min} max={kn.max} step={kn.step} onChange={(v) => setParam(kn.id, kn.key, v)} />
          ))}

          {/* Selected-block editor */}
          {selBlock && (
            <div className="mb-3 mt-4 rounded-lg border border-slate-200 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Selected: {TYPE_LABEL[selBlock.type]}
              </p>
              {EDIT[selBlock.type].map((e) => (
                <Slider key={e.key} label={e.note ? `${e.label} (${e.note})` : e.label} value={selBlock.p[e.key] ?? 0} min={e.min} max={e.max} step={e.step} onChange={(v) => setParam(selBlock.id, e.key, v)} />
              ))}
              {selBlock.type === "sum" && (
                <div className="flex gap-4">
                  {[0, 1].map((i) => (
                    <button key={i} onClick={() => setParam(selBlock.id, i === 0 ? "s0" : "s1", (i === 0 ? selBlock.p.s0 : selBlock.p.s1) >= 0 ? -1 : 1)} className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      Input {i + 1}: {(i === 0 ? selBlock.p.s0 : selBlock.p.s1) >= 0 ? "+" : "−"}
                    </button>
                  ))}
                </div>
              )}
              {EDIT[selBlock.type].length === 0 && selBlock.type !== "sum" && (
                <p className="text-xs text-slate-500">This block has no parameters.</p>
              )}
            </div>
          )}
          {!selBlock && !selectedWire && <p className="mb-3 mt-2 text-xs text-slate-500">Click a block on the canvas to edit its parameters.</p>}
          {selectedWire && <p className="mb-3 mt-2 text-xs text-slate-500">Wire selected — press Delete to remove it.</p>}

          <button onClick={deleteSelected} disabled={!selectedId && !selectedWire} className="mb-3 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition enabled:hover:border-red-400 enabled:hover:text-red-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300">
            🗑 Delete selected {selectedWire ? "wire" : "block"}
          </button>

          {/* Add blocks */}
          <p className="mb-1.5 mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Add block</p>
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {(["step", "sine", "const", "sum", "gain", "integrator", "tf", "saturation", "scope"] as BlockType[]).map((ty) => (
              <button key={ty} onClick={() => addBlock(ty)} className="rounded-md border border-slate-300 px-1.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300">
                {ty === "tf" ? "1/(τs+1)" : ty === "integrator" ? "1/s" : TYPE_LABEL[ty]}
              </button>
            ))}
          </div>

          <Slider label="Scope window (s)" value={windowSec} min={2} max={30} step={1} onChange={setWindowSec} />

          <ShareBar code={code} />
        </div>
      }
      inspector={
        <div>
          <Stat label="Integrator" value="RK4 (fixed-step)" />
          <Stat label="Step size" value={`${DT} s`} />
          <Stat label="Preset" value={dirty ? "custom" : PRESET_META[presetKey].label} />
          <Stat label="Blocks" value={String(modelRef.current.blocks.length)} />
          <Stat label="Wires" value={String(modelRef.current.wires.length)} />
          <Stat label="State variables" value={String(nInteg)} />
          {!dirty && <Equation tex={equationTex} label="Effective dynamics" />}
          {dirty && <p className="mt-3 rounded-lg border border-slate-200 bg-white/60 p-2.5 text-[12px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">Custom diagram — the solver integrates whatever you wire together.</p>}
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function distToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let tt = ((px - x1) * dx + (py - y1) * dy) / l2;
  tt = Math.max(0, Math.min(1, tt));
  return Math.hypot(px - (x1 + tt * dx), py - (y1 + tt * dy));
}

function blockLabel(b: Block): string[] {
  switch (b.type) {
    case "step":
      return ["Step", `t₀=${fmt(b.p.t0 ?? 0)}`];
    case "sine":
      return ["Sine", `f=${fmt(b.p.freq ?? 0.2)}`];
    case "const":
      return ["Const", fmt(b.p.value ?? 1)];
    case "sum":
      return ["Σ"];
    case "gain":
      return ["Gain", `k=${fmt(b.p.k ?? 1)}`];
    case "integrator":
      return ["1/s", "∫"];
    case "tf":
      return ["1/(τs+1)", `τ=${fmt(b.p.tau ?? 1)}`];
    case "saturation":
      return ["Sat", `[${fmt(b.p.lo ?? -1)},${fmt(b.p.hi ?? 1)}]`];
    default:
      return ["Scope"];
  }
}

// Live equation / explanation / exportable Python for the active preset.
function buildCopy(key: PresetKey, dirty: boolean, num: (id: string, key: string, def?: number) => number, windowSec: number) {
  const span = Math.max(20, windowSec);
  if (dirty) {
    return {
      equationTex: "",
      explain: "You are editing a custom diagram. Each Integrator and Transfer Function carries a state that the RK4 solver advances; every other block is algebraic. Wire an output port to an input port to connect signals, and remember that any feedback loop needs an integrator or transfer function inside it — otherwise it is an unsolvable algebraic loop.",
      code: "# Build your own diagram in the browser, then export a preset for runnable code.\n",
    };
  }
  if (key === "lag") {
    const tau = num("tf", "tau", 2);
    const t0 = num("src", "t0", 1);
    const amp = num("src", "amp", 1);
    return {
      equationTex: `\\tau\\dot{y}+y=u,\\quad \\frac{Y(s)}{U(s)}=\\frac{1}{\\tau s+1},\\ \\tau=${tau.toFixed(2)}`,
      explain: `A first-order lag: the output chases the step input, reaching about 63% of the final value after one time constant (τ=${tau.toFixed(2)} s) and settling to the input amplitude after roughly 5τ ≈ ${(5 * tau).toFixed(1)} s. Increase τ and the rise slows; decrease it and the output snaps to the step almost immediately.`,
      code: `import numpy as np
from scipy import signal
import matplotlib.pyplot as plt

tau = ${tau}
sys = signal.TransferFunction([1.0], [tau, 1.0])   # 1 / (tau*s + 1)

t = np.linspace(0, ${span}, 4000)
u = np.where(t >= ${t0}, ${amp}, 0.0)              # step input
t, y, _ = signal.lsim(sys, U=u, T=t)

plt.plot(t, u, '--', label='input'); plt.plot(t, y, label='output')
plt.xlabel('time (s)'); plt.legend(); plt.grid(True); plt.show()`,
    };
  }
  if (key === "pid") {
    const kp = num("gainP", "k", 2);
    const ki = num("gainI", "k", 0.8);
    const tau = num("plant", "tau", 1);
    const t0 = num("src", "t0", 0.5);
    const fast = kp >= 4;
    const ringy = ki >= 2.5;
    const explain = `Closed-loop PI control of a first-order plant (τ=${tau.toFixed(2)}). ` +
      (fast ? `The high proportional gain Kp=${kp.toFixed(2)} makes the response fast but pushes it into overshoot. ` : `The proportional gain Kp=${kp.toFixed(2)} sets how hard the controller pushes on the error. `) +
      (ki > 0 ? `The integral term Ki=${ki.toFixed(2)} drives the steady-state error to zero${ringy ? ", but this much integral action makes the loop ring before it settles" : " and cleanly removes any offset"}.` : "With no integral action a steady-state offset remains.") +
      " Raise Kp for speed, add Ki to kill offset, and back both off if it oscillates.";
    return {
      equationTex: `C(s)=K_p+\\frac{K_i}{s}=${kp.toFixed(2)}+\\frac{${ki.toFixed(2)}}{s},\\quad P(s)=\\frac{1}{${tau.toFixed(2)}\\,s+1}`,
      explain,
      code: `import numpy as np
from scipy.integrate import odeint
import matplotlib.pyplot as plt

Kp, Ki, tau = ${kp}, ${ki}, ${tau}

def deriv(state, t):
    y, xi = state          # plant output, integral of error
    r = 1.0 if t >= ${t0} else 0.0
    e = r - y              # feedback: setpoint minus output
    u = Kp*e + xi          # PI controller output
    dy = (u - y)/tau       # plant 1/(tau*s+1)
    dxi = Ki*e
    return [dy, dxi]

t = np.linspace(0, ${span}, 4000)
y = odeint(deriv, [0.0, 0.0], t)[:, 0]
r = np.where(t >= ${t0}, 1.0, 0.0)
plt.plot(t, r, '--', label='setpoint'); plt.plot(t, y, label='output')
plt.xlabel('time (s)'); plt.legend(); plt.grid(True); plt.show()`,
    };
  }
  if (key === "osc") {
    const k = num("gain", "k", -4);
    const w = Math.sqrt(Math.max(0, -k));
    const x0 = num("integX", "x0", 1);
    return {
      equationTex: `\\ddot{x}=k\\,x=${k.toFixed(2)}\\,x\\;\\Rightarrow\\; \\omega=\\sqrt{-k}=${w.toFixed(2)}\\ \\text{rad/s}`,
      explain: `Two integrators in a loop with a negative gain form an undamped harmonic oscillator: position feeds back through k=${k.toFixed(2)} to become acceleration, so x''=k·x and the output is a sine at ω=${w.toFixed(2)} rad/s (period ${(2 * Math.PI / (w || 1)).toFixed(2)} s). RK4 conserves energy well, so the amplitude holds steady — a plain Euler step would slowly spiral outward. Make k more negative to raise the frequency.`,
      code: `import numpy as np
from scipy.integrate import odeint
import matplotlib.pyplot as plt

k = ${k}                      # x'' = k*x, oscillates when k < 0

def deriv(state, t):
    v, x = state
    return [k*x, v]           # dv/dt = k*x,  dx/dt = v

t = np.linspace(0, ${span}, 4000)
x = odeint(deriv, [0.0, ${x0}], t)[:, 1]
plt.plot(t, x); plt.xlabel('time (s)'); plt.ylabel('x'); plt.grid(True); plt.show()`,
    };
  }
  // msd
  const km = num("gainM", "k", 1); // 1/m
  const kk = num("gainK", "k", 4); // spring
  const kc = num("gainC", "k", 0.5); // damper
  const m = 1 / (km || 1);
  const wn = Math.sqrt(Math.max(0, kk * km));
  const zeta = wn > 0 ? (kc * km) / (2 * wn) : 0;
  const t0 = num("src", "t0", 0.5);
  const amp = num("src", "amp", 1);
  const regime = zeta < 1 ? `underdamped (ζ=${zeta.toFixed(2)}): it overshoots and rings before settling` : zeta > 1 ? `overdamped (ζ=${zeta.toFixed(2)}): it slides to rest with no overshoot` : "critically damped: the fastest settle with no overshoot";
  return {
    equationTex: `m\\ddot{x}+c\\dot{x}+kx=F,\\quad m=${m.toFixed(2)},\\,c=${kc.toFixed(2)},\\,k=${kk.toFixed(2)}\\;(\\omega_n=${wn.toFixed(2)},\\,\\zeta=${zeta.toFixed(2)})`,
    explain: `A step force pushes a mass held by a spring (k=${kk.toFixed(2)}) and a damper (c=${kc.toFixed(2)}). The response is ${regime}, with natural frequency ωₙ=${wn.toFixed(2)} rad/s. Increase the damper c to kill the oscillation, or the spring k to raise the frequency and reduce the final displacement.`,
    code: `import numpy as np
from scipy.integrate import odeint
import matplotlib.pyplot as plt

inv_m, k, c = ${km}, ${kk}, ${kc}   # inv_m = 1/m

def deriv(state, t):
    v, x = state
    F = ${amp} if t >= ${t0} else 0.0
    a = inv_m*(F - c*v - k*x)        # m*x'' = F - c*x' - k*x
    return [a, v]

t = np.linspace(0, ${span}, 4000)
x = odeint(deriv, [0.0, 0.0], t)[:, 1]
plt.plot(t, x); plt.xlabel('time (s)'); plt.ylabel('position'); plt.grid(True); plt.show()`,
  };
}
