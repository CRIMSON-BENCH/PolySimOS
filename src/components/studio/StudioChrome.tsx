"use client";

import { useRef, useState } from "react";
import Link from "next/link";

// Shared visual shell for every live Studio simulation.
export function StudioChrome({
  title,
  tagline,
  children,
  controls,
  inspector,
}: {
  title: string;
  tagline: string;
  children: React.ReactNode; // the canvas
  controls: React.ReactNode;
  inspector?: React.ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const exportPng = () => {
    const cv = stageRef.current?.querySelector("canvas");
    if (!cv) return;
    const a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = `${slug}.png`;
    a.click();
  };

  // Record the live animation to a downloadable video (native MediaRecorder — no deps).
  const record = () => {
    if (recording) { recRef.current?.stop(); return; }
    const cv = stageRef.current?.querySelector("canvas") as (HTMLCanvasElement & { captureStream?: (fps: number) => MediaStream }) | null;
    if (!cv || typeof cv.captureStream !== "function" || typeof MediaRecorder === "undefined") return;
    let stream: MediaStream;
    try { stream = cv.captureStream(30); } catch { return; }
    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
      a.download = `${slug}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      setRecording(false);
    };
    recRef.current = rec;
    rec.start();
    setRecording(true);
    setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 8000); // auto-stop at 8s
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/[0.02] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-white px-4 py-3 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
          </span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</span>
          <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">Live</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-400 lg:block">{tagline}</span>
          <button onClick={record} title={recording ? "Stop recording" : "Record the animation to a video (max 8s)"} className={recording ? "rounded-md border border-red-400 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 transition dark:border-red-500/50 dark:bg-red-950/40 dark:text-red-400" : "rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300"}>{recording ? "■ Stop" : "● REC"}</button>
          <button onClick={exportPng} title="Download this view as PNG" className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300">⤓ PNG</button>
        </div>
      </div>
      <div className="grid gap-0 lg:grid-cols-[1fr_18rem]">
        <div ref={stageRef} className="grid-bg relative min-h-[360px] overflow-hidden bg-slate-950 p-3">{children}</div>
        <div className="border-t border-slate-200 p-4 lg:border-l lg:border-t-0 dark:border-slate-800">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Controls</p>
          {controls}
          {inspector && (
            <>
              <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Data Inspector</p>
              {inspector}
            </>
          )}
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-2 dark:border-slate-800">
        <p className="text-xs text-slate-400">
          Runs locally in your browser — free forever.{" "}
          <Link href="/pricing" className="text-cyan-600 hover:underline dark:text-cyan-400">
            Scale to the cloud
          </Link>{" "}
          when reality gets heavy.
        </p>
      </div>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <label className="mb-3 block">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
        <span>{label}</span>
        <input
          type="number"
          value={Math.round(value * 1000) / 1000}
          min={min}
          max={max}
          step={step}
          aria-label={`${label} value`}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) onChange(clamp(v));
          }}
          className="w-20 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-right font-mono text-xs text-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      />
    </label>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1 text-xs last:border-0 dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}
