"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Stat } from "./StudioChrome";
import { ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi } from "@/lib/studioKit";

const POLY = [[100, 60], [360, 40], [440, 200], [300, 320], [120, 280], [60, 160]];

export function PointInPolygonStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pt, setPt] = useState<[number, number]>([250, 180]);

  const inside = (() => { let c = false; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const [xi, yi] = POLY[i], [xj, yj] = POLY[j]; if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) c = !c; } return c; })();

  useEffect(() => {
    const ctx = hidpi(canvasRef.current!, 500, 360); ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 500, 360);
    ctx.beginPath(); POLY.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    ctx.fillStyle = "rgba(34,211,238,0.12)"; ctx.fill(); ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.stroke();
    // ray from point
    ctx.strokeStyle = "rgba(163,230,53,0.6)"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(pt[0], pt[1]); ctx.lineTo(500, pt[1]); ctx.stroke(); ctx.setLineDash([]);
    // crossings
    let cross = 0; for (let i = 0, j = POLY.length - 1; i < POLY.length; j = i++) { const [xi, yi] = POLY[i], [xj, yj] = POLY[j]; if (((yi > pt[1]) !== (yj > pt[1]))) { const ix = (xj - xi) * (pt[1] - yi) / (yj - yi) + xi; if (ix > pt[0]) { ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(ix, pt[1], 4, 0, 7); ctx.fill(); cross++; } } }
    ctx.fillStyle = inside ? "#a3e635" : "#f472b6"; ctx.beginPath(); ctx.arc(pt[0], pt[1], 7, 0, 7); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText(`ray crosses edges ${cross} times → ${cross % 2 ? "inside" : "outside"}`, 10, 20); ctx.fillText("click to move the point", 10, 350);
  }, [pt, inside]);

  const explain = inside
    ? "A ray fired from this point crosses the polygon boundary an odd number of times, so the point lies inside the region — a geofence here would fire."
    : "A ray fired from this point crosses the boundary an even number of times (or misses it entirely), so the point lies outside the region.";

  const code = `def inside(poly, px, py):
    c = False; n = len(poly); j = n - 1
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[j]
        if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi) + xi):
            c = not c
        j = i
    return c

poly = [(100, 60), (360, 40), (440, 200), (300, 320), (120, 280), (60, 160)]
print(inside(poly, ${pt[0].toFixed(0)}, ${pt[1].toFixed(0)}))`;

  return (
    <StudioChrome title="Point in Polygon (Geofence)" tagline="ray-casting containment"
      controls={<div>
        <p className="mt-1 text-xs text-slate-500">Is a point inside a shape? The ray-casting algorithm shoots a ray from the point in any direction and counts how many polygon edges it crosses: an odd number means inside, an even number means outside. It is the math behind geofencing — triggering an alert when a phone or vehicle enters or leaves a region — and behind hit-testing in graphics. Click anywhere to test a point.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div><Stat label="Location" value={inside ? "INSIDE" : "outside"} /><Stat label="Polygon vertices" value={String(POLY.length)} /><Stat label="Algorithm" value="ray casting" /><Equation tex={`\\text{inside} \\iff \\Big(\\#\\{\\text{ray} \\cap \\text{edges}\\}\\Big) \\bmod 2 = 1, \\quad n = ${POLY.length}\\ \\text{vertices}`} /><ExplainResult text={explain} /></div>}
    ><canvas ref={canvasRef} width={500} height={360} onClick={(e) => { const r = (e.target as HTMLCanvasElement).getBoundingClientRect(); setPt([(e.clientX - r.left) * 500 / r.width, (e.clientY - r.top) * 360 / r.height]); }} className="mx-auto h-auto max-w-full cursor-crosshair rounded-lg" /></StudioChrome>
  );
}
