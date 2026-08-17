"use client";

import { useEffect, useRef, useState } from "react";
import { StudioChrome, Slider, Stat } from "./StudioChrome";

// GPU 3D volumetric smoke: a 64^3 density field advected each frame by a WGSL
// compute shader, then volume-raymarched by a fragment shader with an orbit
// camera. Everything (simulation + rendering) runs on the GPU.

const R = 64;
const W = 720, H = 480;

const COMPUTE = /* wgsl */ `
struct CU { R:u32, dt:f32, time:f32, injx:f32, injy:f32, injz:f32, inject:f32, dissip:f32 };
@group(0) @binding(0) var<storage, read> src: array<f32>;
@group(0) @binding(1) var<storage, read_write> dst: array<f32>;
@group(0) @binding(2) var<uniform> u: CU;
fn id3(x:u32,y:u32,z:u32)->u32 { return z*u.R*u.R + y*u.R + x; }
fn samp(p:vec3<f32>)->f32 {
  let Rf=f32(u.R); let c=clamp(p, vec3<f32>(0.0), vec3<f32>(Rf-1.0));
  return src[id3(u32(c.x),u32(c.y),u32(c.z))];
}
fn vel(p:vec3<f32>)->vec3<f32>{ let k=0.06;
  return vec3<f32>(sin(p.y*k+u.time)+cos(p.z*k), cos(p.x*k-u.time)+sin(p.z*k*0.5), sin(p.x*k+u.time*0.3)+cos(p.y*k)); }
@compute @workgroup_size(4,4,4)
fn main(@builtin(global_invocation_id) g:vec3<u32>){
  if(g.x>=u.R||g.y>=u.R||g.z>=u.R){return;}
  let p=vec3<f32>(f32(g.x),f32(g.y),f32(g.z));
  let back=p - vel(p)*u.dt*8.0;
  var d=samp(back)*u.dissip;
  let dd=distance(p, vec3<f32>(u.injx,u.injy,u.injz));
  if(dd<6.0){ d=d+u.inject*(1.0-dd/6.0); }
  dst[id3(g.x,g.y,g.z)]=clamp(d,0.0,2.0);
}`;

const RENDER = /* wgsl */ `
struct RU { R:u32, W:f32, H:f32, yaw:f32, pitch:f32, dist:f32, steps:f32, pad:f32 };
@group(0) @binding(0) var<storage, read> dens: array<f32>;
@group(0) @binding(1) var<uniform> u: RU;
@vertex fn vs(@builtin(vertex_index) vi:u32)->@builtin(position) vec4<f32>{
  var p=array<vec2<f32>,3>(vec2<f32>(-1.,-1.), vec2<f32>(3.,-1.), vec2<f32>(-1.,3.)); return vec4<f32>(p[vi],0.,1.);
}
fn dsample(P:vec3<f32>)->f32{
  let Rf=f32(u.R); let c=clamp(P*Rf, vec3<f32>(0.0), vec3<f32>(Rf-1.0));
  return dens[u32(c.z)*u.R*u.R + u32(c.y)*u.R + u32(c.x)];
}
@fragment fn fs(@builtin(position) fc:vec4<f32>)->@location(0) vec4<f32>{
  let uv=vec2<f32>(fc.x/u.W, fc.y/u.H)*2.0-1.0;
  let aspect=u.W/u.H;
  let cy=cos(u.yaw); let sy=sin(u.yaw); let cp=cos(u.pitch); let sp=sin(u.pitch);
  let d0=normalize(vec3<f32>(uv.x*aspect, -uv.y, -1.6));
  let dpx=vec3<f32>(d0.x, d0.y*cp - d0.z*sp, d0.y*sp + d0.z*cp);
  let dir=vec3<f32>(dpx.x*cy + dpx.z*sy, dpx.y, -dpx.x*sy + dpx.z*cy);
  let ro=vec3<f32>(sy*cp, sp, cy*cp)*u.dist + vec3<f32>(0.5,0.5,0.5);
  let inv=1.0/dir; let t0=(vec3<f32>(0.0)-ro)*inv; let t1=(vec3<f32>(1.0)-ro)*inv;
  let tmin=max(max(min(t0.x,t1.x),min(t0.y,t1.y)),min(t0.z,t1.z));
  let tmax=min(min(max(t0.x,t1.x),max(t0.y,t1.y)),max(t0.z,t1.z));
  let bg=vec3<f32>(0.02,0.03,0.09);
  if(tmax<=max(tmin,0.0)){ return vec4<f32>(bg,1.0); }
  let start=max(tmin,0.0); let steps=i32(u.steps); let dt=(tmax-start)/f32(steps);
  var acc=0.0; var col=vec3<f32>(0.0);
  for(var s=0; s<steps; s=s+1){
    let P=ro + dir*(start + (f32(s)+0.5)*dt);
    let a=clamp(dsample(P)*dt*4.0, 0.0, 1.0);
    let c=vec3<f32>(0.12+0.5*a, 0.55*a+0.05, 0.9*a+0.05);
    col=col + (1.0-acc)*a*c*3.0; acc=acc + (1.0-acc)*a;
    if(acc>0.98){break;}
  }
  return vec4<f32>(mix(bg,col,acc)+col*0.15, 1.0);
}`;

