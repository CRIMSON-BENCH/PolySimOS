"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function MapProjectionStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [latitude, setLatitude] = useState(60);

  const areaDistortion = 1 / Math.cos(latitude * Math.PI / 180) ** 2;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!; const W = 500, H = 340; ctx.fillStyle = "#0b1a2e"; ctx.fillRect(0, 0, W, H);
    // Mercator graticule with Tissot circles
    const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
    const maxM = merc(80); const Y = (lat: number) => H / 2 - merc(lat) / maxM * (H / 2 - 10);
    ctx.strokeStyle = "#1e3a5f"; for (let lat = -80; lat <= 80; lat += 20) { const y = Y(lat); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let lon = 0; lon <= W; lon += 50) { ctx.beginPath(); ctx.moveTo(lon, 0); ctx.lineTo(lon, H); ctx.stroke(); }
    // Tissot indicatrices (circles of equal true size, appear larger toward poles)
    for (let lat = -60; lat <= 60; lat += 30) { const y = Y(lat); const r = 10 / Math.cos(lat * Math.PI / 180); for (let x = 60; x < W; x += 120) { ctx.strokeStyle = Math.abs(lat - Math.round(latitude / 30) * 30) < 5 ? "#a3e635" : "#f472b6"; ctx.beginPath(); ctx.arc(x, y, Math.min(50, r), 0, 7); ctx.stroke(); } }
    // current latitude line
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, Y(latitude)); ctx.lineTo(W, Y(latitude)); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("Mercator — circles are truly equal-sized on the globe", 8, 18);
  }, [latitude]);

  return (
    <StudioChrome title="Map Projection Distortion" tagline="why Greenland looks huge"
      controls={<div>
        <Slider label="Latitude" value={latitude} min={-80} max={80} step={5} onChange={setLatitude} />
        <p className="mt-3 text-xs text-slate-500">You cannot flatten a sphere without distortion. The Mercator projection preserves angles for navigation but inflates area toward the poles by 1/cos²(latitude) — so Greenland appears as big as Africa though it is 14 times smaller. The Tissot circles are all the same true size on the globe; watch them balloon at high latitudes.</p>
      </div>}
      inspector={<div><Stat label="Area distortion" value={`${areaDistortion.toFixed(1)}×`} /><Stat label="Length distortion" value={`${(1 / Math.cos(latitude * Math.PI / 180)).toFixed(2)}×`} /><Stat label="Latitude" value={`${latitude}°`} /></div>}
    ><canvas ref={canvasRef} width={500} height={340} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
