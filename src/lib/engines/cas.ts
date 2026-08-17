// PolySim CAS — a real (compact) computer-algebra engine.
// Tokenizer -> Pratt parser -> AST, with numeric evaluation, symbolic
// differentiation, and algebraic simplification. Framework-agnostic, no deps.

export type Node =
  | { t: "num"; v: number }
  | { t: "var"; name: string }
  | { t: "neg"; a: Node }
  | { t: "add"; a: Node; b: Node }
  | { t: "sub"; a: Node; b: Node }
  | { t: "mul"; a: Node; b: Node }
  | { t: "div"; a: Node; b: Node }
  | { t: "pow"; a: Node; b: Node }
  | { t: "call"; name: string; a: Node };

const FUNCS = new Set([
  "sin", "cos", "tan", "exp", "log", "ln", "sqrt", "abs", "sinh", "cosh", "tanh", "asin", "acos", "atan",
]);
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };

// --- Tokenizer ------------------------------------------------------------
type Tok = { k: "num" | "id" | "op" | "lp" | "rp"; v: string };

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t") { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let n = "";
      while (i < src.length && /[0-9.eE]/.test(src[i])) {
        // allow scientific notation like 1e-3
        if ((src[i] === "e" || src[i] === "E") && /[+-]/.test(src[i + 1] ?? "")) { n += src[i] + src[i + 1]; i += 2; continue; }
        n += src[i++];
      }
      toks.push({ k: "num", v: n });
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let id = "";
      while (i < src.length && /[a-zA-Z_0-9]/.test(src[i])) id += src[i++];
      toks.push({ k: "id", v: id });
      continue;
    }
    if ("+-*/^".includes(c)) { toks.push({ k: "op", v: c }); i++; continue; }
    if (c === "(") { toks.push({ k: "lp", v: c }); i++; continue; }
    if (c === ")") { toks.push({ k: "rp", v: c }); i++; continue; }
    throw new Error(`Unexpected character '${c}' at ${i}`);
  }
  return toks;
}

// --- Pratt parser ---------------------------------------------------------
const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };

export function parse(src: string): Node {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];

  function parseExpr(min: number): Node {
    let left = parseUnary();
    while (peek() && peek().k === "op" && PREC[peek().v] >= min) {
      const op = next().v;
      const rightAssoc = op === "^";
      const nextMin = rightAssoc ? PREC[op] : PREC[op] + 1;
      const right = parseExpr(nextMin);
      left = combine(op, left, right);
    }
    return left;
  }

  function parseUnary(): Node {
    if (peek() && peek().k === "op" && peek().v === "-") { next(); return { t: "neg", a: parseUnary() }; }
    if (peek() && peek().k === "op" && peek().v === "+") { next(); return parseUnary(); }
    return parseAtom();
  }

  function parseAtom(): Node {
    const tk = peek();
    if (!tk) throw new Error("Unexpected end of expression");
    if (tk.k === "num") { next(); return { t: "num", v: parseFloat(tk.v) }; }
    if (tk.k === "lp") { next(); const e = parseExpr(1); expect("rp"); return e; }
    if (tk.k === "id") {
      next();
      if (peek() && peek().k === "lp") {
        next();
        const arg = parseExpr(1);
        expect("rp");
        const name = tk.v.toLowerCase();
        if (!FUNCS.has(name)) throw new Error(`Unknown function '${tk.v}'`);
        return { t: "call", name, a: arg };
      }
      if (tk.v.toLowerCase() in CONSTS) return { t: "num", v: CONSTS[tk.v.toLowerCase()] };
      return { t: "var", name: tk.v };
    }
    throw new Error(`Unexpected token '${tk.v}'`);
  }

  function expect(k: Tok["k"]) {
    const tk = next();
    if (!tk || tk.k !== k) throw new Error(`Expected ${k}`);
  }

  const tree = parseExpr(1);
  if (p < toks.length) throw new Error("Unexpected trailing input");
  return tree;
}

function combine(op: string, a: Node, b: Node): Node {
  switch (op) {
    case "+": return { t: "add", a, b };
    case "-": return { t: "sub", a, b };
    case "*": return { t: "mul", a, b };
    case "/": return { t: "div", a, b };
    case "^": return { t: "pow", a, b };
    default: throw new Error(`Bad op ${op}`);
  }
}

