"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { ExplainResult } from "./SolverExtras";
import { hidpi } from "@/lib/studioKit";

const CW = 760, CH = 420;

const MATERIALS: Record<string, { rho: number; cost: number; process: string }> = {
  "Aluminum 6061": { rho: 2.70, cost: 7, process: "laser / CNC / waterjet" },
  "Mild steel": { rho: 7.85, cost: 2.5, process: "laser / CNC / waterjet" },
  "Acrylic": { rho: 1.18, cost: 4, process: "laser cut" },
  "Plywood": { rho: 0.60, cost: 2, process: "laser / CNC" },
  "PLA (3D print)": { rho: 1.24, cost: 25, process: "3D print" },
};

// Fab services to route the exported file to (add your affiliate/referral IDs to the URLs).
const FAB_SERVICES: Record<string, { name: string; url: string }[]> = {
  cut: [
    { name: "SendCutSend", url: "https://sendcutsend.com/" },
    { name: "Xometry", url: "https://www.xometry.com/quote/" },
    { name: "Ponoko", url: "https://www.ponoko.com/" },
  ],
  print: [
    { name: "Craftcloud", url: "https://craftcloud3d.com/" },
    { name: "Treatstock", url: "https://www.treatstock.com/" },
  ],
};

function boltFor(dia: number): string {
  const table: [number, string][] = [[3.4, "M3"], [4.5, "M4"], [5.5, "M5"], [6.6, "M6"], [9, "M8"], [11, "M10"]];
  for (const [d, name] of table) if (dia <= d) return name;
  return "M12";
}

type Hole = { x: number; y: number };
type Geom = { W: number; H: number; holes: Hole[]; inside: (x: number, y: number) => boolean; dxf: string; bendY?: number; area: number; desc: string };

// DXF R12 entity helpers.
const dxfLine = (x1: number, y1: number, x2: number, y2: number, layer = "0") => `0\nLINE\n8\n${layer}\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}\n`;
const dxfCircle = (cx: number, cy: number, r: number, layer = "0") => `0\nCIRCLE\n8\n${layer}\n10\n${cx}\n20\n${cy}\n40\n${r}\n`;

