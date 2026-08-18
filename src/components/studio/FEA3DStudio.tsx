"use client";

import { useEffect, useMemo, useRef } from "react";
import { starterFrame, solveSpaceFrame } from "@/lib/engines/fea3d";
import { project } from "@/lib/engines/threeD";
import { StudioChrome, Slider, Stat } from "./StudioChrome";
import { Presets, ExplainResult, ShareBar } from "./SolverExtras";
import { Equation } from "./Equation";
import { hidpi, useShareableNumbers } from "@/lib/studioKit";

const W = 760, H = 480;

const PRESETS: Record<string, { loadX: number; scale: number }> = {
  "Pure gravity": { loadX: 0, scale: 12 },
  "Gentle sway": { loadX: 6, scale: 20 },
  "Design load": { loadX: 20, scale: 10 },
  "Strong wind": { loadX: 40, scale: 6 },
};

export function FEA3DStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const base = useMemo(() => starterFrame(), []);
  const [{ loadX, scale }, update] = useShareableNumbers({ loadX: 15, scale: 8 });
  const cam = useRef({ yaw: 0.7, pitch: -0.3, auto: true });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);

  const result = useMemo(() => {
    const nodes = base.nodes.map((n, i) => (i === base.nodes.length - 1 ? { ...n, fx: loadX, fy: -25 } : { ...n }));
    return { nodes, res: solveSpaceFrame(nodes, base.members) };
  }, [base, loadX]);

  useEffect(() => {
    const canvas = canvasRef.current!; const ctx = hidpi(canvas, W, H);
    const onDown = (e: PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; cam.current.auto = false; };
    const onMove = (e: PointerEvent) => { if (!drag.current) return; cam.current.yaw += (e.clientX - drag.current.x) * 0.01; cam.current.pitch = Math.max(-1.3, Math.min(1.3, cam.current.pitch + (e.clientY - drag.current.y) * 0.01)); drag.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => (drag.current = null);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);

    const loop = () => {
      const c = cam.current; if (c.auto) c.yaw += 0.004;
      ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
      const { nodes, res } = result;
      const center = [0, 105, 0];
      const proj = (i: number, deformed: boolean) => {
        const dx = deformed && res.ok ? res.disp[3 * i] * scale : 0, dy = deformed && res.ok ? res.disp[3 * i + 1] * scale : 0, dz = deformed && res.ok ? res.disp[3 * i + 2] * scale : 0;
        return project({ x: nodes[i].x + dx - center[0], y: nodes[i].y + dy - center[1], z: nodes[i].z + dz - center[2] }, c.yaw, c.pitch, 420, W, H);
      };
      // undeformed ghost
      ctx.strokeStyle = "#334155"; ctx.lineWidth = 1;
      base.members.forEach((m) => { const a = proj(m.a, false), b = proj(m.b, false); ctx.beginPath(); ctx.moveTo(a.sx2, a.sy2); ctx.lineTo(b.sx2, b.sy2); ctx.stroke(); });
      // deformed, colored by force
      const maxF = Math.max(1, ...res.force.map((f) => Math.abs(f)));
      base.members.forEach((m, i) => { const f = res.force[i] || 0; const t = Math.abs(f) / maxF; ctx.strokeStyle = f >= 0 ? `rgba(34,211,238,${0.35 + t * 0.6})` : `rgba(244,114,182,${0.35 + t * 0.6})`; ctx.lineWidth = 1.5 + t * 4; const a = proj(m.a, true), b = proj(m.b, true); ctx.beginPath(); ctx.moveTo(a.sx2, a.sy2); ctx.lineTo(b.sx2, b.sy2); ctx.stroke(); });
      nodes.forEach((n, i) => { const p = proj(i, true); ctx.fillStyle = n.fixed ? "#a3e635" : "#e2e8f0"; ctx.beginPath(); ctx.arc(p.sx2, p.sy2, 4, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#22d3ee"; ctx.font = "12px system-ui"; ctx.fillText("tension", 16, 22); ctx.fillStyle = "#f472b6"; ctx.fillText("compression", 86, 22);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [result, base, scale]);

  const maxDisp = result.res.ok ? Math.max(...result.res.disp.map(Math.abs)) : 0;

  const explain =
    loadX === 0
      ? "Purely vertical load: the tower compresses almost straight down with negligible sway, because a frame is far stiffer along its axis than in bending."
      : loadX >= 30
      ? `Lateral load (${loadX}) now rivals the vertical, so bending dominates: the tower leans, windward members go into tension (cyan) and leeward into compression (pink), and peak node displacement climbs to ${maxDisp.toFixed(3)}.`
      : `Combined lateral ${loadX} and vertical load bends the frame; peak node displacement is ${maxDisp.toFixed(3)}, and members recolor by axial force, cyan for tension and pink for compression.`;

  const code = `# 3D space frame - direct stiffness method (3 DOF per node)
load_x = ${loadX}       # lateral load at the top node
load_y = -25            # vertical load at the top node
deform_scale = ${scale} # visual exaggeration only
# assemble the 3N x 3N global K, apply fixed supports, solve  K u = f
print("max node displacement", ${maxDisp.toFixed(3)})`;

  return (
    <StudioChrome
      title="3D FEA — Space Frame Studio"
      tagline="3D direct stiffness · drag to orbit"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">A 3D tower under a lateral + vertical load at the top. Drag to orbit. Members colored by axial force.</p>
          <Presets presets={Object.keys(PRESETS).map((label) => ({ label }))} onApply={(label) => update(PRESETS[label])} />
          <Slider label="Lateral load" value={loadX} min={0} max={40} step={2} onChange={(v) => update({ loadX: v })} />
          <Slider label="Deformation ×" value={scale} min={0} max={30} step={1} onChange={(v) => update({ scale: v })} />
          <button onClick={() => (cam.current.auto = !cam.current.auto)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">Toggle auto-rotate</button>
          <ShareBar code={code} />
        </div>
      }
      inspector={<div><Stat label="Nodes" value={String(base.nodes.length)} /><Stat label="Members" value={String(base.members.length)} /><Stat label="DOF" value={String(base.nodes.length * 3)} /><Stat label="Solve" value={result.res.ok ? "converged" : "singular"} /><Stat label="Max displacement" value={maxDisp.toFixed(3)} /><Equation tex={`\\mathbf{K}\\,\\mathbf{u} = \\mathbf{F},\\quad k_e = \\frac{EA}{L},\\quad F_x = ${loadX}\\ (${base.members.length}\\ \\text{members})`} /><ExplainResult text={explain} /></div>}
    >
      <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" />
    </StudioChrome>
  );
}
