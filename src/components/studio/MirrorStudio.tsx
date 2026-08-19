"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers, useCanvasDrag } from "@/lib/studioKit";

const W = 760, H = 440;
const CX = W - 120, CY = H / 2; // mirror pole (used by both the draw effect and the drag hit-test)

const PRESETS: Record<string, { f: number; objDist: number }> = {
  "Beyond C (real, small)": { f: 120, objDist: 320 },
  "Between F and C (magnified)": { f: 100, objDist: 150 },
  "At the focus (rays parallel)": { f: 120, objDist: 120 },
  "Inside F (virtual, upright)": { f: 120, objDist: 60 },
};

export function MirrorStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ f, objDist, objH }, update] = useShareableNumbers({ f: 120, objDist: 220, objH: 70 });
  const [concave, setConcave] = useState(true);

  // Drag the object arrow in front of the mirror to set its distance (horizontal) and height (vertical).
  useCanvasDrag(canvasRef, W, H, {
    pick: (x, y) => Math.abs(x - (CX - objDist)) < 20 && y >= CY - objH - 16 && y <= CY + 16,
    move: (x, y) =>
      update({
        objDist: Math.round(Math.max(60, Math.min(340, CX - x)) / 10) * 10,
        objH: Math.round(Math.max(20, Math.min(150, CY - y))),
      }),
  });

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, W, H);
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = CX, cy = CY, F = concave ? f : -f;
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    // mirror arc
    ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx - (concave ? -400 : 400), cy, 400, concave ? Math.PI - 0.4 : -0.4, concave ? Math.PI + 0.4 : 0.4); ctx.stroke();
    ctx.fillStyle = "#64748b"; [cx - f].forEach((x) => { ctx.beginPath(); ctx.arc(x, cy, 3, 0, 7); ctx.fill(); });
    const ox = cx - objDist;
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ox, cy); ctx.lineTo(ox, cy - objH); ctx.stroke();
    // draggable handle at the arrow tip
    ctx.fillStyle = "#a3e635"; ctx.beginPath(); ctx.arc(ox, cy - objH, 6, 0, 7); ctx.fill();
    // mirror eq 1/v + 1/u = 1/f, u = objDist
    const u = objDist; const v = 1 / (1 / F - 1 / u); const mag = -v / u; const imgH = objH * mag; const ix = cx - v;
    ctx.strokeStyle = "rgba(244,114,182,0.85)"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(ox, cy - objH); ctx.lineTo(cx, cy - objH); ctx.lineTo(ix, cy - imgH); ctx.stroke();
    ctx.strokeStyle = "rgba(251,191,36,0.85)"; ctx.beginPath(); ctx.moveTo(ox, cy - objH); ctx.lineTo(cx, cy); ctx.lineTo(ix, cy - imgH); ctx.stroke();
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ix, cy); ctx.lineTo(ix, cy - imgH); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "12px system-ui"; ctx.fillText(`${concave ? "concave" : "convex"} mirror · magnification ${mag.toFixed(2)}×`, 14, 24);
    ctx.fillStyle = "#475569"; ctx.font = "11px system-ui"; ctx.fillText("drag the green object to change its distance & height", 14, H - 14);
  }, [f, objDist, objH, concave]);

  // Image characteristics from the mirror equation (component scope; distinct names from the draw effect).
  const F0 = concave ? f : -f;
  const v0 = 1 / (1 / F0 - 1 / objDist);
  const mag0 = -v0 / objDist;
  const explain = !concave
    ? `A convex mirror always forms an upright, reduced virtual image behind it (magnification ${mag0.toFixed(2)}×) — the wide field of view that makes it a car wing mirror.`
    : Math.abs(objDist - f) < 6
    ? "The object sits almost exactly at the focal point, so reflected rays leave nearly parallel and the image forms far away and enormous — the searchlight/collimator regime."
    : objDist < f
    ? `Object inside the focal length: the concave mirror gives an upright, magnified virtual image behind it (${mag0.toFixed(2)}×) — the shaving/makeup-mirror regime.`
    : objDist < 2 * f
    ? `Object between F and C: the image is real, inverted, and magnified (${mag0.toFixed(2)}×), projected in front of the mirror.`
    : `Object beyond the centre of curvature: the real image is inverted and smaller than the object (${mag0.toFixed(2)}×).`;

  const code = `f = ${f}          # focal length (px), concave = ${concave}
F = ${concave ? "f" : "-f"}
u = ${objDist}        # object distance
v = 1 / (1/F - 1/u)   # mirror equation: 1/v + 1/u = 1/f
mag = -v / u
print("image distance v =", round(v, 1))
print("magnification =", round(mag, 2))`;

  return (
    <StudioChrome title="Mirror Ray Tracing" tagline="concave & convex · mirror equation"
      controls={<div>
        <div className="mb-3 flex gap-2">{[true, false].map((cc) => <button key={String(cc)} onClick={() => setConcave(cc)} className={`flex-1 rounded-lg px-2 py-1 text-xs font-semibold ${concave === cc ? "bg-cyan-600 text-white" : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"}`}>{cc ? "Concave" : "Convex"}</button>)}</div>
        <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(l) => update(PRESETS[l])} />
        <p className="mb-3 text-xs text-slate-500">Trace principal rays off a curved mirror to find the image. Concave mirrors focus and can flip the image; convex mirrors always give a small upright virtual image.</p>
        <Slider label="Focal length" value={f} min={60} max={220} step={10} onChange={(val) => update({ f: val })} />
        <Slider label="Object distance" value={objDist} min={60} max={340} step={10} onChange={(val) => update({ objDist: val })} />
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Mirror" value={concave ? "concave" : "convex"} /><Stat label="Focal length" value={`${f}px`} /><Stat label="Equation" value="1/v + 1/u = 1/f" /><Equation tex={`\\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i},\\quad M=-\\frac{d_i}{d_o}=${mag0.toFixed(2)}\\ \\ (f=${F0},\\ d_o=${objDist})`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={W} height={H} className="h-auto w-full rounded-lg" /></StudioChrome>
  );
}
