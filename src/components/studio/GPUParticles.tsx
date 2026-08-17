"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Real WebGPU compute + render pipeline. A storage buffer of particles is
// updated by a WGSL compute shader each frame (attraction + swirl), then drawn
// as additive points by a render pipeline. Falls back gracefully with a clear
// message where WebGPU isn't available.

const COMPUTE_WGSL = /* wgsl */ `
struct Particle { pos: vec2<f32>, vel: vec2<f32> };
struct U { attractor: vec2<f32>, dt: f32, gravity: f32, swirl: f32, damping: f32, count: u32, pad: f32 };
@group(0) @binding(0) var<storage, read_write> parts: array<Particle>;
@group(0) @binding(1) var<uniform> u: U;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= u.count) { return; }
  var p = parts[i];
  let d = u.attractor - p.pos;
  let dist = max(length(d), 0.03);
  let dir = d / dist;
  let a = dir * (u.gravity / (dist * dist));
  let swirl = vec2<f32>(-dir.y, dir.x) * u.swirl;
  p.vel = (p.vel + (a + swirl) * u.dt) * u.damping;
  p.pos = p.pos + p.vel * u.dt;
  if (p.pos.x > 1.0) { p.pos.x = -1.0; } if (p.pos.x < -1.0) { p.pos.x = 1.0; }
  if (p.pos.y > 1.0) { p.pos.y = -1.0; } if (p.pos.y < -1.0) { p.pos.y = 1.0; }
  parts[i] = p;
}`;

const RENDER_WGSL = /* wgsl */ `
struct Particle { pos: vec2<f32>, vel: vec2<f32> };
@group(0) @binding(0) var<storage, read> parts: array<Particle>;
struct VSOut { @builtin(position) pos: vec4<f32>, @location(0) speed: f32 };
@vertex fn vs(@builtin(vertex_index) vi: u32) -> VSOut {
  let p = parts[vi];
  var o: VSOut;
  o.pos = vec4<f32>(p.pos.x, p.pos.y, 0.0, 1.0);
  o.speed = length(p.vel);
  return o;
}
@fragment fn fs(in: VSOut) -> @location(0) vec4<f32> {
  let t = clamp(in.speed * 6.0, 0.0, 1.0);
  return vec4<f32>(0.08 + 0.5 * t, 0.75, 1.0 - 0.35 * t, 1.0);
}`;

