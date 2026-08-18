// Best-effort Python → MATLAB / Julia transpiler for the per-solver "Copy as Python" snippets.
// Indentation-aware: tracks a stack of open-block header indents and closes them with `end`.
// Handles the straight-line + simple for/while/if/def style those snippets use; anything
// exotic still copies with a clear "review before running" banner.

type Lang = "matlab" | "julia";

function tokenSwaps(line: string, lang: Lang): string {
  let s = line;
  s = s.replace(/\bnp\.pi\b/g, "pi").replace(/\bmath\.pi\b/g, "pi");
  const fnMap: Record<string, string> = { arctan2: "atan2", arctan: "atan", arcsin: "asin", arccos: "acos", maximum: "max", minimum: "min", radians: "deg2rad", degrees: "rad2deg" };
  s = s.replace(/\b(?:np|math)\.(arctan2|arctan|arcsin|arccos|maximum|minimum|radians|degrees)\b/g, (_m, fn: string) => fnMap[fn]);
  s = s.replace(/\bnp\.array\(/g, "(");            // np.array([...]) → ([...])  (MATLAB/Julia literal)
  s = s.replace(/\b(?:np|math)\./g, "");            // drop remaining np./math. — sin/cos/sqrt/exp/mean/… are builtins in both
  s = s.replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false").replace(/\bNone\b/g, lang === "matlab" ? "[]" : "nothing");
  if (lang === "matlab") {
    s = s.replace(/\*\*/g, ".^");
    s = s.replace(/^([A-Za-z_]\w*)\s*([+\-*/])=\s*(.+)$/, "$1 = $1 $2 ($3)"); // MATLAB has no += etc.
    s = s.replace(/#/g, "%");
  } else {
    s = s.replace(/\*\*/g, "^");
  }
  return s;
}

function header(lang: Lang): string {
  return lang === "matlab"
    ? "% Auto-translated from Python — a starting point; review loops & functions before running.\n\n"
    : "# Auto-translated from Python — a starting point; review loops & functions before running.\nusing LinearAlgebra, Statistics\n\n";
}

export function transpile(py: string, lang: Lang): string {
  const lines = py.replace(/\t/g, "    ").split("\n");
  const out: string[] = [];
  const stack: number[] = []; // indents of open block headers
  const indentOf = (l: string) => l.match(/^ */)![0].length;
  const cmt = lang === "matlab" ? "% " : "# ";

  for (const raw of lines) {
    if (raw.trim() === "") { out.push(""); continue; }
    const ind = indentOf(raw);
    let body = raw.trim();
    const isCont = /^(elif|else)\b/.test(body); // continues the current if-block

    // close blocks that this line has dedented out of
    while (stack.length && (ind < stack[stack.length - 1] || (ind === stack[stack.length - 1] && !isCont))) {
      stack.pop();
      out.push(" ".repeat(stack.length ? stack[stack.length - 1] : ind) + "end");
    }

    if (/^(import|from)\s/.test(body)) { out.push(cmt + body); continue; }

    const opens = body.endsWith(":");
    if (opens) body = body.slice(0, -1);

    body = body.replace(/^elif\b/, "elseif");
    body = body.replace(/^for\s+(\w+)\s+in\s+range\(([^)]*)\)/, (_m, v, a) => {
      const p = a.split(",").map((x: string) => x.trim());
      const kw = lang === "matlab" ? "=" : "in";
      if (p.length === 1) return `for ${v} ${kw} 0:(${p[0]})-1`;
      if (p.length === 2) return `for ${v} ${kw} ${p[0]}:(${p[1]})-1`;
      return `for ${v} ${kw} ${p[0]}:${p[2]}:(${p[1]})-1`;
    });
    if (lang === "matlab") body = body.replace(/^for\s+(\w+)\s+in\s+(.+)/, "for $1 = $2");
    body = body.replace(/^def\s+(\w+)\s*\(([^)]*)\)/, "function $1($2)");
    body = body.replace(/^print\((.*)\)$/, (_m, inner) => (lang === "matlab" ? `disp(${inner})` : `println(${inner})`));
    // list.append(x) → MATLAB x(end+1)=… / Julia push!(list, x)
    body = body.replace(/^(\w+)\.append\((.*)\)$/, (_m, arr, val) => (lang === "matlab" ? `${arr}(end+1) = ${val}` : `push!(${arr}, ${val})`));

    body = tokenSwaps(body, lang);

    if (lang === "matlab" && !opens && !/[;%]$/.test(body) && !/^(function|for|while|if|elseif|else|switch|case)\b/.test(body)) {
      body += ";";
    }

    out.push(" ".repeat(ind) + body);
    if (opens && !isCont) stack.push(ind);
  }
  while (stack.length) { stack.pop(); out.push("end"); }

  return header(lang) + out.join("\n");
}
