"use client";

import { useEffect, useMemo, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 430;
const G = 160;          // grid size (G×G binary image)
const N = G * G;

type Op = "Erosion" | "Dilation" | "Opening" | "Closing" | "Gradient";
type Shape = "square" | "cross" | "disk";

// ---- Procedural binary test image ---------------------------------------
// Deterministic (seeded) so every visitor sees the same shapes. Includes solid
// blobs, isolated noise specks, thin bridges, and small interior holes so the
// effect of open/close/erode/dilate is immediately obvious.
function makeImage(): Uint8Array {
  const img = new Uint8Array(N);
  const set = (x: number, y: number, v = 1) => {
    if (x >= 0 && x < G && y >= 0 && y < G) img[y * G + x] = v;
  };
  const disk = (cx: number, cy: number, r: number, v = 1) => {
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, v);
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, v = 1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, v);
  };

  // Solid blobs
  rect(16, 22, 66, 70);              // filled rectangle
  disk(112, 44, 27);                 // filled disk
  rect(22, 104, 52, 138);            // lower-left block

  // Thin bridge joining rectangle and disk (2px tall — vanishes under opening)
  rect(66, 45, 86, 46);
  // Thin diagonal filament (1px — the first thing erosion removes)
  for (let t = 0; t < 40; t++) set(70 + t, 120 - Math.round(t * 0.6));

  // Small interior holes (filled by closing / dilation)
  disk(112, 44, 4, 0);               // hole in the disk
  rect(30, 34, 33, 37, 0);           // square hole in the rectangle
  rect(48, 52, 49, 58, 0);           // hairline crack in the rectangle
  disk(37, 120, 3, 0);               // hole in the lower block

  // Isolated noise specks on the background (removed by erosion / opening)
  let s = 1337;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < 60; i++) {
    const x = 4 + Math.floor(rnd() * (G - 8));
    const y = 4 + Math.floor(rnd() * (G - 8));
    if (img[y * G + x]) continue;    // keep specks on background
    set(x, y);
    if (rnd() > 0.55) set(x + 1, y); // occasional 2px speck
  }
  return img;
}

// ---- Structuring element ------------------------------------------------
function makeSE(shape: Shape, r: number): [number, number][] {
  const offs: [number, number][] = [];
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const inc =
        shape === "square" ? true :
        shape === "cross" ? dx === 0 || dy === 0 :
        dx * dx + dy * dy <= r * r;   // disk
      if (inc) offs.push([dx, dy]);
    }
  return offs;
}

// ---- Binary morphology (real implementations) ---------------------------
function erode(img: Uint8Array, se: [number, number][]): Uint8Array {
  const out = new Uint8Array(N);
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++) {
      let keep = 1;
      for (const [dx, dy] of se) {
        const nx = x + dx, ny = y + dy;
        // Out-of-bounds treated as background (scipy border_value=0).
        if (nx < 0 || nx >= G || ny < 0 || ny >= G || img[ny * G + nx] === 0) { keep = 0; break; }
      }
      out[y * G + x] = keep;
    }
  return out;
}
function dilate(img: Uint8Array, se: [number, number][]): Uint8Array {
  const out = new Uint8Array(N);
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++) {
      let hit = 0;
      for (const [dx, dy] of se) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < G && ny >= 0 && ny < G && img[ny * G + nx] === 1) { hit = 1; break; }
      }
      out[y * G + x] = hit;
    }
  return out;
}
const applyN = (fn: (a: Uint8Array, se: [number, number][]) => Uint8Array, img: Uint8Array, se: [number, number][], n: number) => {
  let cur = img;
  for (let i = 0; i < n; i++) cur = fn(cur, se);
  return cur;
};

const OPS: Op[] = ["Erosion", "Dilation", "Opening", "Closing", "Gradient"];
const SHAPES: Shape[] = ["square", "cross", "disk"];

const PRESETS: Record<string, { op: Op; shape: Shape; radius: number; iterations: number }> = {
  "Despeckle (open)": { op: "Opening", shape: "disk", radius: 2, iterations: 1 },
  "Fill holes (close)": { op: "Closing", shape: "disk", radius: 3, iterations: 1 },
  "Extract edges": { op: "Gradient", shape: "square", radius: 1, iterations: 1 },
  "Shrink (erode ×2)": { op: "Erosion", shape: "cross", radius: 1, iterations: 2 },
};

