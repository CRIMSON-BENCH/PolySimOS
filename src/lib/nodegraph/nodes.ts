import { NodeDef, Series, PortValue } from "./types";
import { parse, evaluate, derivativeExprSafe } from "../engines/cas";
import { rk4Step } from "../engines/dynamics";

const asNum = (v: PortValue, d = 0): number => (typeof v === "number" ? v : d);
const asSeries = (v: PortValue): Series | undefined => (v && typeof v === "object" && "xs" in v ? v : undefined);
const linspace = (a: number, b: number, n: number): number[] => {
  const out: number[] = [];
  const steps = Math.max(2, Math.floor(n));
  for (let i = 0; i < steps; i++) out.push(a + ((b - a) * i) / (steps - 1));
  return out;
};

export const NODE_DEFS: Record<string, NodeDef> = {
  range: {
    type: "range", title: "Range", category: "Source",
    inputs: [], outputs: [{ id: "x", label: "x", type: "series" }],
    params: [
      { id: "min", label: "min", kind: "number", default: -10, step: 0.5 },
      { id: "max", label: "max", kind: "number", default: 10, step: 0.5 },
      { id: "steps", label: "steps", kind: "number", default: 300, min: 10, max: 1000, step: 10 },
    ],
    compute: (_i, p) => {
      const xs = linspace(Number(p.min), Number(p.max), Number(p.steps));
      return { x: { xs, ys: xs.slice() } };
    },
  },
  constant: {
    type: "constant", title: "Constant", category: "Source",
    inputs: [], outputs: [{ id: "v", label: "value", type: "number" }],
    params: [{ id: "value", label: "value", kind: "number", default: 1, step: 0.1 }],
    compute: (_i, p) => ({ v: Number(p.value) }),
  },
  slider: {
    type: "slider", title: "Slider", category: "Source",
    inputs: [], outputs: [{ id: "v", label: "value", type: "number" }],
    params: [{ id: "value", label: "value", kind: "number", default: 1, min: -10, max: 10, step: 0.1 }],
    compute: (_i, p) => ({ v: Number(p.value) }),
  },
  expression: {
    type: "expression", title: "Expression f(x)", category: "Symbolic",
    inputs: [{ id: "x", label: "x", type: "series" }],
    outputs: [{ id: "y", label: "f(x)", type: "series" }],
    params: [{ id: "expr", label: "f(x)", kind: "expr", default: "sin(x)" }],
    compute: (i, p) => {
      const s = asSeries(i.x);
      if (!s) return {};
      const tree = parse(String(p.expr));
      const ys = s.xs.map((x) => {
        try { return evaluate(tree, { x }); } catch { return NaN; }
      });
      return { y: { xs: s.xs, ys } };
    },
  },
  derivative: {
    type: "derivative", title: "Derivative d/dx", category: "Symbolic",
    inputs: [{ id: "x", label: "x", type: "series" }],
    outputs: [{ id: "y", label: "f'(x)", type: "series" }],
    params: [{ id: "expr", label: "f(x)", kind: "expr", default: "sin(x)" }],
    compute: (i, p) => {
      const s = asSeries(i.x);
      if (!s) return {};
      const d = derivativeExprSafe(String(p.expr), "x");
      const tree = parse(d);
      const ys = s.xs.map((x) => {
        try { return evaluate(tree, { x }); } catch { return NaN; }
      });
      return { y: { xs: s.xs, ys } };
    },
  },
  add: binaryMath("add", "Add (+)", (a, b) => a + b),
  subtract: binaryMath("subtract", "Subtract (−)", (a, b) => a - b),
  multiply: binaryMath("multiply", "Multiply (×)", (a, b) => a * b),
  divide: binaryMath("divide", "Divide (÷)", (a, b) => a / b),
  scale: {
    type: "scale", title: "Scale series", category: "Signal",
    inputs: [{ id: "s", label: "series", type: "series" }, { id: "k", label: "k", type: "number" }],
    outputs: [{ id: "out", label: "series", type: "series" }],
    params: [{ id: "k", label: "k (if unwired)", kind: "number", default: 2, step: 0.1 }],
    compute: (i, p) => {
      const s = asSeries(i.s); if (!s) return {};
      const k = i.k !== undefined ? asNum(i.k) : Number(p.k);
      return { out: { xs: s.xs, ys: s.ys.map((y) => y * k) } };
    },
  },
  sumseries: {
    type: "sumseries", title: "Add series", category: "Signal",
    inputs: [{ id: "a", label: "A", type: "series" }, { id: "b", label: "B", type: "series" }],
    outputs: [{ id: "out", label: "A+B", type: "series" }],
    params: [],
    compute: (i) => {
      const a = asSeries(i.a), b = asSeries(i.b);
      if (!a || !b) return {};
      const n = Math.min(a.ys.length, b.ys.length);
      return { out: { xs: a.xs.slice(0, n), ys: a.ys.slice(0, n).map((y, k) => y + b.ys[k]) } };
    },
  },
  ode: {
    type: "ode", title: "ODE Integrator", category: "Signal",
    inputs: [],
    outputs: [{ id: "y", label: "y(t)", type: "series" }],
    params: [
      { id: "f", label: "dy/dt =", kind: "expr", default: "-0.3*y + sin(t)" },
      { id: "y0", label: "y(0)", kind: "number", default: 1, min: -5, max: 5, step: 0.1 },
      { id: "tmax", label: "t max", kind: "number", default: 30, min: 5, max: 100, step: 1 },
      { id: "dt", label: "Δt", kind: "number", default: 0.05, min: 0.005, max: 0.2, step: 0.005 },
    ],
    compute: (_i, p) => {
      const tree = parse(String(p.f));
      const f = (t: number, y: number[]) => [evaluate(tree, { t, y: y[0] })];
      const dt = Number(p.dt), tmax = Number(p.tmax);
      const xs: number[] = [], ys: number[] = [];
      let y = [Number(p.y0)], t = 0;
      const steps = Math.min(5000, Math.floor(tmax / dt));
      for (let i = 0; i <= steps; i++) { xs.push(t); ys.push(y[0]); y = rk4Step(f, t, y, dt); t += dt; }
      return { y: { xs, ys } };
    },
  },
  statistics: {
    type: "statistics", title: "Statistics", category: "Math",
    inputs: [{ id: "s", label: "series", type: "series" }],
    outputs: [{ id: "mean", label: "mean", type: "number" }, { id: "max", label: "max", type: "number" }, { id: "min", label: "min", type: "number" }],
    params: [],
    compute: (i) => {
      const s = asSeries(i.s); if (!s) return {};
      const vals = s.ys.filter((v) => isFinite(v));
      if (!vals.length) return {};
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { mean, max: Math.max(...vals), min: Math.min(...vals) };
    },
  },
  plot: {
    type: "plot", title: "Plot", category: "Output", terminal: true,
    inputs: [{ id: "a", label: "series A", type: "series" }, { id: "b", label: "series B", type: "series" }],
    outputs: [], params: [],
    compute: () => ({}),
  },
  number: {
    type: "number", title: "Number readout", category: "Output", terminal: true,
    inputs: [{ id: "v", label: "value", type: "number" }],
    outputs: [], params: [],
    compute: () => ({}),
  },
};

function binaryMath(type: string, title: string, fn: (a: number, b: number) => number): NodeDef {
  return {
    type, title, category: "Math",
    inputs: [{ id: "a", label: "a", type: "number" }, { id: "b", label: "b", type: "number" }],
    outputs: [{ id: "out", label: "out", type: "number" }],
    params: [
      { id: "a", label: "a (if unwired)", kind: "number", default: 1, step: 0.1 },
      { id: "b", label: "b (if unwired)", kind: "number", default: 1, step: 0.1 },
    ],
    compute: (i, p) => {
      const a = i.a !== undefined ? asNum(i.a) : Number(p.a);
      const b = i.b !== undefined ? asNum(i.b) : Number(p.b);
      return { out: fn(a, b) };
    },
  };
}

export const NODE_LIST = Object.values(NODE_DEFS);
