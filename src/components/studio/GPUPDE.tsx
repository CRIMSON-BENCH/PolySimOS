"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// GPU PDE solver: steady-state heat / Poisson (∇²u = -f) solved by Jacobi
// iteration entirely on the GPU. Each frame runs many Jacobi sweeps across a
// high-resolution grid — the linear-solve core behind FEA/CFD, on the GPU.

const R = 384;

const JACOBI = /* wgsl */ `
struct U { R:u32, iters:u32, px:f32, py:f32, brush:f32, val:f32, paint:u32, pad:f32 };
@group(0) @binding(0) var<storage, read> src: array<f32>;
@group(0) @binding(1) var<storage, read_write> dst: array<f32>;
@group(0) @binding(2) var<storage, read_write> fixed: array<f32>; // >0 = Dirichlet value+1
@group(0) @binding(3) var<uniform> u: U;
@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let R = u.R;
  if (gid.x >= R || gid.y >= R) { return; }
  let i = gid.y*R + gid.x;
  // paint sources on the first pass of the frame (paint==1)
  if (u.paint == 1u) {
    let d = distance(vec2<f32>(f32(gid.x), f32(gid.y)), vec2<f32>(u.px, u.py));
    if (d < u.brush) { fixed[i] = u.val + 1.0; }
  }
  if (fixed[i] > 0.5) { dst[i] = fixed[i] - 1.0; return; }
  if (gid.x == 0u || gid.y == 0u || gid.x == R-1u || gid.y == R-1u) { dst[i] = 0.0; return; }
  let s = src[i-1u] + src[i+1u] + src[i-R] + src[i+R];
  dst[i] = 0.25 * s;
}`;

const RENDER = /* wgsl */ `
struct U { R:u32, iters:u32, px:f32, py:f32, brush:f32, val:f32, paint:u32, pad:f32 };
@group(0) @binding(0) var<storage, read> field: array<f32>;
@group(0) @binding(1) var<storage, read> fixed: array<f32>;
@group(0) @binding(2) var<uniform> u: U;
@vertex fn vs(@builtin(vertex_index) vi:u32) -> @builtin(position) vec4<f32> {
  var p = array<vec2<f32>,3>(vec2<f32>(-1.0,-1.0), vec2<f32>(3.0,-1.0), vec2<f32>(-1.0,3.0));
  return vec4<f32>(p[vi], 0.0, 1.0);
}
@fragment fn fs(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
  let R = u.R;
  let gx = u32(clamp(fc.x, 0.0, f32(R)-1.0));
  let gy = u32(clamp(fc.y, 0.0, f32(R)-1.0));
  let i = gy*R + gx;
  let t = clamp(field[i], 0.0, 1.0);
  let r = select(0.0, 1.0, fixed[i] > 0.5) * 0.15;
  return vec4<f32>(t*0.95 + r, t*0.6, (1.0-t)*0.7 + 0.05, 1.0);
}`;