function buildGeom(shape: string, p: Record<string, number>): Geom {
  const r = p.holeDia / 2;
  if (shape === "round") {
    const D = p.D, R = D / 2, cx = R, cy = R;
    const holes: Hole[] = [];
    if (p.centerHole) holes.push({ x: cx, y: cy });
    const bcr = p.bcd / 2;
    for (let i = 0; i < p.boltHoles; i++) { const a = (i / p.boltHoles) * Math.PI * 2 - Math.PI / 2; holes.push({ x: cx + bcr * Math.cos(a), y: cy + bcr * Math.sin(a) }); }
    return { W: D, H: D, holes, inside: (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= R * R, dxf: dxfCircle(cx, cy, R), area: Math.PI * R * R, desc: `Ø${D} round plate · ${p.boltHoles} on Ø${p.bcd} bolt circle` };
  }
  if (shape === "lbracket") {
    const t = p.thick, R = p.bendR, K = 0.4;
    const fa = Math.max(5, p.flangeA - (R + t)), fb = Math.max(5, p.flangeB - (R + t));
    const BA = (Math.PI / 2) * (R + K * t);
    const flat = fa + BA + fb, Wd = p.width, m = p.margin, bendY = fa + BA / 2;
    const rowY = [fa / 2, fa + BA + fb / 2];
    const holes: Hole[] = [];
    const n = p.holesPerFlange, xs = n > 1 ? Array.from({ length: n }, (_, i) => m + (i / (n - 1)) * (Wd - 2 * m)) : [Wd / 2];
    for (const y of rowY) for (const x of xs) holes.push({ x, y });
    const dxf = dxfLine(0, 0, Wd, 0) + dxfLine(Wd, 0, Wd, flat) + dxfLine(Wd, flat, 0, flat) + dxfLine(0, flat, 0, 0) + dxfLine(0, bendY, Wd, bendY, "BEND");
    return { W: Wd, H: flat, holes, inside: (x, y) => x >= 0 && x <= Wd && y >= 0 && y <= flat, dxf, bendY, area: Wd * flat, desc: `L-bracket flat pattern ${p.flangeA}+${p.flangeB} mm, ${flat.toFixed(1)} mm flat` };
  }
  // plate
  const W = p.W, H = p.H, m = p.margin;
  let holes: Hole[];
  if (p.layout === 0) holes = [{ x: m, y: m }, { x: W - m, y: m }, { x: m, y: H - m }, { x: W - m, y: H - m }];
  else { holes = []; const gx = p.cols > 1 ? (W - 2 * m) / (p.cols - 1) : 0, gy = p.rows > 1 ? (H - 2 * m) / (p.rows - 1) : 0; for (let rr = 0; rr < p.rows; rr++) for (let c = 0; c < p.cols; c++) holes.push({ x: m + c * gx, y: m + rr * gy }); }
  const dxf = dxfLine(0, 0, W, 0) + dxfLine(W, 0, W, H) + dxfLine(W, H, 0, H) + dxfLine(0, H, 0, 0);
  return { W, H, holes, inside: (x, y) => x >= 0 && x <= W && y >= 0 && y <= H, dxf, area: W * H, desc: `${W}×${H} plate` };
}

function genDXF(g: Geom, r: number): string {
  let s = "0\nSECTION\n2\nENTITIES\n" + g.dxf;
  for (const h of g.holes) s += dxfCircle(h.x, h.y, r);
  return s + "0\nENDSEC\n0\nEOF\n";
}

function genSTL(g: Geom, T: number, r: number): { stl: string; tris: number } {
  const long = Math.max(g.W, g.H), N = Math.min(52, Math.max(20, Math.round(long)));
  const nx = Math.max(2, Math.round((N * g.W) / long)), ny = Math.max(2, Math.round((N * g.H) / long));
  const sx = g.W / nx, sy = g.H / ny;
  const solid = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= nx || j >= ny) return false;
    const cx = (i + 0.5) * sx, cy = (j + 0.5) * sy;
    if (!g.inside(cx, cy)) return false;
    for (const h of g.holes) if (Math.hypot(cx - h.x, cy - h.y) < r) return false;
    return true;
  };
  const out: string[] = ["solid polysim_part"]; let tris = 0;
  const F = (n: number[], a: number[], b: number[], c: number[]) => { out.push(`facet normal ${n.join(" ")}`, "outer loop", `vertex ${a.join(" ")}`, `vertex ${b.join(" ")}`, `vertex ${c.join(" ")}`, "endloop", "endfacet"); tris++; };
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    if (!solid(i, j)) continue;
    const x0 = i * sx, x1 = (i + 1) * sx, y0 = j * sy, y1 = (j + 1) * sy;
    F([0, 0, 1], [x0, y0, T], [x1, y0, T], [x1, y1, T]); F([0, 0, 1], [x0, y0, T], [x1, y1, T], [x0, y1, T]);
    F([0, 0, -1], [x0, y0, 0], [x1, y1, 0], [x1, y0, 0]); F([0, 0, -1], [x0, y0, 0], [x0, y1, 0], [x1, y1, 0]);
    if (!solid(i - 1, j)) { F([-1, 0, 0], [x0, y0, 0], [x0, y1, 0], [x0, y1, T]); F([-1, 0, 0], [x0, y0, 0], [x0, y1, T], [x0, y0, T]); }
    if (!solid(i + 1, j)) { F([1, 0, 0], [x1, y0, 0], [x1, y1, T], [x1, y1, 0]); F([1, 0, 0], [x1, y0, 0], [x1, y0, T], [x1, y1, T]); }
    if (!solid(i, j - 1)) { F([0, -1, 0], [x0, y0, 0], [x1, y0, T], [x1, y0, 0]); F([0, -1, 0], [x0, y0, 0], [x0, y0, T], [x1, y0, T]); }
    if (!solid(i, j + 1)) { F([0, 1, 0], [x0, y1, 0], [x1, y1, 0], [x1, y1, T]); F([0, 1, 0], [x0, y1, 0], [x1, y1, T], [x0, y1, T]); }
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
  const [shape, setShape] = useState("plate");
  const [material, setMaterial] = useState("Aluminum 6061");
  const [thick, setThick] = useState(4);
  const [holeDia, setHoleDia] = useState(5);
  const [margin, setMargin] = useState(10);
  // plate
  const [W, setW] = useState(120); const [H, setH] = useState(80);
  const [layout, setLayout] = useState(0); const [rows, setRows] = useState(2); const [cols, setCols] = useState(3);
  // round
  const [D, setD] = useState(100); const [bcd, setBcd] = useState(70); const [boltHoles, setBoltHoles] = useState(6); const [centerHole, setCenterHole] = useState(1);
  // lbracket
  const [flangeA, setFlangeA] = useState(60); const [flangeB, setFlangeB] = useState(40); const [width, setWidth] = useState(40); const [bendR, setBendR] = useState(3); const [holesPerFlange, setHolesPerFlange] = useState(2);

  const r = holeDia / 2;
  const g = useMemo(() => buildGeom(shape, { holeDia, thick, margin, W, H, layout, rows, cols, D, bcd, boltHoles, centerHole, flangeA, flangeB, width, bendR, holesPerFlange }),
    [shape, holeDia, thick, margin, W, H, layout, rows, cols, D, bcd, boltHoles, centerHole, flangeA, flangeB, width, bendR, holesPerFlange]);
  const stlObj = useMemo(() => genSTL(g, thick, r), [g, thick, r]);

  const mat = MATERIALS[material];
  const holeArea = g.holes.length * Math.PI * r * r;
  const volume_cm3 = ((g.area - holeArea) * thick) / 1000;
  const mass_g = volume_cm3 * mat.rho;
  const total = (mass_g / 1000) * mat.cost + g.holes.length * 0.4;
  const bolt = boltFor(holeDia);

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, CW, CH);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, CW, CH);
    const pad = 60, scale = Math.min((CW - 2 * pad) / g.W, (CH - 2 * pad) / g.H);
    const ox = (CW - g.W * scale) / 2, oy = (CH - g.H * scale) / 2;
    const X = (x: number) => ox + x * scale, Y = (y: number) => oy + (g.H - y) * scale;
    // outline
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.fillStyle = "rgba(34,211,238,0.10)";
    if (shape === "round") { ctx.beginPath(); ctx.arc(X(g.W / 2), Y(g.H / 2), (g.W / 2) * scale, 0, 7); ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.rect(X(0), Y(g.H), g.W * scale, g.H * scale); ctx.fill(); ctx.stroke(); }
    // bend line (L-bracket)
    if (g.bendY != null) {
      ctx.strokeStyle = "#f59e0b"; ctx.setLineDash([8, 5]); ctx.beginPath(); ctx.moveTo(X(0), Y(g.bendY)); ctx.lineTo(X(g.W), Y(g.bendY)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#f59e0b"; ctx.font = "11px sans-serif"; ctx.textAlign = "left"; ctx.fillText("↳ bend 90° here", X(g.W) - 90, Y(g.bendY) - 5);
    }
    // holes
    ctx.fillStyle = "#020617"; ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 1.5;
    for (const h of g.holes) { ctx.beginPath(); ctx.arc(X(h.x), Y(h.y), r * scale, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`${material} · ${thick} mm · ${g.holes.length}× Ø${holeDia} · ${g.desc}`, 12, 20);
  }, [g, thick, holeDia, r, material, shape]);

  const bomText = `PolySim OS — Bill of Materials
Part: ${material}, ${g.desc}, ${thick} mm thick  (${g.holes.length}× Ø${holeDia} mm)
Process: ${mat.process}${g.bendY != null ? "  (cut flat, then bend 90° on the marked line)" : ""}
--------------------------------------------------
1× Stock    ${material}, ${thick}mm   ~${mass_g.toFixed(0)} g   ~$${((mass_g / 1000) * mat.cost).toFixed(2)}
${g.holes.length}× Bolt     ${bolt} socket-head cap screw
${g.holes.length}× Nut      ${bolt} hex nut
${g.holes.length}× Washer   ${bolt} flat washer
--------------------------------------------------
Estimated materials: ~$${total.toFixed(2)}  (excl. machining/shipping)
Find fasteners: https://www.amazon.com/s?k=${bolt}+socket+head+cap+screw`;

  const explain = `${g.desc} in ${material} (${thick} mm, ${g.holes.length}× Ø${holeDia} mm, ${bolt} clearance). Download the DXF for an exact ${mat.process} cut${g.bendY != null ? " (the flat pattern — cut it, then bend 90° on the dashed line; bend allowance is already applied)" : ""}, the STL to 3D-print (${stlObj.tris.toLocaleString()} triangles), or the BOM. Est. mass ~${mass_g.toFixed(0)} g, ~$${total.toFixed(2)}. Prototyping aid — verify fit and load with real testing.`;

  return (
    <StudioChrome
      title="Fabricate"
      tagline="turn a design into a real, orderable part"
      controls={
        <div>
          <div className="mb-3 flex gap-1.5">
            {[["plate", "Plate"], ["round", "Round"], ["lbracket", "L-bracket"]].map(([k, lbl]) => <button key={k} onClick={() => setShape(k)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${shape === k ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{lbl}</button>)}
          </div>
          <div className="mb-3">
            <label className="text-xs text-slate-500">Material</label>
            <select value={material} onChange={(e) => setMaterial(e.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950">
              {Object.keys(MATERIALS).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <Slider label="Thickness (mm)" value={thick} min={1} max={12} step={0.5} onChange={setThick} />
          <Slider label="Hole Ø (mm)" value={holeDia} min={2} max={12} step={0.5} onChange={setHoleDia} />

          {shape === "plate" && <>
            <Slider label="Width (mm)" value={W} min={30} max={300} step={5} onChange={setW} />
            <Slider label="Height (mm)" value={H} min={30} max={200} step={5} onChange={setH} />
            <Slider label="Edge margin (mm)" value={margin} min={5} max={30} step={1} onChange={setMargin} />
            <div className="mt-2 mb-2 flex gap-1.5">{[["Corners", 0], ["Grid", 1]].map(([lbl, v]) => <button key={lbl} onClick={() => setLayout(v as number)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${layout === v ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{lbl}</button>)}</div>
            {layout === 1 && <div className="grid grid-cols-2 gap-2"><Slider label="Rows" value={rows} min={1} max={6} step={1} onChange={setRows} /><Slider label="Cols" value={cols} min={1} max={8} step={1} onChange={setCols} /></div>}
          </>}
          {shape === "round" && <>
            <Slider label="Diameter (mm)" value={D} min={40} max={300} step={5} onChange={setD} />
            <Slider label="Bolt circle Ø (mm)" value={bcd} min={20} max={D - 10} step={5} onChange={setBcd} />
            <Slider label="Bolt holes" value={boltHoles} min={2} max={12} step={1} onChange={setBoltHoles} />
            <label className="mt-1 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={!!centerHole} onChange={(e) => setCenterHole(e.target.checked ? 1 : 0)} /> center hole</label>
          </>}
          {shape === "lbracket" && <>
            <Slider label="Flange A (mm)" value={flangeA} min={20} max={150} step={5} onChange={setFlangeA} />
            <Slider label="Flange B (mm)" value={flangeB} min={20} max={150} step={5} onChange={setFlangeB} />
            <Slider label="Width (mm)" value={width} min={20} max={120} step={5} onChange={setWidth} />
            <Slider label="Bend radius (mm)" value={bendR} min={1} max={10} step={0.5} onChange={setBendR} />
            <Slider label="Holes / flange" value={holesPerFlange} min={1} max={4} step={1} onChange={setHolesPerFlange} />
            <Slider label="Edge margin (mm)" value={margin} min={5} max={25} step={1} onChange={setMargin} />
          </>}

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => download(`polysim-${shape}.dxf`, genDXF(g, r), "application/dxf")} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700">⤓ DXF (laser/CNC)</button>
            <button onClick={() => download(`polysim-${shape}.stl`, stlObj.stl, "model/stl")} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700">⤓ STL (3D print)</button>
            <button onClick={() => download(`polysim-${shape}-BOM.txt`, bomText, "text/plain")} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-cyan-400 dark:border-slate-700 dark:text-slate-300">⤓ Bill of Materials</button>
          </div>
          <div className="mt-3 rounded-lg border border-cyan-300/40 bg-cyan-500/5 p-3 text-xs dark:border-cyan-500/30">
            <div className="font-semibold text-slate-800 dark:text-slate-200">Get it made</div>
            <p className="mt-0.5 text-slate-500">Upload your {mat.process.includes("3D print") ? "STL" : "DXF"} for an instant quote:</p>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {(FAB_SERVICES[mat.process.includes("3D print") ? "print" : "cut"]).map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener" className="font-medium text-cyan-700 hover:underline dark:text-cyan-400">{s.name} →</a>
              ))}
              <a href={`https://www.amazon.com/s?k=${bolt}+socket+head+cap+screw`} target="_blank" rel="noopener" className="font-medium text-cyan-700 hover:underline dark:text-cyan-400">{bolt} fasteners →</a>
            </div>
          </div>
        </div>
      }
      inspector={
        <div>
          <Stat label="Part" value={g.desc} />
          <Stat label="Holes" value={`${g.holes.length}× Ø${holeDia} (${bolt})`} />
          {g.bendY != null && <Stat label="Flat length" value={`${g.H.toFixed(1)} mm`} />}
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
