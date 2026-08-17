"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// Particle-Mesh (PM) GPU N-body — scales to 100k+ bodies. Each frame:
//  1) clear a mass grid   2) deposit particle mass (atomic add)
//  3) solve Poisson ∇²φ = ρ by Jacobi iteration   4) push particles by -∇φ.
// This is O(N + G²·iters), far cheaper than O(N²), so huge N stays interactive.

const G = 160;         // grid resolution
const WG = 64;

const COMPUTE = /* wgsl */ `
struct Body { pos: vec2<f32>, vel: vec2<f32> };
struct U { N:u32, G:u32, dt:f32, grav:f32, massScale:f32, world:f32, damp:f32, flip:u32 };
@group(0) @binding(0) var<storage, read_write> bodies: array<Body>;
@group(0) @binding(1) var<storage, read_write> mass: array<atomic<i32>>;
@group(0) @binding(2) var<storage, read_write> phi: array<f32>;
@group(0) @binding(3) var<uniform> u: U;

fn cellOf(p: vec2<f32>) -> vec2<i32> {
  let g = f32(u.G);
  let c = (p * 0.5 + vec2<f32>(0.5, 0.5)) * g;
  return vec2<i32>(clamp(i32(c.x), 0, i32(u.G)-1), clamp(i32(c.y), 0, i32(u.G)-1));
}

@compute @workgroup_size(64)
fn clearMass(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x; if (i >= u.G*u.G) { return; }
  atomicStore(&mass[i], 0);
}
@compute @workgroup_size(64)
fn deposit(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x; if (i >= u.N) { return; }
  let c = cellOf(bodies[i].pos);
  atomicAdd(&mass[u32(c.y)*u.G + u32(c.x)], i32(u.massScale));
}
@compute @workgroup_size(64)
fn jacobi(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x; let GG = u.G*u.G; if (i >= GG) { return; }
  let x = i % u.G; let y = i / u.G;
  let inO = u.flip * GG; let outO = (1u - u.flip) * GG;
  if (x==0u||y==0u||x==u.G-1u||y==u.G-1u) { phi[outO+i] = 0.0; return; }
  let s = phi[inO+i-1u] + phi[inO+i+1u] + phi[inO+i-u.G] + phi[inO+i+u.G];
  let rho = f32(atomicLoad(&mass[i])) / u.massScale;
  phi[outO+i] = 0.25 * (s + 0.06 * rho);
}
@compute @workgroup_size(64)
fn update(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x; if (i >= u.N) { return; }
  var bdy = bodies[i];
  let c = cellOf(bdy.pos); let GG = u.G*u.G; let o = u.flip * GG;
  let xi = u32(clamp(c.x,1,i32(u.G)-2)); let yi = u32(clamp(c.y,1,i32(u.G)-2));
  let idx = yi*u.G + xi;
  let gx = (phi[o+idx+1u] - phi[o+idx-1u]) * 0.5;
  let gy = (phi[o+idx+u.G] - phi[o+idx-u.G]) * 0.5;
  let acc = vec2<f32>(-gx, -gy) * u.grav;
  bdy.vel = (bdy.vel + acc * u.dt) * u.damp;
  bdy.pos = bdy.pos + bdy.vel * u.dt;
  if (bdy.pos.x > 1.0) { bdy.pos.x = 1.0; bdy.vel.x = -bdy.vel.x*0.5; }
  if (bdy.pos.x < -1.0) { bdy.pos.x = -1.0; bdy.vel.x = -bdy.vel.x*0.5; }
  if (bdy.pos.y > 1.0) { bdy.pos.y = 1.0; bdy.vel.y = -bdy.vel.y*0.5; }
  if (bdy.pos.y < -1.0) { bdy.pos.y = -1.0; bdy.vel.y = -bdy.vel.y*0.5; }
  bodies[i] = bdy;
}`;

