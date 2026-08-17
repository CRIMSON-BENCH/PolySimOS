"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// GPU smoke: a density field advected each frame by a time-varying velocity
// field, entirely in a WGSL compute shader (ping-pong storage buffers), then
// drawn by a fullscreen fragment shader. Canvas is R×R so frag coords map
// directly to grid cells; CSS upscales for display.

const R = 256;

const COMPUTE = /* wgsl */ `
struct U { R:u32, dt:f32, time:f32, injx:f32, injy:f32, inject:f32, dissip:f32, pad:f32 };
@group(0) @binding(0) var<storage, read> src: array<f32>;
@group(0) @binding(1) var<storage, read_write> dst: array<f32>;
@group(0) @binding(2) var<uniform> u: U;
fn sampleD(px:f32, py:f32) -> f32 {
  let Rf = f32(u.R);
  let x = clamp(px, 0.0, Rf-1.0); let y = clamp(py, 0.0, Rf-1.0);
  let x0 = floor(x); let y0 = floor(y);
  let x1 = min(x0+1.0, Rf-1.0); let y1 = min(y0+1.0, Rf-1.0);
  let fx = x-x0; let fy = y-y0;
  let i00 = u32(y0)*u.R+u32(x0); let i10 = u32(y0)*u.R+u32(x1);
  let i01 = u32(y1)*u.R+u32(x0); let i11 = u32(y1)*u.R+u32(x1);
  return mix(mix(src[i00], src[i10], fx), mix(src[i01], src[i11], fx), fy);
}
fn vel(x:f32, y:f32) -> vec2<f32> {
  let k = 0.025;
  return vec2<f32>(sin(y*k + u.time) * 1.4 + cos(x*k*0.7 - u.time*0.5),
                   cos(x*k - u.time) * 1.4 + sin(y*k*0.7 + u.time*0.3));
}
@compute @workgroup_size(8,8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= u.R || gid.y >= u.R) { return; }
  let i = gid.y*u.R + gid.x;
  let p = vec2<f32>(f32(gid.x), f32(gid.y));
  let v = vel(p.x, p.y);
  let back = p - v * u.dt * 24.0;
  var d = sampleD(back.x, back.y) * u.dissip;
  let dd = distance(p, vec2<f32>(u.injx, u.injy));
  if (dd < 14.0) { d = d + u.inject * (1.0 - dd/14.0); }
  dst[i] = clamp(d, 0.0, 1.5);
}`;

const RENDER = /* wgsl */ `
struct U { R:u32, dt:f32, time:f32, injx:f32, injy:f32, inject:f32, dissip:f32, pad:f32 };
@group(0) @binding(0) var<storage, read> dens: array<f32>;
@group(0) @binding(1) var<uniform> u: U;
@vertex fn vs(@builtin(vertex_index) vi:u32) -> @builtin(position) vec4<f32> {
  var p = array<vec2<f32>,3>(vec2<f32>(-1.0,-1.0), vec2<f32>(3.0,-1.0), vec2<f32>(-1.0,3.0));
  return vec4<f32>(p[vi], 0.0, 1.0);
}
@fragment fn fs(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
  let Rf = f32(u.R);
  let gx = u32(clamp(fc.x, 0.0, Rf-1.0));
  let gy = u32(clamp(fc.y, 0.0, Rf-1.0));
  let d = clamp(dens[gy*u.R+gx], 0.0, 1.0);
  return vec4<f32>(0.1 + 0.15*d, 0.55*d + 0.05, 0.9*d + 0.05, 1.0);
}`;

