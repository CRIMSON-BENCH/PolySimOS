"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { ExplainResult } from "./SolverExtras";
import { hidpi } from "@/lib/studioKit";

const CW = 760, CH = 420;

// Materials: density (g/cm³) + rough stock cost ($/kg) for BOM estimates.
const MATERIALS: Record<string, { rho: number; cost: number; process: string }> = {
  "Aluminum 6061": { rho: 2.70, cost: 7, process: "laser / CNC / waterjet" },
  "Mild steel": { rho: 7.85, cost: 2.5, process: "laser / CNC / waterjet" },
  "Acrylic": { rho: 1.18, cost: 4, process: "laser cut" },
  "Plywood": { rho: 0.60, cost: 2, process: "laser / CNC" },
  "PLA (3D print)": { rho: 1.24, cost: 25, process: "3D print" },
};

// Nearest clearance bolt for a given hole Ø (mm).
function boltFor(dia: number): string {
  const table: [number, string][] = [[3.4, "M3"], [4.5, "M4"], [5.5, "M5"], [6.6, "M6"], [9, "M8"], [11, "M10"]];
  for (const [d, name] of table) if (dia <= d) return name;
  return "M12";
}

type Hole = { x: number; y: number };

function holeLayout(W: number, H: number, layout: string, margin: number, rows: number, cols: number): Hole[] {
  if (layout === "corners") {
    return [[margin, margin], [W - margin, margin], [margin, H - margin], [W - margin, H - margin]].map(([x, y]) => ({ x, y }));
  }
  const hs: Hole[] = [];
  const gx = cols > 1 ? (W - 2 * margin) / (cols - 1) : 0;
  const gy = rows > 1 ? (H - 2 * margin) / (rows - 1) : 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) hs.push({ x: margin + c * gx, y: margin + r * gy });
  return hs;
}