const RENDER = /* wgsl */ `
struct Body { pos: vec2<f32>, vel: vec2<f32> };
@group(0) @binding(0) var<storage, read> bodies: array<Body>;
struct VSOut { @builtin(position) pos: vec4<f32>, @location(0) speed: f32 };
@vertex fn vs(@builtin(vertex_index) vi:u32)->VSOut { let b=bodies[vi]; var o:VSOut; o.pos=vec4<f32>(b.pos,0.,1.); o.speed=length(b.vel); return o; }
@fragment fn fs(in: VSOut)->@location(0) vec4<f32> { let t=clamp(in.speed*3.0,0.,1.); return vec4<f32>(0.2+0.6*t,0.8,1.0-0.4*t,1.0); }`;

export function GPUNBodyPM() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"init" | "ok" | "unsupported">("init");
  const [count, setCount] = useState(65536);
  const [iters, setIters] = useState(20);
  const [grav, setGrav] = useState(40);
  const [fps, setFps] = useState(0);
  const gravRef = useRef(grav), itersRef = useRef(iters); gravRef.current = grav; itersRef.current = iters;

  useEffect(() => {
    let raf = 0, disposed = false;
    let device: any, ctx: any, format: string, bgl: any, pl: any, rPipe: any, bodies: any, mass: any, phi: any, uni: any, cbg: any, rbg: any, padded = 0;
    const pipes: any = {};
    const canvas = canvasRef.current!;
    async function init() {
      const gpu = (navigator as any).gpu; if (!gpu) return setStatus("unsupported");
      const adapter = await gpu.requestAdapter(); if (!adapter) return setStatus("unsupported");
      device = await adapter.requestDevice(); ctx = canvas.getContext("webgpu"); if (!ctx) return setStatus("unsupported");
      format = gpu.getPreferredCanvasFormat(); ctx.configure({ device, format, alphaMode: "opaque" });
      const mod = device.createShaderModule({ code: COMPUTE });
      bgl = device.createBindGroupLayout({ entries: [
        { binding: 0, visibility: 4, buffer: { type: "storage" } },
        { binding: 1, visibility: 4, buffer: { type: "storage" } },
        { binding: 2, visibility: 4, buffer: { type: "storage" } },
        { binding: 3, visibility: 4, buffer: { type: "uniform" } },
      ] });
      pl = device.createPipelineLayout({ bindGroupLayouts: [bgl] });
      for (const ep of ["clearMass", "deposit", "jacobi", "update"]) pipes[ep] = device.createComputePipeline({ layout: pl, compute: { module: mod, entryPoint: ep } });
      rPipe = device.createRenderPipeline({ layout: "auto", vertex: { module: device.createShaderModule({ code: RENDER }), entryPoint: "vs" }, fragment: { module: device.createShaderModule({ code: RENDER }), entryPoint: "fs", targets: [{ format, blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } } }] }, primitive: { topology: "point-list" } });
      mass = device.createBuffer({ size: G * G * 4, usage: 0x80 | 0x8 });
      phi = device.createBuffer({ size: G * G * 2 * 4, usage: 0x80 | 0x8 }); device.queue.writeBuffer(phi, 0, new Float32Array(G * G * 2));
      uni = device.createBuffer({ size: 32, usage: 0x40 | 0x8 });
      build(count);
      setStatus("ok"); loop();
    }
    function build(n: number) {
      padded = Math.ceil(n / WG) * WG;
      const data = new Float32Array(padded * 4); let s = 7;
      const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      for (let i = 0; i < n; i++) { const r = Math.sqrt(rnd()) * 0.8, a = rnd() * 6.283; const x = Math.cos(a) * r, y = Math.sin(a) * r; data[i*4]=x; data[i*4+1]=y; data[i*4+2]=-Math.sin(a)*0.1; data[i*4+3]=Math.cos(a)*0.1; }
      for (let i = n; i < padded; i++) { data[i*4]=2; data[i*4+1]=2; }
      if (bodies) bodies.destroy();
      bodies = device.createBuffer({ size: data.byteLength, usage: 0x80 | 0x8 }); device.queue.writeBuffer(bodies, 0, data);
      cbg = device.createBindGroup({ layout: bgl, entries: [{ binding: 0, resource: { buffer: bodies } }, { binding: 1, resource: { buffer: mass } }, { binding: 2, resource: { buffer: phi } }, { binding: 3, resource: { buffer: uni } }] });
      rbg = device.createBindGroup({ layout: rPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: bodies } }] });
    }
    function setU(flip: number, dt: number) {
      const u = new ArrayBuffer(32); const f = new Float32Array(u); const ui = new Uint32Array(u);
      ui[0] = count; ui[1] = G; f[2] = dt; f[3] = gravRef.current; f[4] = 256; f[5] = 1; f[6] = 0.999; ui[7] = flip;
      device.queue.writeBuffer(uni, 0, u);
    }
    let last = 0, frames = 0, acc = 0, flip = 0;
    function loop(ts = 0) {
      if (disposed) return;
      const dt = last ? Math.min(0.033, (ts - last) / 1000) : 0.016; last = ts;
      const enc = device.createCommandEncoder();
      const disp = (ep: string, count: number) => { const cp = enc.beginComputePass(); cp.setPipeline(pipes[ep]); cp.setBindGroup(0, cbg); cp.dispatchWorkgroups(Math.ceil(count / WG)); cp.end(); };
      setU(flip, dt); disp("clearMass", G * G); disp("deposit", count);
      for (let k = 0; k < itersRef.current; k++) { setU(flip, dt); disp("jacobi", G * G); flip = 1 - flip; }
      setU(flip, dt); disp("update", count);
      const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), clearValue: { r: 0.008, g: 0.02, b: 0.07, a: 1 }, loadOp: "clear", storeOp: "store" }] });
      rp.setPipeline(rPipe); rp.setBindGroup(0, rbg); rp.draw(count); rp.end();
      device.queue.submit([enc.finish()]);
      frames++; acc += dt; if (acc >= 0.5) { setFps(Math.round(frames / acc)); frames = 0; acc = 0; }
      raf = requestAnimationFrame(loop);
    }
    init().catch(() => setStatus("unsupported"));
    return () => { disposed = true; cancelAnimationFrame(raf); try { bodies?.destroy(); mass?.destroy(); phi?.destroy(); } catch { /* */ } };
  }, [count]);

  return (
    <StudioChrome
      title="GPU N-Body — Particle Mesh (WebGPU)"
      tagline="mass deposit · Poisson solve · gradient push"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">The particle-mesh method scales to 100k+ bodies by solving gravity on a grid instead of pair-by-pair.</p>
          <Slider label="Bodies" value={count} min={16384} max={262144} step={16384} onChange={setCount} />
          <Slider label="Poisson iters" value={iters} min={5} max={40} step={5} onChange={setIters} />
          <Slider label="Gravity" value={grav} min={5} max={120} step={5} onChange={setGrav} />
        </div>
      }
      inspector={<div><Stat label="Backend" value={status === "ok" ? "WebGPU" : status === "unsupported" ? "unavailable" : "starting…"} /><Stat label="Bodies" value={count.toLocaleString()} /><Stat label="Grid" value={`${G}×${G}`} /><Stat label="Complexity" value="O(N + G²·iters)" /><Stat label="FPS" value={status === "ok" ? String(fps) : "—"} /></div>}
    >
      {status === "unsupported" ? (
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 text-center"><p className="text-slate-300">WebGPU isn&apos;t available here.</p><p className="max-w-sm text-sm text-slate-500">Try the latest Chrome, Edge, or Safari — or use the O(n²) GPU N-Body.</p></div>
      ) : (
        <canvas ref={canvasRef} width={760} height={480} className="h-auto w-full rounded-lg" />
      )}
    </StudioChrome>
  );
}
