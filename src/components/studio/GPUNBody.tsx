"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// GPU N-body: every body feels gravity from every other body (true O(n²)),
// computed in a WGSL compute shader with workgroup-shared-memory tiling for
// speed — thousands of mutually-attracting bodies at interactive rates.

const WG = 128;

const COMPUTE = /* wgsl */ `
struct Body { pos: vec2<f32>, vel: vec2<f32> };
struct U { count: u32, dt: f32, G: f32, soft: f32 };
@group(0) @binding(0) var<storage, read_write> bodies: array<Body>;
@group(0) @binding(1) var<uniform> u: U;
var<workgroup> tile: array<vec2<f32>, 128>;
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(local_invocation_id) lid: vec3<u32>) {
  let i = gid.x;
  let pi = bodies[i].pos;
  var acc = vec2<f32>(0.0, 0.0);
  let tiles = (u.count + 127u) / 128u;
  for (var t: u32 = 0u; t < tiles; t = t + 1u) {
    let j = t * 128u + lid.x;
    if (j < u.count) { tile[lid.x] = bodies[j].pos; } else { tile[lid.x] = vec2<f32>(1.0e9, 1.0e9); }
    workgroupBarrier();
    for (var k: u32 = 0u; k < 128u; k = k + 1u) {
      let d = tile[k] - pi;
      let r2 = dot(d, d) + u.soft;
      let inv = inverseSqrt(r2);
      acc = acc + d * (u.G * inv * inv * inv);
    }
    workgroupBarrier();
  }
  if (i < u.count) {
    var b = bodies[i];
    b.vel = (b.vel + acc * u.dt) * 0.9999;
    b.pos = pi + b.vel * u.dt;
    bodies[i] = b;
  }
}`;

const RENDER = /* wgsl */ `
struct Body { pos: vec2<f32>, vel: vec2<f32> };
@group(0) @binding(0) var<storage, read> bodies: array<Body>;
struct VSOut { @builtin(position) pos: vec4<f32>, @location(0) speed: f32 };
@vertex fn vs(@builtin(vertex_index) vi:u32) -> VSOut {
  let b = bodies[vi]; var o: VSOut;
  o.pos = vec4<f32>(b.pos * 0.0025, 0.0, 1.0); o.speed = length(b.vel); return o;
}
@fragment fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let t = clamp(in.speed * 0.02, 0.0, 1.0);
  return vec4<f32>(0.2 + 0.6*t, 0.8, 1.0 - 0.4*t, 1.0);
}`;

export function GPUNBody() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"init" | "ok" | "unsupported">("init");
  const [count, setCount] = useState(4096);
  const [G, setG] = useState(30);
  const [fps, setFps] = useState(0);
  const gRef = useRef(G); gRef.current = G;

  useEffect(() => {
    let raf = 0, disposed = false;
    let device: any, ctx: any, format: string, cPipe: any, rPipe: any, buf: any, uni: any, padded = 0;
    const canvas = canvasRef.current!;
    async function init() {
      const gpu = (navigator as any).gpu; if (!gpu) return setStatus("unsupported");
      const adapter = await gpu.requestAdapter(); if (!adapter) return setStatus("unsupported");
      device = await adapter.requestDevice();
      ctx = canvas.getContext("webgpu"); if (!ctx) return setStatus("unsupported");
      format = gpu.getPreferredCanvasFormat(); ctx.configure({ device, format, alphaMode: "opaque" });
      build(count);
      cPipe = device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code: COMPUTE }), entryPoint: "main" } });
      rPipe = device.createRenderPipeline({ layout: "auto", vertex: { module: device.createShaderModule({ code: RENDER }), entryPoint: "vs" }, fragment: { module: device.createShaderModule({ code: RENDER }), entryPoint: "fs", targets: [{ format, blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } } }] }, primitive: { topology: "point-list" } });
      uni = device.createBuffer({ size: 16, usage: 0x40 | 0x8 });
      setStatus("ok"); loop();
    }
    function build(n: number) {
      padded = Math.ceil(n / WG) * WG;
      const data = new Float32Array(padded * 4); let s = 999;
      const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      for (let i = 0; i < n; i++) {
        const r = Math.sqrt(rnd()) * 300, a = rnd() * Math.PI * 2;
        const x = Math.cos(a) * r, y = Math.sin(a) * r; const sp = Math.sqrt((gRef.current * n) / (r + 40)) * 0.5;
        data[i * 4] = x; data[i * 4 + 1] = y; data[i * 4 + 2] = -Math.sin(a) * sp; data[i * 4 + 3] = Math.cos(a) * sp;
      }
      for (let i = n; i < padded; i++) { data[i * 4] = 1e9; data[i * 4 + 1] = 1e9; }
      if (buf) buf.destroy();
      buf = device.createBuffer({ size: data.byteLength, usage: 0x80 | 0x8 }); device.queue.writeBuffer(buf, 0, data);
    }
    let last = 0, frames = 0, acc = 0;
    function loop(ts = 0) {
      if (disposed) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
      const u = new ArrayBuffer(16); const f = new Float32Array(u); const ui = new Uint32Array(u);
      ui[0] = count; f[1] = dt * 2; f[2] = gRef.current; f[3] = 60;
      device.queue.writeBuffer(uni, 0, u);
      const cbg = device.createBindGroup({ layout: cPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buf } }, { binding: 1, resource: { buffer: uni } }] });
      const rbg = device.createBindGroup({ layout: rPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buf } }] });
      const enc = device.createCommandEncoder();
      const cp = enc.beginComputePass(); cp.setPipeline(cPipe); cp.setBindGroup(0, cbg); cp.dispatchWorkgroups(padded / WG); cp.end();
      const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), clearValue: { r: 0.008, g: 0.024, b: 0.09, a: 1 }, loadOp: "clear", storeOp: "store" }] });
      rp.setPipeline(rPipe); rp.setBindGroup(0, rbg); rp.draw(count); rp.end();
      device.queue.submit([enc.finish()]);
      frames++; acc += dt; if (acc >= 0.5) { setFps(Math.round(frames / acc)); frames = 0; acc = 0; }
      raf = requestAnimationFrame(loop);
    }
    init().catch(() => setStatus("unsupported"));
    return () => { disposed = true; cancelAnimationFrame(raf); try { buf?.destroy(); } catch { /* */ } };
  }, [count]);

  return (
    <StudioChrome
      title="GPU N-Body Studio (WebGPU)"
      tagline="O(n²) gravity · workgroup tiling"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Every body attracts every other body — thousands of pairwise forces per frame, computed on your GPU.</p>
          <Slider label="Bodies" value={count} min={512} max={8192} step={512} onChange={setCount} />
          <Slider label="Gravity G" value={G} min={5} max={80} step={5} onChange={setG} />
        </div>
      }
      inspector={<div><Stat label="Backend" value={status === "ok" ? "WebGPU" : status === "unsupported" ? "unavailable" : "starting…"} /><Stat label="Bodies" value={count.toLocaleString()} /><Stat label="Interactions/frame" value={(count * count).toLocaleString()} /><Stat label="FPS" value={status === "ok" ? String(fps) : "—"} /></div>}
    >
      {status === "unsupported" ? (
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 text-center"><p className="text-slate-300">WebGPU isn&apos;t available here.</p><p className="max-w-sm text-sm text-slate-500">Try the latest Chrome, Edge, or Safari — or use the CPU 3D N-Body studio.</p></div>
      ) : (
        <canvas ref={canvasRef} width={760} height={480} className="h-auto w-full rounded-lg" />
      )}
    </StudioChrome>
  );
}