export function GPUFluid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"init" | "ok" | "unsupported">("init");
  const [fps, setFps] = useState(0);
  const [inject, setInject] = useState(0.9);
  const [dissip, setDissip] = useState(0.985);
  const pointer = useRef({ x: R / 2, y: R / 2, down: true });
  const cfgRef = useRef({ inject, dissip });
  cfgRef.current = { inject, dissip };

  useEffect(() => {
    let raf = 0, disposed = false;
    let device: any, ctx: any, format: string, cPipe: any, rPipe: any, bufA: any, bufB: any, uni: any;
    const canvas = canvasRef.current!;

    async function init() {
      const gpu = (navigator as any).gpu; if (!gpu) return setStatus("unsupported");
      const adapter = await gpu.requestAdapter(); if (!adapter) return setStatus("unsupported");
      device = await adapter.requestDevice();
      ctx = canvas.getContext("webgpu"); if (!ctx) return setStatus("unsupported");
      format = gpu.getPreferredCanvasFormat();
      ctx.configure({ device, format, alphaMode: "opaque" });
      const zero = new Float32Array(R * R);
      bufA = device.createBuffer({ size: zero.byteLength, usage: 0x80 | 0x8 }); device.queue.writeBuffer(bufA, 0, zero);
      bufB = device.createBuffer({ size: zero.byteLength, usage: 0x80 | 0x8 }); device.queue.writeBuffer(bufB, 0, zero);
      uni = device.createBuffer({ size: 32, usage: 0x40 | 0x8 });
      cPipe = device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code: COMPUTE }), entryPoint: "main" } });
      rPipe = device.createRenderPipeline({ layout: "auto", vertex: { module: device.createShaderModule({ code: RENDER }), entryPoint: "vs" }, fragment: { module: device.createShaderModule({ code: RENDER }), entryPoint: "fs", targets: [{ format }] }, primitive: { topology: "triangle-list" } });
      setStatus("ok"); loop();
    }

    let last = 0, frames = 0, acc = 0, time = 0, flip = false;
    function loop(ts = 0) {
      if (disposed) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts; time += dt;
      const src = flip ? bufB : bufA, dst = flip ? bufA : bufB;
      const u = new ArrayBuffer(32); const f = new Float32Array(u); const ui = new Uint32Array(u);
      ui[0] = R; f[1] = dt; f[2] = time; f[3] = pointer.current.x; f[4] = pointer.current.y; f[5] = pointer.current.down ? cfgRef.current.inject : 0; f[6] = cfgRef.current.dissip; f[7] = 0;
      device.queue.writeBuffer(uni, 0, u);
      const cbg = device.createBindGroup({ layout: cPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: src } }, { binding: 1, resource: { buffer: dst } }, { binding: 2, resource: { buffer: uni } }] });
      const rbg = device.createBindGroup({ layout: rPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: dst } }, { binding: 1, resource: { buffer: uni } }] });
      const enc = device.createCommandEncoder();
      const cp = enc.beginComputePass(); cp.setPipeline(cPipe); cp.setBindGroup(0, cbg); cp.dispatchWorkgroups(Math.ceil(R / 8), Math.ceil(R / 8)); cp.end();
      const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), clearValue: { r: 0.03, g: 0.05, b: 0.09, a: 1 }, loadOp: "clear", storeOp: "store" }] });
      rp.setPipeline(rPipe); rp.setBindGroup(0, rbg); rp.draw(3); rp.end();
      device.queue.submit([enc.finish()]);
      flip = !flip;
      frames++; acc += dt; if (acc >= 0.5) { setFps(Math.round(frames / acc)); frames = 0; acc = 0; }
      raf = requestAnimationFrame(loop);
    }

    const map = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); pointer.current.x = ((e.clientX - r.left) / r.width) * R; pointer.current.y = ((e.clientY - r.top) / r.height) * R; };
    const down = (e: PointerEvent) => { pointer.current.down = true; map(e); };
    const up = () => (pointer.current.down = false);
    canvas.addEventListener("pointermove", map); canvas.addEventListener("pointerdown", down); window.addEventListener("pointerup", up);
    init().catch(() => setStatus("unsupported"));
    return () => { disposed = true; cancelAnimationFrame(raf); canvas.removeEventListener("pointermove", map); canvas.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up); };
  }, []);

  return (
    <StudioChrome
      title="WebGPU Fluid Studio"
      tagline="GPU compute · semi-Lagrangian advection"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Click and drag on the canvas to inject smoke into the {R}×{R} GPU field.</p>
          <Slider label="Injection" value={inject} min={0.2} max={1.5} step={0.1} onChange={setInject} />
          <Slider label="Persistence" value={dissip} min={0.9} max={0.999} step={0.005} onChange={setDissip} />
        </div>
      }
      inspector={<div><Stat label="Backend" value={status === "ok" ? "WebGPU" : status === "unsupported" ? "unavailable" : "starting…"} /><Stat label="Grid" value={`${R}×${R}`} /><Stat label="Cells" value={(R * R).toLocaleString()} /><Stat label="FPS" value={status === "ok" ? String(fps) : "—"} /></div>}
    >
      {status === "unsupported" ? (
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 text-center"><p className="text-slate-300">WebGPU isn&apos;t available here.</p><p className="max-w-sm text-sm text-slate-500">Try the latest Chrome, Edge, or Safari — or use the CPU 2D Fluid studio.</p></div>
      ) : (
        <canvas ref={canvasRef} width={R} height={R} className="mx-auto h-auto max-h-[460px] w-auto max-w-full cursor-crosshair rounded-lg" style={{ width: "460px", imageRendering: "auto" }} />
      )}
    </StudioChrome>
  );
}