export function GPUParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"init" | "ok" | "unsupported">("init");
  const [count, setCount] = useState(200000);
  const [fps, setFps] = useState(0);
  const paramsRef = useRef({ gravity: 0.15, swirl: 0.6, attractor: [0, 0] as [number, number] });
  const countRef = useRef(count);
  countRef.current = count;

  useEffect(() => {
    let raf = 0; let disposed = false;
    let device: any, ctx: any, computePipe: any, renderPipe: any, partBuf: any, uniBuf: any, cbg: any, rbg: any, format: string;
    const canvas = canvasRef.current!;

    async function init() {
      const gpu = (navigator as any).gpu;
      if (!gpu) { setStatus("unsupported"); return; }
      const adapter = await gpu.requestAdapter();
      if (!adapter) { setStatus("unsupported"); return; }
      device = await adapter.requestDevice();
      ctx = canvas.getContext("webgpu");
      if (!ctx) { setStatus("unsupported"); return; }
      format = gpu.getPreferredCanvasFormat();
      ctx.configure({ device, format, alphaMode: "opaque" });

      buildBuffers(countRef.current);

      const cModule = device.createShaderModule({ code: COMPUTE_WGSL });
      computePipe = device.createComputePipeline({ layout: "auto", compute: { module: cModule, entryPoint: "main" } });
      const rModule = device.createShaderModule({ code: RENDER_WGSL });
      renderPipe = device.createRenderPipeline({
        layout: "auto",
        vertex: { module: rModule, entryPoint: "vs" },
        fragment: { module: rModule, entryPoint: "fs", targets: [{ format, blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } } }] },
        primitive: { topology: "point-list" },
      });
      makeBindGroups();
      setStatus("ok");
      loop();
    }

    function buildBuffers(n: number) {
      const data = new Float32Array(n * 4);
      let s = 12345;
      const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      for (let i = 0; i < n; i++) {
        const r = Math.sqrt(rnd()) * 0.9, a = rnd() * Math.PI * 2;
        data[i * 4] = Math.cos(a) * r; data[i * 4 + 1] = Math.sin(a) * r;
        data[i * 4 + 2] = -Math.sin(a) * 0.1; data[i * 4 + 3] = Math.cos(a) * 0.1;
      }
      if (partBuf) partBuf.destroy();
      partBuf = device.createBuffer({ size: data.byteLength, usage: 0x80 | 0x8 /* STORAGE | COPY_DST */ });
      device.queue.writeBuffer(partBuf, 0, data);
      if (!uniBuf) uniBuf = device.createBuffer({ size: 32, usage: 0x40 | 0x8 /* UNIFORM | COPY_DST */ });
    }
    function makeBindGroups() {
      cbg = device.createBindGroup({ layout: computePipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: partBuf } }, { binding: 1, resource: { buffer: uniBuf } }] });
      rbg = device.createBindGroup({ layout: renderPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: partBuf } }] });
    }

    let last = 0, frames = 0, acc = 0;
    function loop(ts = 0) {
      if (disposed) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
      const n = countRef.current;
      const p = paramsRef.current;
      const u = new ArrayBuffer(32); const f = new Float32Array(u); const ui = new Uint32Array(u);
      f[0] = p.attractor[0]; f[1] = p.attractor[1]; f[2] = dt * 60 * 0.016; f[3] = p.gravity; f[4] = p.swirl; f[5] = 0.985; ui[6] = n; f[7] = 0;
      device.queue.writeBuffer(uniBuf, 0, u);

      const enc = device.createCommandEncoder();
      const cp = enc.beginComputePass(); cp.setPipeline(computePipe); cp.setBindGroup(0, cbg); cp.dispatchWorkgroups(Math.ceil(n / 64)); cp.end();
      const view = ctx.getCurrentTexture().createView();
      const rp = enc.beginRenderPass({ colorAttachments: [{ view, clearValue: { r: 0.008, g: 0.024, b: 0.09, a: 1 }, loadOp: "clear", storeOp: "store" }] });
      rp.setPipeline(renderPipe); rp.setBindGroup(0, rbg); rp.draw(n); rp.end();
      device.queue.submit([enc.finish()]);

      frames++; acc += dt; if (acc >= 0.5) { setFps(Math.round(frames / acc)); frames = 0; acc = 0; }
      raf = requestAnimationFrame(loop);
    }

    // pointer attractor
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      paramsRef.current.attractor = [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)];
    };
    canvas.addEventListener("pointermove", onMove);

    init().catch(() => setStatus("unsupported"));
    return () => { disposed = true; cancelAnimationFrame(raf); canvas.removeEventListener("pointermove", onMove); try { partBuf?.destroy(); } catch { /* */ } };
  }, [count]);

  return (
    <StudioChrome
      title="GPU Compute Studio (WebGPU)"
      tagline="WGSL compute + render · hundreds of thousands of particles"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">Move your cursor over the canvas — the whole particle cloud is attracted to it, computed on your GPU in real time.</p>
          <Slider label="Particles" value={count} min={20000} max={500000} step={20000} onChange={setCount} />
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400"><span>Gravity</span></div>
            <input type="range" min={0.02} max={0.5} step={0.02} defaultValue={0.15} onChange={(e) => (paramsRef.current.gravity = parseFloat(e.target.value))} className="w-full accent-cyan-500" />
          </div>
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400"><span>Swirl</span></div>
            <input type="range" min={0} max={2} step={0.1} defaultValue={0.6} onChange={(e) => (paramsRef.current.swirl = parseFloat(e.target.value))} className="w-full accent-cyan-500" />
          </div>
        </div>
      }
      inspector={<div><Stat label="Backend" value={status === "ok" ? "WebGPU" : status === "unsupported" ? "unavailable" : "starting…"} /><Stat label="Particles" value={count.toLocaleString()} /><Stat label="FPS" value={status === "ok" ? String(fps) : "—"} /><Stat label="Compute" value="WGSL shader" /></div>}
    >
      {status === "unsupported" ? (
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 text-center">
          <p className="text-slate-300">WebGPU isn&apos;t available in this browser.</p>
          <p className="max-w-sm text-sm text-slate-500">Try the latest Chrome, Edge, or Safari. Meanwhile, every other PolySim studio runs without WebGPU.</p>
        </div>
      ) : (
        <canvas ref={canvasRef} width={760} height={480} className="h-auto w-full cursor-crosshair rounded-lg" />
      )}
    </StudioChrome>
  );
}