function genDXF(W: number, H: number, holes: Hole[], r: number): string {
  const L = (x1: number, y1: number, x2: number, y2: number) => `0\nLINE\n8\n0\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
  const C = (cx: number, cy: number) => `0\nCIRCLE\n8\n0\n10\n${cx}\n20\n${cy}\n40\n${r}\n`;
  let s = "0\nSECTION\n2\nENTITIES\n";
  s += L(0, 0, W, 0) + L(W, 0, W, H) + L(W, H, 0, H) + L(0, H, 0, 0);
  for (const h of holes) s += C(h.x, h.y);
  s += "0\nENDSEC\n0\nEOF\n";
  return s;
}

// Watertight extruded solid (rectangle minus circular holes) as ASCII STL, via a capped voxel grid.
function genSTL(W: number, H: number, T: number, holes: Hole[], r: number): { stl: string; tris: number } {
  const long = Math.max(W, H);
  const N = Math.min(52, Math.max(20, Math.round(long)));
  const nx = Math.max(2, Math.round((N * W) / long)), ny = Math.max(2, Math.round((N * H) / long));
  const sx = W / nx, sy = H / ny;
  const solid = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= nx || j >= ny) return false;
    const cx = (i + 0.5) * sx, cy = (j + 0.5) * sy;
    for (const h of holes) if (Math.hypot(cx - h.x, cy - h.y) < r) return false;
    return true;
  };
  const out: string[] = ["solid polysim_part"];
  const facet = (n: number[], a: number[], b: number[], c: number[]) =>
    out.push(`facet normal ${n[0]} ${n[1]} ${n[2]}`, "outer loop", `vertex ${a.join(" ")}`, `vertex ${b.join(" ")}`, `vertex ${c.join(" ")}`, "endloop", "endfacet");
  let tris = 0;
  const T2 = (n: number[], a: number[], b: number[], c: number[]) => { facet(n, a, b, c); tris++; };
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    if (!solid(i, j)) continue;
    const x0 = i * sx, x1 = (i + 1) * sx, y0 = j * sy, y1 = (j + 1) * sy;
    T2([0, 0, 1], [x0, y0, T], [x1, y0, T], [x1, y1, T]); T2([0, 0, 1], [x0, y0, T], [x1, y1, T], [x0, y1, T]);
    T2([0, 0, -1], [x0, y0, 0], [x1, y1, 0], [x1, y0, 0]); T2([0, 0, -1], [x0, y0, 0], [x0, y1, 0], [x1, y1, 0]);
    if (!solid(i - 1, j)) { T2([-1, 0, 0], [x0, y0, 0], [x0, y1, 0], [x0, y1, T]); T2([-1, 0, 0], [x0, y0, 0], [x0, y1, T], [x0, y0, T]); }
    if (!solid(i + 1, j)) { T2([1, 0, 0], [x1, y0, 0], [x1, y1, T], [x1, y1, 0]); T2([1, 0, 0], [x1, y0, 0], [x1, y0, T], [x1, y1, T]); }
    if (!solid(i, j - 1)) { T2([0, -1, 0], [x0, y0, 0], [x1, y0, T], [x1, y0, 0]); T2([0, -1, 0], [x0, y0, 0], [x0, y0, T], [x1, y0, T]); }
    if (!solid(i, j + 1)) { T2([0, 1, 0], [x0, y1, 0], [x1, y1, 0], [x1, y1, T]); T2([0, 1, 0], [x0, y1, 0], [x1, y1, T], [x0, y1, T]); }
  }
  out.push("endsolid polysim_part");
  return { stl: out.join("\n"), tris };
}

function download(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function FabricateStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [material, setMaterial] = useState("Aluminum 6061");
  const [W, setW] = useState(120);
  const [H, setH] = useState(80);
  const [thick, setThick] = useState(4);
  const [holeDia, setHoleDia] = useState(5);
  const [layout, setLayout] = useState("corners");
  const [margin, setMargin] = useState(10);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(3);

  const holes = useMemo(() => holeLayout(W, H, layout, margin, rows, cols), [W, H, layout, margin, rows, cols]);
  const r = holeDia / 2;
  const stlObj = useMemo(() => genSTL(W, H, thick, holes, r), [W, H, thick, holes, r]);

  const mat = MATERIALS[material];
  const volume_cm3 = (W * H * thick - holes.length * Math.PI * r * r * thick) / 1000; // mm³→cm³
  const mass_g = volume_cm3 * mat.rho;
  const stockCost = (mass_g / 1000) * mat.cost;
  const bolt = boltFor(holeDia);
  const fastenerCost = holes.length * 0.6; // ~$0.20 bolt + nut + washer, rounded up
  const total = stockCost + fastenerCost;

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, CW, CH);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, CW, CH);
    const pad = 60, scale = Math.min((CW - 2 * pad) / W, (CH - 2 * pad) / H);
    const ox = (CW - W * scale) / 2, oy = (CH - H * scale) / 2;
    const X = (x: number) => ox + x * scale, Y = (y: number) => oy + (H - y) * scale;
    // plate
    ctx.fillStyle = "rgba(34,211,238,0.10)"; ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(X(0), Y(H), W * scale, H * scale); ctx.fill(); ctx.stroke();
    // holes
    ctx.fillStyle = "#020617"; ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 1.5;
    for (const h of holes) { ctx.beginPath(); ctx.arc(X(h.x), Y(h.y), r * scale, 0, 7); ctx.fill(); ctx.stroke(); }
    // dimensions
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`${W} mm`, CW / 2, Y(0) + 22);
    ctx.save(); ctx.translate(X(0) - 22, CH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(`${H} mm`, 0, 0); ctx.restore();
    ctx.textAlign = "left"; ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif";
    ctx.fillText(`${material} · ${thick} mm thick · ${holes.length}× Ø${holeDia} mm · top view`, 12, 20);
  }, [W, H, thick, holeDia, holes, r, material]);

  const bomText = `PolySim OS — Bill of Materials
Part: ${material} plate, ${W} × ${H} × ${thick} mm  (${holes.length}× Ø${holeDia} mm holes)
Process: ${mat.process}
--------------------------------------------------
1× Plate     ${material}, ${W}x${H}x${thick}mm   ~${mass_g.toFixed(0)} g   ~$${stockCost.toFixed(2)}
${holes.length}× Bolt     ${bolt} socket-head cap screw            ~$${(holes.length * 0.2).toFixed(2)}
${holes.length}× Nut      ${bolt} hex nut                          ~$${(holes.length * 0.1).toFixed(2)}
${holes.length}× Washer   ${bolt} flat washer                      ~$${(holes.length * 0.1).toFixed(2)}
--------------------------------------------------
Estimated total: ~$${total.toFixed(2)}  (stock + fasteners, excl. machining/shipping)
Find fasteners: https://www.amazon.com/s?k=${bolt}+socket+head+cap+screw`;

  const explain = `This ${material} plate is ${W}×${H}×${thick} mm with ${holes.length} Ø${holeDia} mm holes (${bolt} clearance). Download the DXF for an exact laser/CNC/waterjet cut, the STL to 3D-print it (${stlObj.tris.toLocaleString()} triangles), or the BOM to order the stock and ${bolt} fasteners. Estimated material mass ~${mass_g.toFixed(0)} g, ~$${total.toFixed(2)} in materials. This is a prototyping aid — verify fit and load with real testing before relying on a part.`;

  return (
    <StudioChrome
      title="Fabricate"
      tagline="turn a design into a real, orderable part"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Design a plate/bracket, then export the exact files to make it — DXF (laser/CNC), STL (3D print), and a bill of materials with fasteners.</p>
          <div className="mb-3">
            <label className="text-xs text-slate-500">Material</label>
            <select value={material} onChange={(e) => setMaterial(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950">
              {Object.keys(MATERIALS).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <Slider label="Width (mm)" value={W} min={30} max={300} step={5} onChange={setW} />
          <Slider label="Height (mm)" value={H} min={30} max={200} step={5} onChange={setH} />
          <Slider label="Thickness (mm)" value={thick} min={1} max={12} step={0.5} onChange={setThick} />
          <Slider label="Hole Ø (mm)" value={holeDia} min={2} max={12} step={0.5} onChange={setHoleDia} />
          <Slider label="Edge margin (mm)" value={margin} min={5} max={30} step={1} onChange={setMargin} />
          <div className="mt-2 mb-2 flex gap-1.5">
            {["corners", "grid"].map((l) => <button key={l} onClick={() => setLayout(l)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${layout === l ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{l}</button>)}
          </div>
          {layout === "grid" && (
            <div className="mb-2 grid grid-cols-2 gap-2">
              <Slider label="Rows" value={rows} min={1} max={6} step={1} onChange={setRows} />
              <Slider label="Cols" value={cols} min={1} max={8} step={1} onChange={setCols} />
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => download(`polysim-plate-${W}x${H}.dxf`, genDXF(W, H, holes, r), "application/dxf")} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700">⤓ DXF (laser/CNC)</button>
            <button onClick={() => download(`polysim-plate-${W}x${H}.stl`, stlObj.stl, "model/stl")} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700">⤓ STL (3D print)</button>
            <button onClick={() => download(`polysim-plate-BOM.txt`, bomText, "text/plain")} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">⤓ Bill of Materials</button>
          </div>
        </div>
      }
      inspector={
        <div>
          <Stat label="Part" value={`${W}×${H}×${thick} mm`} />
          <Stat label="Holes" value={`${holes.length}× Ø${holeDia} (${bolt})`} />
          <Stat label="Est. mass" value={`${mass_g.toFixed(0)} g`} />
          <Stat label="Est. materials" value={`$${total.toFixed(2)}`} />
          <Stat label="STL triangles" value={stlObj.tris.toLocaleString()} />
          <ExplainResult text={explain} />
        </div>
      }
    >
      <canvas ref={canvasRef} width={CW} height={CH} className="h-auto w-full rounded-lg" />
    </StudioChrome>
  );
}
