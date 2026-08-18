"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { hidpi } from "@/lib/studioKit";

export function HaversineStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lat1, setLat1] = useState(40.7); const [lon1, setLon1] = useState(-74);
  const [lat2, setLat2] = useState(51.5); const [lon2, setLon2] = useState(0);

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

  return (
    <StudioChrome title="Great-Circle Distance (Haversine)" tagline="shortest path on a sphere"
      controls={<div>
        <Slider label="Point A latitude" value={lat1} min={-80} max={80} step={1} onChange={setLat1} />
        <Slider label="Point A longitude" value={lon1} min={-180} max={180} step={1} onChange={setLon1} />
        <Slider label="Point B latitude" value={lat2} min={-80} max={80} step={1} onChange={setLat2} />
        <Slider label="Point B longitude" value={lon2} min={-180} max={180} step={1} onChange={setLon2} />
        <p className="mt-3 text-xs text-slate-500">The shortest route between two points on Earth is a great-circle arc, not a straight line on a flat map. The haversine formula computes that distance from latitude and longitude, staying accurate even for nearly antipodal points. It powers flight planning, GPS, and every &quot;distance between&quot; feature — and explains why polar routes look curved on a Mercator map.</p>
      </div>}
      inspector={<div><Stat label="Distance" value={`${dist.toFixed(0)} km`} /><Stat label="In miles" value={`${(dist * 0.621).toFixed(0)} mi`} /><Stat label="Initial bearing" value={`${bearing.toFixed(0)}°`} /></div>}
    ><canvas ref={canvasRef} width={540} height={280} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
