"use client";

import { useEffect, useRef } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const PRESETS: Record<string, { lat1: number; lon1: number; lat2: number; lon2: number }> = {
  "NYC → London": { lat1: 41, lon1: -74, lat2: 51, lon2: 0 },
  "Tokyo → LA": { lat1: 36, lon1: 140, lat2: 34, lon2: -118 },
  "Sydney → Santiago": { lat1: -34, lon1: 151, lat2: -33, lon2: -71 },
  "Cape Town → Delhi": { lat1: -34, lon1: 18, lat2: 29, lon2: 77 },
};

export function HaversineStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [{ lat1, lon1, lat2, lon2 }, update] = useShareableNumbers({ lat1: 40.7, lon1: -74, lat2: 51.5, lon2: 0 });

  const R = 6371; const toR = (d: number) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const y = Math.sin(dLon) * Math.cos(toR(lat2)); const x = Math.cos(toR(lat1)) * Math.sin(toR(lat2)) - Math.sin(toR(lat1)) * Math.cos(toR(lat2)) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

  useEffect(() => {
    const W = 540, H = 280; const ctx = hidpi(canvasRef.current!, W, H); ctx.fillStyle = "#0b1a2e"; ctx.fillRect(0, 0, W, H);
    const X = (lon: number) => (lon + 180) / 360 * W; const Y = (lat: number) => (90 - lat) / 180 * H;
    // graticule
    ctx.strokeStyle = "#1e3a5f"; ctx.lineWidth = 0.5; for (let lo = -180; lo <= 180; lo += 30) { ctx.beginPath(); ctx.moveTo(X(lo), 0); ctx.lineTo(X(lo), H); ctx.stroke(); } for (let la = -60; la <= 60; la += 30) { ctx.beginPath(); ctx.moveTo(0, Y(la)); ctx.lineTo(W, Y(la)); ctx.stroke(); }
    // great-circle path (interpolate)
    ctx.strokeStyle = "#a3e635"; ctx.lineWidth = 2; ctx.beginPath();
    for (let t = 0; t <= 1; t += 0.02) { const A = toR(lat1), B = toR(lon1), C = toR(lat2), D = toR(lon2); const d = 2 * Math.asin(Math.sqrt(a)); if (d < 1e-6) break; const A1 = Math.sin((1 - t) * d) / Math.sin(d), A2 = Math.sin(t * d) / Math.sin(d);
      const xx = A1 * Math.cos(A) * Math.cos(B) + A2 * Math.cos(C) * Math.cos(D); const yy = A1 * Math.cos(A) * Math.sin(B) + A2 * Math.cos(C) * Math.sin(D); const zz = A1 * Math.sin(A) + A2 * Math.sin(C);
      const lat = Math.atan2(zz, Math.sqrt(xx * xx + yy * yy)) * 180 / Math.PI, lon = Math.atan2(yy, xx) * 180 / Math.PI; t === 0 ? ctx.moveTo(X(lon), Y(lat)) : ctx.lineTo(X(lon), Y(lat)); } ctx.stroke();
    ctx.fillStyle = "#22d3ee"; ctx.beginPath(); ctx.arc(X(lon1), Y(lat1), 5, 0, 7); ctx.fill(); ctx.fillStyle = "#f472b6"; ctx.beginPath(); ctx.arc(X(lon2), Y(lat2), 5, 0, 7); ctx.fill();
  }, [lat1, lon1, lat2, lon2, a]);

  const explain =
    dist < 1
      ? "The two points are essentially the same spot, so the distance collapses toward zero."
      : dist > 12000
      ? "These points are nearly antipodal, so almost every heading is close to shortest — the great-circle route becomes unstable and hugs no single meridian."
      : Math.abs(lat1 - lat2) < 8 && Math.abs(lon1 - lon2) > 60
      ? "Same latitude but far apart in longitude: the great-circle arc bows toward the nearer pole, which is exactly why it looks curved on a flat Mercator map."
      : `A great circle changes heading as you travel, so the ${bearing.toFixed(0)}-degree initial bearing is not the heading you keep — that constant-heading path (a rhumb line) would be longer.`;

  const code = `from math import radians, sin, cos, sqrt, atan2
lat1, lon1, lat2, lon2 = ${lat1}, ${lon1}, ${lat2}, ${lon2}
R = 6371.0
dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
dist = R * 2 * atan2(sqrt(a), sqrt(1 - a))
print("distance km", round(dist, 1))`;

  return (
    <StudioChrome title="Great-Circle Distance (Haversine)" tagline="shortest path on a sphere"
      controls={<div>
        <Presets
          presets={Object.keys(PRESETS).map((label) => ({ label }))}
          onApply={(label) => update(PRESETS[label])}
        />
        <Slider label="Point A latitude" value={lat1} min={-80} max={80} step={1} onChange={(v) => update({ lat1: v })} />
        <Slider label="Point A longitude" value={lon1} min={-180} max={180} step={1} onChange={(v) => update({ lon1: v })} />
        <Slider label="Point B latitude" value={lat2} min={-80} max={80} step={1} onChange={(v) => update({ lat2: v })} />
        <Slider label="Point B longitude" value={lon2} min={-180} max={180} step={1} onChange={(v) => update({ lon2: v })} />
        <p className="mt-3 text-xs text-slate-500">The shortest route between two points on Earth is a great-circle arc, not a straight line on a flat map. The haversine formula computes that distance from latitude and longitude, staying accurate even for nearly antipodal points. It powers flight planning, GPS, and every &quot;distance between&quot; feature — and explains why polar routes look curved on a Mercator map.</p>
        <ShareBar code={code} />
      </div>}
      inspector={<div>
        <Stat label="Distance" value={`${dist.toFixed(0)} km`} />
        <Stat label="In miles" value={`${(dist * 0.621).toFixed(0)} mi`} />
        <Stat label="Initial bearing" value={`${bearing.toFixed(0)}°`} />
        <Equation tex={`d = 2R\\,\\arcsin\\!\\sqrt{\\sin^2\\tfrac{\\Delta\\varphi}{2} + \\cos\\varphi_1\\cos\\varphi_2\\sin^2\\tfrac{\\Delta\\lambda}{2}} = ${dist.toFixed(0)}\\ \\text{km}`} />
        <ExplainResult text={explain} />
      </div>}
    ><canvas ref={canvasRef} width={540} height={280} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