// --- Evaluation -----------------------------------------------------------
export function evaluate(n: Node, vars: Record<string, number> = {}): number {
  switch (n.t) {
    case "num": return n.v;
    case "var": {
      if (n.name in vars) return vars[n.name];
      if (n.name.toLowerCase() in CONSTS) return CONSTS[n.name.toLowerCase()];
      throw new Error(`Unknown variable '${n.name}'`);
    }
    case "neg": return -evaluate(n.a, vars);
    case "add": return evaluate(n.a, vars) + evaluate(n.b, vars);
    case "sub": return evaluate(n.a, vars) - evaluate(n.b, vars);
    case "mul": return evaluate(n.a, vars) * evaluate(n.b, vars);
    case "div": return evaluate(n.a, vars) / evaluate(n.b, vars);
    case "pow": return Math.pow(evaluate(n.a, vars), evaluate(n.b, vars));
    case "call": return applyFunc(n.name, evaluate(n.a, vars));
  }
}

function applyFunc(name: string, x: number): number {
  switch (name) {
    case "sin": return Math.sin(x);
    case "cos": return Math.cos(x);
    case "tan": return Math.tan(x);
    case "exp": return Math.exp(x);
    case "log": case "ln": return Math.log(x);
    case "sqrt": return Math.sqrt(x);
    case "abs": return Math.abs(x);
    case "sinh": return Math.sinh(x);
    case "cosh": return Math.cosh(x);
    case "tanh": return Math.tanh(x);
    case "asin": return Math.asin(x);
    case "acos": return Math.acos(x);
    case "atan": return Math.atan(x);
    default: throw new Error(`Unknown function '${name}'`);
  }
}

// --- Symbolic differentiation --------------------------------------------
const num = (v: number): Node => ({ t: "num", v });
const isNum = (n: Node, v?: number): n is { t: "num"; v: number } =>
  n.t === "num" && (v === undefined || n.v === v);

export function derivative(n: Node, x: string): Node {
  switch (n.t) {
    case "num": return num(0);
    case "var": return num(n.name === x ? 1 : 0);
    case "neg": return { t: "neg", a: derivative(n.a, x) };
    case "add": return { t: "add", a: derivative(n.a, x), b: derivative(n.b, x) };
    case "sub": return { t: "sub", a: derivative(n.a, x), b: derivative(n.b, x) };
    case "mul": // product rule
      return { t: "add", a: { t: "mul", a: derivative(n.a, x), b: n.b }, b: { t: "mul", a: n.a, b: derivative(n.b, x) } };
    case "div": // quotient rule
      return {
        t: "div",
        a: { t: "sub", a: { t: "mul", a: derivative(n.a, x), b: n.b }, b: { t: "mul", a: n.a, b: derivative(n.b, x) } },
        b: { t: "pow", a: n.b, b: num(2) },
      };
    case "pow": {
      // constant exponent: d/dx a^c = c*a^(c-1)*a'
      if (isNum(n.b)) {
        const c = n.b.v;
        return { t: "mul", a: { t: "mul", a: num(c), b: { t: "pow", a: n.a, b: num(c - 1) } }, b: derivative(n.a, x) };
      }
      // general: a^b * (b' ln a + b a'/a)
      return {
        t: "mul",
        a: n,
        b: {
          t: "add",
          a: { t: "mul", a: derivative(n.b, x), b: { t: "call", name: "ln", a: n.a } },
          b: { t: "div", a: { t: "mul", a: n.b, b: derivative(n.a, x) }, b: n.a },
        },
      };
    }
    case "call": {
      const u = n.a;
      const du = derivative(u, x);
      let outer: Node;
      switch (n.name) {
        case "sin": outer = { t: "call", name: "cos", a: u }; break;
        case "cos": outer = { t: "neg", a: { t: "call", name: "sin", a: u } }; break;
        case "tan": outer = { t: "div", a: num(1), b: { t: "pow", a: { t: "call", name: "cos", a: u }, b: num(2) } }; break;
        case "exp": outer = { t: "call", name: "exp", a: u }; break;
        case "log": case "ln": outer = { t: "div", a: num(1), b: u }; break;
        case "sqrt": outer = { t: "div", a: num(1), b: { t: "mul", a: num(2), b: { t: "call", name: "sqrt", a: u } } }; break;
        case "sinh": outer = { t: "call", name: "cosh", a: u }; break;
        case "cosh": outer = { t: "call", name: "sinh", a: u }; break;
        case "tanh": outer = { t: "sub", a: num(1), b: { t: "pow", a: { t: "call", name: "tanh", a: u }, b: num(2) } }; break;
        case "atan": outer = { t: "div", a: num(1), b: { t: "add", a: num(1), b: { t: "pow", a: u, b: num(2) } } }; break;
        default: throw new Error(`Derivative of '${n.name}' not supported`);
      }
      return { t: "mul", a: outer, b: du };
    }
  }
}

// --- Simplification -------------------------------------------------------
export function simplify(n: Node): Node {
  const s = simplifyOnce(n);
  const str = toString(s);
  // fixed-point: keep simplifying until stable (bounded)
  let cur = s, prev = str, i = 0;
  while (i++ < 12) {
    const nx = simplifyOnce(cur);
    const nxs = toString(nx);
    if (nxs === prev) break;
    cur = nx; prev = nxs;
  }
  return cur;
}