export function GPUFluid3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"init" | "ok" | "unsupported">("init");
  const [fps, setFps] = useState(0);
  const cam = useRef({ yaw: 0.7, pitch: 0.3, dist: 1.9, auto: true });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const cfg = useRef({ inject: 1.0, dissip: 0.97 });
  const [inject, setInject] = useState(1.0);
  cfg.current.inject = inject;

  useEffect(() => {
    let raf = 0, disposed = false;
    let device: any, ctx: any, format: string, cPipe: any, rPipe: any, a: any, b: any, cu: any, ru: any;
    const canvas = canvasRef.current!;
    async function init() {
      const gpu = (navigator as any).gpu; if (!gpu) return setStatus("unsupported");
      const adapter = await gpu.requestAdapter(); if (!adapter) return setStatus("unsupported");
      device = await adapter.requestDevice(); ctx = canvas.getContext("webgpu"); if (!ctx) return setStatus("unsupported");
      format = gpu.getPreferredCanvasFormat(); ctx.configure({ device, format, alphaMode: "opaque" });
      const zero = new Float32Array(R * R * R);
      a = device.createBuffer({ size: zero.byteLength, usage: 0x80 | 0x8 }); device.queue.writeBuffer(a, 0, zero);
      b = device.createBuffer({ size: zero.byteLength, usage: 0x80 | 0x8 }); device.queue.writeBuffer(b, 0, zero);
      cu = device.createBuffer({ size: 32, usage: 0x40 | 0x8 });
      ru = device.createBuffer({ size: 32, usage: 0x40 | 0x8 });
      cPipe = device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code: COMPUTE }), entryPoint: "main" } });
      rPipe = device.createRenderPipeline({ layout: "auto", vertex: { module: device.createShaderModule({ code: RENDER }), entryPoint: "vs" }, fragment: { module: device.createShaderModule({ code: RENDER }), entryPoint: "fs", targets: [{ format }] }, primitive: { topology: "triangle-list" } });
      setStatus("ok"); loop();
    }
    const onDown = (e: PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; cam.current.auto = false; };
    const onMove = (e: PointerEvent) => { if (!drag.current) return; cam.current.yaw += (e.clientX - drag.current.x) * 0.01; cam.current.pitch = Math.max(-1.2, Math.min(1.2, cam.current.pitch + (e.clientY - drag.current.y) * 0.01)); drag.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => (drag.current = null);
    canvas.addEventListener("pointerdown", onDown); window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);

    let last = 0, frames = 0, tacc = 0, time = 0, flip = false;
    function loop(ts = 0) {
      if (disposed) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts; time += dt;
      if (cam.current.auto) cam.current.yaw += 0.004;
      const src = flip ? b : a, dst = flip ? a : b;
      const inj = [R / 2 + Math.sin(time) * 8, 8, R / 2 + Math.cos(time) * 8];
      const cub = new ArrayBuffer(32); const cf = new Float32Array(cub); const ci = new Uint32Array(cub);
      ci[0] = R; cf[1] = dt; cf[2] = time; cf[3] = inj[0]; cf[4] = inj[1]; cf[5] = inj[2]; cf[6] = cfg.current.inject; cf[7] = cfg.current.dissip;
      device.queue.writeBuffer(cu, 0, cub);
      const rub = new ArrayBuffer(32); const rf = new Float32Array(rub); const ri = new Uint32Array(rub);
      ri[0] = R; rf[1] = W; rf[2] = H; rf[3] = cam.current.yaw; rf[4] = cam.current.pitch; rf[5] = cam.current.dist; rf[6] = 64; rf[7] = 0;
      device.queue.writeBuffer(ru, 0, rub);
      const cbg = device.createBindGroup({ layout: cPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: src } }, { binding: 1, resource: { buffer: dst } }, { binding: 2, resource: { buffer: cu } }] });
      const rbg = device.createBindGroup({ layout: rPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: dst } }, { binding: 1, resource: { buffer: ru } }] });
      const enc = device.createCommandEncoder();
      const cp = enc.beginComputePass(); cp.setPipeline(cPipe); cp.setBindGroup(0, cbg); cp.dispatchWorkgroups(R / 4, R / 4, R / 4); cp.end();
      const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), clearValue: { r: 0.02, g: 0.03, b: 0.09, a: 1 }, loadOp: "clear", storeOp: "store" }] });
      rp.setPipeline(rPipe); rp.setBindGroup(0, rbg); rp.draw(3); rp.end();
      device.queue.submit([enc.finish()]);
      flip = !flip;
      frames++; tacc += dt; if (tacc >= 0.5) { setFps(Math.round(frames / tacc)); frames = 0; tacc = 0; }
      raf = requestAnimationFrame(loop);
    }
    init().catch(() => setStatus("unsupported"));
    return () => { disposed = true; cancelAnimationFrame(raf); canvas.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, []);

  return (
    <StudioChrome
      title="GPU 3D Fluid Studio (WebGPU)"
      tagline="3D advection + volume raymarch"
      controls={
        <div>
          <p className="mb-3 text-xs text-slate-500">A {R}³ smoke volume, simulated and raymarched on your GPU. Drag to orbit the camera.</p>
          <Slider label="Injection" value={inject} min={0.3} max={2} step={0.1} onChange={setInject} />
          <button onClick={() => (cam.current.auto = !cam.current.auto)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-400">Toggle auto-rotate</button>
        </div>
      }
      inspector={<div><Stat label="Backend" value={status === "ok" ? "WebGPU" : status === "unsupported" ? "unavailable" : "starting…"} /><Stat label="Volume" value={`${R}³`} /><Stat label="Voxels" value={(R * R * R).toLocaleString()} /><Stat label="FPS" value={status === "ok" ? String(fps) : "—"} /></div>}
    >
      {status === "unsupported" ? (
        <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-2 text-center"><p className="text-slate-300">WebGPU isn&apos;t available here.</p><p className="max-w-sm text-sm text-slate-500">Try the latest Chrome, Edge, or Safari — or use the 2D WebGPU fluid.</p></div>
      ) : (
        <canvas ref={canvasRef} width={W} height={H} className="h-auto w-full cursor-grab rounded-lg" />
      )}
    </StudioChrome>
  );
}