export function MorphologyStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const image = useMemo(makeImage, []);
  const opRef = useRef<Op>("Opening");
  const shapeRef = useRef<Shape>("disk");
  // op & shape live in the URL-mirrored numeric store as indices, so shared links restore them.
  const [{ opIdx, shapeIdx, radius, iterations }, update] = useShareableNumbers({ opIdx: 2, shapeIdx: 2, radius: 2, iterations: 1 });
  const op = OPS[Math.max(0, Math.min(OPS.length - 1, Math.round(opIdx)))];
  const shape = SHAPES[Math.max(0, Math.min(SHAPES.length - 1, Math.round(shapeIdx)))];
  opRef.current = op; shapeRef.current = shape;

  const { result, added, removed, fgPct, origPct } = useMemo(() => {
    const r = Math.max(1, Math.round(radius));
    const it = Math.max(1, Math.round(iterations));
    const se = makeSE(shape, r);
    let res: Uint8Array;
    if (op === "Erosion") res = applyN(erode, image, se, it);
    else if (op === "Dilation") res = applyN(dilate, image, se, it);
    else if (op === "Opening") res = applyN(dilate, applyN(erode, image, se, it), se, it);
    else if (op === "Closing") res = applyN(erode, applyN(dilate, image, se, it), se, it);
    else {
      const d = applyN(dilate, image, se, it), e = applyN(erode, image, se, it);
      res = new Uint8Array(N);
      for (let i = 0; i < N; i++) res[i] = d[i] && !e[i] ? 1 : 0;
    }
    let a = 0, rem = 0, fg = 0, of = 0;
    for (let i = 0; i < N; i++) {
      if (res[i]) fg++;
      if (image[i]) of++;
      if (res[i] && !image[i]) a++;
      if (!res[i] && image[i]) rem++;
    }
    return { result: res, added: a, removed: rem, fgPct: (100 * fg) / N, origPct: (100 * of) / N };
  }, [image, op, shape, radius, iterations]);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);

    const pad = 16, gap = 24, labelH = 26;
    const half = (W - 2 * pad - gap) / 2;
    const panel = Math.min(half, H - 2 * pad - labelH);
    const topY = pad + labelH;
    const leftX = pad + (half - panel) / 2;
    const rightX = pad + half + gap + (half - panel) / 2;

    // Render a G×G binary grid into a panel, upscaled with nearest-neighbour.
    const paint = (res: Uint8Array, x: number, y: number, isResult: boolean) => {
      const off = document.createElement("canvas"); off.width = G; off.height = G;
      const octx = off.getContext("2d")!;
      const id = octx.createImageData(G, G);
      for (let i = 0; i < N; i++) {
        const o = image[i], r = res[i];
        let cr: number, cg: number, cb: number;
        if (!isResult) { if (o) { cr = cg = cb = 214; } else { cr = 15; cg = 23; cb = 42; } }
        else if (r && o) { cr = cg = cb = 214; }                 // unchanged foreground
        else if (r && !o) { cr = 74; cg = 222; cb = 128; }       // added -> green
        else if (!r && o) { cr = 205; cg = 62; cb = 108; }       // removed -> pink ghost
        else { cr = 15; cg = 23; cb = 42; }                      // background
        id.data[i * 4] = cr; id.data[i * 4 + 1] = cg; id.data[i * 4 + 2] = cb; id.data[i * 4 + 3] = 255;
      }
      octx.putImageData(id, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, x, y, panel, panel);
      ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, panel, panel);
    };

    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 13px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Original", leftX, pad + 16);
    ctx.fillText(`${op}  ·  ${shape} r${Math.max(1, Math.round(radius))} ×${Math.max(1, Math.round(iterations))}`, rightX, pad + 16);

    paint(image, leftX, topY, false);
    paint(result, rightX, topY, true);

    // Legend
    const ly = topY + panel + 10;
    const chip = (cx: number, col: string, txt: string) => {
      ctx.fillStyle = col; ctx.fillRect(cx, ly, 10, 10);
      ctx.fillStyle = "#94a3b8"; ctx.font = "500 11px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(txt, cx + 15, ly + 9);
    };
    chip(rightX, "#4ade80", "added");
    chip(rightX + 78, "#cd3e6c", "removed");
  }, [image, result, op, shape, radius, iterations]);

  const TEX: Record<Op, string> = {
    Erosion: "A \\ominus B",
    Dilation: "A \\oplus B",
    Opening: "A \\circ B = (A \\ominus B) \\oplus B",
    Closing: "A \\bullet B = (A \\oplus B) \\ominus B",
    Gradient: "\\partial B = (A \\oplus B) - (A \\ominus B)",
  };

  const EXPLAIN: Record<Op, string> = {
    Erosion: `Erosion keeps a foreground pixel only where the whole structuring element fits inside the shape, so it peels a layer off every boundary. Here it removed ${removed} pixels — the outer rims, the isolated noise specks, and the thin bridge/filament, which are all narrower than the element.`,
    Dilation: `Dilation turns on any pixel the structuring element can reach from the foreground, growing every region outward. It added ${added} pixels — filling the small holes, closing hairline cracks, thickening thin features, and merging nearby shapes.`,
    Opening: `Opening = erosion then dilation. The erosion deletes anything thinner than the element (${removed} pixels: specks, the 1px filament, the 2px bridge) and the dilation restores the size of what survived — so small objects disappear while the big blobs keep their footprint.`,
    Closing: `Closing = dilation then erosion. The dilation fills small gaps and the erosion pulls the outer boundary back, so interior holes and cracks are sealed (${added} pixels filled) without the shapes growing overall.`,
    Gradient: `The morphological gradient is dilation minus erosion, leaving only the boundary shell — a roughly one-element-wide outline of every shape (${fgPct.toFixed(1)}% of the image). It is a fast, direction-free edge detector for binary masks.`,
  };

  const shapePy =
    shape === "square" ? "B = np.ones((2*r+1, 2*r+1), bool)" :
    shape === "cross" ? "B = (xx == 0) | (yy == 0)" :
    "B = (xx**2 + yy**2) <= r**2";
  const opPy: Record<Op, string> = {
    Erosion: "out = ndimage.binary_erosion(A, B, iterations=it)",
    Dilation: "out = ndimage.binary_dilation(A, B, iterations=it)",
    Opening: "out = ndimage.binary_dilation(ndimage.binary_erosion(A, B, iterations=it), B, iterations=it)",
    Closing: "out = ndimage.binary_erosion(ndimage.binary_dilation(A, B, iterations=it), B, iterations=it)",
    Gradient: "out = ndimage.binary_dilation(A, B, iterations=it) ^ ndimage.binary_erosion(A, B, iterations=it)",
  };
  const code = `import numpy as np
from scipy import ndimage

# A is your binary image (H x W array of 0/1). See the studio for the test pattern.
A = (np.random.rand(160, 160) > 0.5)  # <- replace with your own mask

r, it = ${Math.max(1, Math.round(radius))}, ${Math.max(1, Math.round(iterations))}
yy, xx = np.ogrid[-r:r+1, -r:r+1]
${shapePy}          # structuring element: ${shape}

${opPy[op]}
print("foreground %:", round(100 * out.mean(), 2))`;

  return (
    <StudioChrome title="Morphology Studio" tagline="binary erosion, dilation, opening & closing"
      controls={<div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Operation</p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {OPS.map((o) => (
            <button key={o} onClick={() => update({ opIdx: OPS.indexOf(o) })}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${op === o ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{o}</button>
          ))}
        </div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Structuring element</p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {SHAPES.map((s) => (
            <button key={s} onClick={() => update({ shapeIdx: SHAPES.indexOf(s) })}
              className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${shape === s ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{s}</button>
          ))}
        </div>
        <p className="mb-3 text-xs text-slate-500">Green marks pixels the operation added; pink marks pixels it removed. Try Opening to erase noise, Closing to fill holes.</p>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => { const p = PRESETS[label]; update({ opIdx: OPS.indexOf(p.op), shapeIdx: SHAPES.indexOf(p.shape), radius: p.radius, iterations: p.iterations }); }}
        />
        <Slider label="SE radius" value={radius} min={1} max={5} step={1} onChange={(v) => update({ radius: v })} />
        <Slider label="Iterations" value={iterations} min={1} max={5} step={1} onChange={(v) => update({ iterations: v })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Operation" value={op} />
        <Stat label="Element" value={`${shape} · r=${Math.max(1, Math.round(radius))}`} />
        <Stat label="Iterations" value={`${Math.max(1, Math.round(iterations))}`} />
        <Stat label="Foreground" value={`${fgPct.toFixed(1)}%`} />
        <Stat label="Was" value={`${origPct.toFixed(1)}%`} />
        <Stat label="Added / removed" value={`+${added} / −${removed}`} />
        <Equation tex={TEX[op]} />
        <ExplainResult text={EXPLAIN[op]} />
      </div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