function simplifyOnce(n: Node): Node {
  switch (n.t) {
    case "num": case "var": return n;
    case "neg": {
      const a = simplifyOnce(n.a);
      if (isNum(a)) return num(-a.v);
      if (a.t === "neg") return a.a;
      return { t: "neg", a };
    }
    case "add": {
      const a = simplifyOnce(n.a), b = simplifyOnce(n.b);
      if (isNum(a) && isNum(b)) return num(a.v + b.v);
      if (isNum(a, 0)) return b;
      if (isNum(b, 0)) return a;
      return { t: "add", a, b };
    }
    case "sub": {
      const a = simplifyOnce(n.a), b = simplifyOnce(n.b);
      if (isNum(a) && isNum(b)) return num(a.v - b.v);
      if (isNum(b, 0)) return a;
      if (isNum(a, 0)) return { t: "neg", a: b };
      return { t: "sub", a, b };
    }
    case "mul": {
      const a = simplifyOnce(n.a), b = simplifyOnce(n.b);
      if (isNum(a) && isNum(b)) return num(a.v * b.v);
      if (isNum(a, 0) || isNum(b, 0)) return num(0);
      if (isNum(a, 1)) return b;
      if (isNum(b, 1)) return a;
      return { t: "mul", a, b };
    }
    case "div": {
      const a = simplifyOnce(n.a), b = simplifyOnce(n.b);
      if (isNum(a) && isNum(b) && b.v !== 0) return num(a.v / b.v);
      if (isNum(a, 0)) return num(0);
      if (isNum(b, 1)) return a;
      return { t: "div", a, b };
    }
    case "pow": {
      const a = simplifyOnce(n.a), b = simplifyOnce(n.b);
      if (isNum(a) && isNum(b)) return num(Math.pow(a.v, b.v));
      if (isNum(b, 0)) return num(1);
      if (isNum(b, 1)) return a;
      return { t: "pow", a, b };
    }
    case "call": return { t: "call", name: n.name, a: simplifyOnce(n.a) };
  }
}

// --- Pretty printing ------------------------------------------------------
export function toString(n: Node): string {
  return print(n, 0);
}
function print(n: Node, parent: number): string {
  switch (n.t) {
    case "num": return fmt(n.v);
    case "var": return n.name;
    case "neg": return wrap(`-${print(n.a, 3)}`, 3, parent);
    case "add": return wrap(`${print(n.a, 1)} + ${print(n.b, 1)}`, 1, parent);
    case "sub": return wrap(`${print(n.a, 1)} - ${print(n.b, 2)}`, 1, parent);
    case "mul": return wrap(`${print(n.a, 2)}*${print(n.b, 2)}`, 2, parent);
    case "div": return wrap(`${print(n.a, 2)}/${print(n.b, 3)}`, 2, parent);
    case "pow": return wrap(`${print(n.a, 4)}^${print(n.b, 3)}`, 3, parent);
    case "call": return `${n.name}(${print(n.a, 0)})`;
  }
}
function wrap(s: string, prec: number, parent: number): string {
  return prec < parent ? `(${s})` : s;
}
function fmt(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return String(Math.round(v * 1e6) / 1e6);
}

// --- High-level convenience ----------------------------------------------
export function differentiateExpr(expr: string, x = "x"): string {
  return toString(simplify(derivative(parse(expr), x)));
}
export function simplifyExpr(expr: string): string {
  return toString(simplify(parse(expr)));
}
export function evalExpr(expr: string, vars: Record<string, number> = {}): number {
  return evaluate(parse(expr), vars);
}
// Numeric root-find via bisection on [lo,hi] for f(x)=0.
export function solveRoot(expr: string, x: string, lo: number, hi: number): number | null {
  const f = (v: number) => evaluate(parse(expr), { [x]: v });
  let a = lo, b = hi, fa = f(a), fb = f(b);
  if (isNaN(fa) || isNaN(fb) || fa * fb > 0) return null;
  for (let i = 0; i < 100; i++) {
    const m = (a + b) / 2, fm = f(m);
    if (Math.abs(fm) < 1e-10) return m;
    if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}
// Sample y=f(x) across a range for plotting.
export function sampleExpr(expr: string, x: string, lo: number, hi: number, n = 400): { x: number; y: number }[] {
  const tree = parse(expr);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const xv = lo + ((hi - lo) * i) / n;
    let y: number;
    try { y = evaluate(tree, { [x]: xv }); } catch { y = NaN; }
    out.push({ x: xv, y });
  }
  return out;
}
