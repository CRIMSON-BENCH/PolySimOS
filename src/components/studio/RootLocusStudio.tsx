"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

export function RootLocusStudio() {
  const c = useRef<HTMLCanvasElement>(null);
  const [p2, setP2] = useState(4), [K, setK] = useState(3);
  // 1 + K/(s(s+p2)) = 0 → s² + p2 s + K = 0
  const disc = p2 * p2 / 4 - K;
  const re = -p2 / 2, im = disc >= 0 ? 0 : Math.sqrt(-disc);
  const stable = re < 0;

  useEffect(() => {
    const ctx = c.current!.getContext("2d")!; const W = 520, H = 320; ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    const cx = W * 0.62, cy = H / 2, sc = 34;
    ctx.strokeStyle = "#1e293b"; ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(W - 10, cy); ctx.moveTo(cx, 20); ctx.lineTo(cx, H - 20); ctx.stroke();
    // open-loop poles (x) at 0 and -p2
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 2; [0, -p2].forEach(pp => { const x = cx + pp * sc; ctx.beginPath(); ctx.moveTo(x - 5, cy - 5); ctx.lineTo(x + 5, cy + 5); ctx.moveTo(x + 5, cy - 5); ctx.lineTo(x - 5, cy + 5); ctx.stroke(); });
    // locus: on real axis between poles, then breakaway vertical
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx + 0 * sc, cy); ctx.lineTo(cx - p2 * sc, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - p2 / 2 * sc, cy - 120); ctx.lineTo(cx - p2 / 2 * sc, cy + 120); ctx.stroke();
    // current closed-loop poles
    ctx.fillStyle = "#a3e635"; [im, -im].forEach(ii => { ctx.beginPath(); ctx.arc(cx + re * sc, cy - ii * sc, 5, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif"; ctx.fillText("root locus — pink × poles, green ● closed-loop", 12, 22); ctx.fillText("Re", W - 26, cy - 6); ctx.fillText("Im", cx + 6, 28);
  }, [p2, K, re, im]);

  return (
    <StudioChrome title="Root Locus" tagline="how poles move with gain"
      controls={<div>
        <Slider label="Second pole −p₂" value={p2} min={1} max={8} step={0.5} onChange={setP2} />
        <Slider label="Loop gain K" value={K} min={0.1} max={30} step={0.1} onChange={setK} />
        <p className="mt-3 text-xs text-slate-500">The root locus traces where a system&apos;s closed-loop poles travel as feedback gain increases. Poles in the left half-plane mean stability; as gain rises they migrate toward the imaginary axis, and crossing it triggers oscillation. Educational tool.</p>
      </div>}
      inspector={<div>
        <Stat label="Closed-loop poles" value={im === 0 ? `${re.toFixed(2)}, real` : `${re.toFixed(2)} ± ${im.toFixed(2)}j`} />
        <Stat label="Damping" value={disc >= 0 ? "overdamped" : "underdamped"} />
        <Stat label="Stability" value={stable ? "stable ✓" : "unstable ⚠"} />
      </div>}
    ><canvas ref={c} width={520} height={320} className="mx-auto h-auto max-w-full rounded-lg" /></StudioChrome>
  );
}