export function GPUPDE() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"init" | "ok" | "unsupported">("init");
  const [iters, setIters] = useState(40);
  const [fps, setFps] = useState(0);
  const tool = useRef<{ px: number; py: number; brush: number; val: number; paint: boolean }>({ px: 0, py: 0, brush: 14, val: 1, paint: false });
  const itersRef = useRef(iters); itersRef.current = iters;

  useEffect(() => {
    let raf = 0, disposed = false;
    let device: any, ctx: any, format: string, jPipe: any, rPipe: any, a: any, b: any, fixed: any, uni: any;
    const canvas = canvasRef.current!;
    async function init() {
      const gpu = (navigator as any).gpu; if (!gpu) return setStatus("unsupported");
      const adapter = await gpu.requestAdapter(); if (!adapter) return setStatus("unsupported");
      device = await adapter.requestDevice(); ctx = canvas.getContext("webgpu"); if (!ctx) return setStatus("unsupported");
      format = gpu.getPreferredCanvasFormat(); ctx.configure({ device, format, alphaMode: "opaque" });
      const zero = new Float32Array(R * R);
      const fx = new Float32Array(R * R);
      // default: hot disk left, cold disk right
      for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) { const i = y * R + x; if (Math.hypot(x - R * 0.25, y - R * 0.5) < 30) fx[i] = 2; if (Math.hypot(x - R * 0.75, y - R * 0.5) < 30) fx[i] = 1; }
      a = device.createBuffer({ size: zero.byteLength, usage: 0x80 | 0x8 }); device.queue.writeBuffer(a, 0, zero);
      b = device.createBuffer({ size: zero.byteLength, usage: 0x80 | 0x8 }); device.queue.writeBuffer(b, 0, zero);
      fixed = device.createBuffer({ size: fx.byteLength, usage: 0x80 | 0x8 }); device.queue.writeBuffer(fixed, 0, fx);
      uni = device.createBuffer({ size: 32, usage: 0x40 | 0x8 });
      jPipe = device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code: JACOBI }), entryPoint: "main" } });
      rPipe = device.createRenderPipeline({ layout: "auto", vertex: { module: device.createShaderModule({ code: RENDER }), entryPoint: "vs" }, fragment: { module: device.createShaderModule({ code: RENDER }), entryPoint: "fs", targets: [{ format }] }, primitive: { topology: "triangle-list" } });
      setStatus("ok"); loop();
    }
    let last = 0, frames = 0, acc = 0, flip = false;
    function loop(ts = 0) {
      if (disposed) return;
      const dt = last ? (ts - last) / 1000 : 0.016; last = ts;
      const n = itersRef.current;
      const enc = device.createCommandEncoder();
      for (let k = 0; k < n; k++) {
        const src = flip ? b : a, dst = flip ? a : b;
        const t = tool.current;
        const u = new ArrayBuffer(32); const f = new Float32Array(u); const ui = new Uint32Array(u);
        ui[0] = R; ui[1] = n; f[2] = t.px; f[3] = t.py; f[4] = t.brush; f[5] = t.val; ui[6] = (k === 0 && t.paint) ? 1 : 0; f[7] = 0;
        device.queue.writeBuffer(uni, 0, u);
        const bg = device.createBindGroup({ layout: jPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: src } }, { binding: 1, resource: { buffer: dst } }, { binding: 2, resource: { buffer: fixed } }, { binding: 3, resource: { buffer: uni } }] });
        const cp = enc.beginComputePass(); cp.setPipeline(jPipe); cp.setBindGroup(0, bg); cp.dispatchWorkgroups(Math.ceil(R / 8), Math.ceil(R / 8)); cp.end();
        flip = !flip;
      }
      const cur = flip ? b : a;
      const rbg = device.createBindGroup({ layout: rPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: cur } }, { binding: 1, resource: { buffer: fixed } }, { binding: 2, resource: { buffer: uni } }] });
      const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), clearValue: { r: 0.02, g: 0.03, b: 0.09, a: 1 }, loadOp: "clear", storeOp: "store" }] });
      rp.setPipeline(rPipe); rp.setBindGroup(0, rbg); rp.draw(3); rp.end();
      device.queue.submit([enc.finish()]);
      frames++; acc += dt; if (acc >= 0.5) { setFps(Math.round(frames / acc)); frames = 0; acc = 0; }
      raf = requestAnimationFrame(loop);
    }
    const map = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); tool.current.px = ((e.clientX - r.left) / r.width) * R; tool.current.py = ((e.clientY - r.top) / r.height) * R; };
    const down = (e: PointerEvent) => { tool.current.paint = true; map(e); };
    const up = () => (tool.current.paint = false);
    canvas.addEventListener("pointermove", map); canvas.addEventListener("pointerdown", down); window.addEventListener("pointerup", up);
    init().catch(() => setStatus("unsupported"));
    return () => { disposed = true; cancelAnimationFrame(raf); canvas.removeEventListener("pointermove", map); canvas.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up); };
  }, []);

  return (
    <StudioChrome
      title="GPU PDE Solver (WebGPU)"
      tagline="Jacobi relaxation · steady heat / Poisson"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Click to paint heat sources; the GPU solves the steady-state field with {iters} Jacobi sweeps per frame across a {R}×{R} grid.</p>
          <Slider label="Jacobi iters / frame" value={iters} min={5} max={120} step={5} onChange={setIters} />
          <div className="mt-3 flex gap-2">
            <button onClick={() => (tool.current.val = 1)} className="flex-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white">Hot source</button>
            <button onClick={() => (tool.current.val = 0)} className="flex-1 rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white">Cold source</button>
          </div>
        </div>
      }
      inspector={<div><Stat label="Backend" value={status === "ok" ? "WebGPU" : status === "unsupported" ? "unavailable" : "starting…"} /><Stat label="Grid" value={`${R}×${R}`} /><Stat label="Unknowns" value={(R * R).toLocaleString()} /><Stat label="FPS" value={status === "ok" ? String(fps) : "—"} /></div>}
    >
      {status === "unsupported" ? (
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 text-center"><p className="text-slate-300">WebGPU isn&apos;t available here.</p><p className="max-w-sm text-sm text-slate-500">Try the latest Chrome, Edge, or Safari — or use the CPU Meshing studio.</p></div>
      ) : (
        <canvas ref={canvasRef} width={R} height={R} className="mx-auto h-auto max-h-[460px] w-auto max-w-full cursor-crosshair rounded-lg" style={{ width: "460px" }} />
      )}
    </StudioChrome>
  );
}
