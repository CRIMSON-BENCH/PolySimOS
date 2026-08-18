"use client";

import { useEffect, useRef, useState } from "react";

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const EXAMPLES: { label: string; code: string }[] = [
  {
    label: "NumPy basics",
    code: `import numpy as np
a = np.linspace(0, 2*np.pi, 8)
print("angles:", np.round(a, 3))
print("sin:   ", np.round(np.sin(a), 3))
print("mean of sin^2:", np.mean(np.sin(a)**2))`,
  },
  {
    label: "Projectile (matplotlib)",
    code: `import numpy as np, matplotlib.pyplot as plt
angle, speed, drag = 45, 60, 0.02
rad = np.radians(angle); g, dt = 30.0, 0.02
x=y=0.0; vx=speed*np.cos(rad); vy=speed*np.sin(rad); xs=[0.0]; ys=[0.0]
while y >= 0:
    v = np.hypot(vx, vy)
    vx += -drag*v*vx*dt; vy += (-g - drag*v*vy)*dt
    x += vx*dt; y += vy*dt; xs.append(x); ys.append(y)
plt.plot(xs, ys); plt.title("Projectile with drag"); plt.xlabel("distance (m)"); plt.ylabel("height (m)")
print("range", round(max(xs),1), "m   apex", round(max(ys),1), "m")`,
  },
  {
    label: "Linear algebra",
    code: `import numpy as np
A = np.array([[2, 1], [1, 3]])
w, V = np.linalg.eig(A)
print("eigenvalues:", np.round(w, 4))
print("eigenvectors:\\n", np.round(V, 4))
print("det:", round(float(np.linalg.det(A)), 4))`,
  },
  {
    label: "SciPy solve ODE",
    code: `import numpy as np
from scipy.integrate import odeint
# Lotka-Volterra predator-prey
def f(z, t): x, y = z; return [1.0*x - 0.1*x*y, -1.5*y + 0.075*x*y]
t = np.linspace(0, 15, 300)
sol = odeint(f, [10, 5], t)
print("final prey/predator:", np.round(sol[-1], 2))
print("peak prey:", round(sol[:,0].max(), 1))`,
  },
];

// Minimal in-browser Python runtime (Pyodide/WASM) — NumPy, SciPy, Matplotlib, all client-side.
export function PyConsole() {
  const [code, setCode] = useState(EXAMPLES[1].code);
  const [output, setOutput] = useState("");
  const [img, setImg] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "running">("idle");
  const [err, setErr] = useState(false);
  const pyRef = useRef<unknown>(null);

  async function ensurePyodide() {
    if (pyRef.current) return pyRef.current;
    setStatus("loading");
    // inject the loader script once
    if (!(window as unknown as { loadPyodide?: unknown }).loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `${PYODIDE_URL}pyodide.js`;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Pyodide from the CDN."));
        document.head.appendChild(s);
      });
    }
    const loadPyodide = (window as unknown as { loadPyodide: (opts: { indexURL: string }) => Promise<unknown> }).loadPyodide;
    const py = await loadPyodide({ indexURL: PYODIDE_URL });
    pyRef.current = py;
    return py;
  }

  async function run() {
    setErr(false);
    setImg("");
    setOutput("");
    let py: any;
    try {
      py = await ensurePyodide();
    } catch (e) {
      setErr(true);
      setStatus("idle");
      setOutput(String((e as Error).message || e));
      return;
    }
    setStatus("running");
    try {
      // auto-install any imported packages available in Pyodide (numpy, scipy, matplotlib, …)
      await py.loadPackagesFromImports(code);
      py.runPython(`
import sys, io
_out = io.StringIO(); sys.stdout = _out; sys.stderr = _out
try:
    import matplotlib
    matplotlib.use("AGG")
except Exception:
    pass
`);
      await py.runPythonAsync(code);
      const captured: string = py.runPython("_out.getvalue()");
      const figure: string = py.runPython(`
_img = ""
try:
    import matplotlib.pyplot as plt, io as _io, base64 as _b64
    if plt.get_fignums():
        _b = _io.BytesIO(); plt.savefig(_b, format='png', dpi=110, bbox_inches='tight'); plt.close('all')
        _img = _b64.b64encode(_b.getvalue()).decode()
except Exception:
    _img = ""
_img
`);
      setOutput(captured || "(ran successfully — no output)");
      if (figure) setImg(`data:image/png;base64,${figure}`);
    } catch (e) {
      setErr(true);
      const msg = String((e as Error).message || e);
      // pyodide puts the Python traceback in the error message; trim JS wrapper noise
      const tb = msg.includes("Traceback") ? msg.slice(msg.indexOf("Traceback")) : msg;
      setOutput(tb);
    } finally {
      setStatus((s) => (s === "running" ? "ready" : s));
    }
  }

  useEffect(() => {
    if (pyRef.current && status === "loading") setStatus("ready");
  }, [status]);

  // pick up a "Run in Python" handoff from any solver's ShareBar
  useEffect(() => {
    try {
      const handoff = sessionStorage.getItem("polysim:pycode");
      if (handoff) { setCode(handoff); sessionStorage.removeItem("polysim:pycode"); }
    } catch { /* ignore */ }
  }, []);

  const busy = status === "loading" || status === "running";

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {EXAMPLES.map((ex) => (
            <button key={ex.label} onClick={() => setCode(ex.code)} className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300">{ex.label}</button>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } }}
          spellCheck={false}
          className="h-80 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 font-mono text-[13px] leading-relaxed text-slate-800 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <div className="mt-2 flex items-center gap-3">
          <button onClick={run} disabled={busy} className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60">
            {status === "loading" ? "Loading Python…" : status === "running" ? "Running…" : "▶ Run"}
          </button>
          <span className="text-xs text-slate-500">
            {status === "idle" && "Runs 100% in your browser · ⌘/Ctrl+Enter"}
            {status === "loading" && "Downloading Pyodide (~10MB, first run only)…"}
            {(status === "ready" || status === "running") && "Python ready · NumPy · SciPy · Matplotlib"}
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Output</p>
        <pre className={`min-h-[8rem] flex-1 overflow-auto whitespace-pre-wrap rounded-xl border p-3 font-mono text-[12px] leading-relaxed ${err ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-300" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"}`}>{output || "Run some Python to see the output here."}</pre>
        {img && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="Matplotlib figure" className="mx-auto max-w-full rounded" />
          </div>
        )}
      </div>
    </div>
  );
}
