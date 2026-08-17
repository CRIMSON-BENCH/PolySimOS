"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

const W = 640, H = 480;

export function FractalStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"mandelbrot" | "julia">("mandelbrot");
  const [maxIter, setMaxIter] = useState(150);
  const view = useRef({ cx: -0.5, cy: 0, scale: 3 });
  const julia = useRef({ x: -0.8, y: 0.156 });
  const [, force] = useState(0);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    const img = ctx.createImageData(W, H);
    const { cx, cy, scale } = view.current;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const x0 = cx + (px / W - 0.5) * scale, y0 = cy + (py / H - 0.5) * scale * (H / W);
      let zx = mode === "mandelbrot" ? 0 : x0, zy = mode === "mandelbrot" ? 0 : y0;
      const jx = mode === "mandelbrot" ? x0 : julia.current.x, jy = mode === "mandelbrot" ? y0 : julia.current.y;
      let it = 0;
      while (zx * zx + zy * zy <= 4 && it < maxIter) { const xt = zx * zx - zy * zy + jx; zy = 2 * zx * zy + jy; zx = xt; it++; }
      const i = (py * W + px) * 4;
      if (it === maxIter) { img.data[i] = 4; img.data[i + 1] = 6; img.data[i + 2] = 23; }
      else { const t = it / maxIter; const h = 200 + t * 140; const c = hsl(h, 0.8, 0.2 + t * 0.5); img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; }
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [mode, maxIter]);

  const zoom = (e: React.MouseEvent<HTMLCanvasElement>, factor: number) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    const v = view.current;
    v.cx += (px - 0.5) * v.scale; v.cy += (py - 0.5) * v.scale * (H / W); v.scale *= factor;
    force((n) => n + 1);
  };

  return (
    <StudioChrome title="Fractal Explorer" tagline="Mandelbrot & Julia sets · escape-time"
      controls={<div>
        <div className="mb-3 flex gap-2">
          {(["mandelbrot", "julia"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold capitalize ${mode === m ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{m}</button>)}
        </div>
        <p className="mb-3 text-xs text-slate-500">Left-click to zoom in, right-click to zoom out.</p>
        <Slider label="Max iterations" value={maxIter} min={50} max={500} step={25} onChange={setMaxIter} />
        {mode === "julia" && <>
          <Slider label="Julia c (real)" value={julia.current.x} min={-1} max={1} step={0.01} onChange={(v) => { julia.current.x = v; force((n) => n + 1); }} />
          <Slider label="Julia c (imag)" value={julia.current.y} min={-1} max={1} step={0.01} onChange={(v) => { julia.current.y = v; force((n) => n + 1); }} />
        </>}
        <button onClick={() => { view.current = { cx: mode === "mandelbrot" ? -0.5 : 0, cy: 0, scale: 3 }; force((n) => n + 1); }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Reset view</button>
      </div>}
      inspector={<div><Stat label="Set" value={mode} /><Stat label="Zoom" value={`${(3 / view.current.scale).toFixed(1)}×`} /><Stat label="Iterations" value={String(maxIter)} /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} onClick={(e) => zoom(e, 0.5)} onContextMenu={(e) => { e.preventDefault(); zoom(e, 2); }} className="mx-auto h-auto max-h-[460px] cursor-crosshair rounded-lg" />
    </StudioChrome>
  );
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))))); };
  return [f(0), f(8), f(4)];
}
