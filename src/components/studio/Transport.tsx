"use client";

import { useEffect, useRef, useState } from "react";

// Shared animation transport. A solver moves its per-frame work into `onFrame(steps)`
// (advance the sim `steps` times, then draw once) and this hook owns the rAF loop,
// giving play/pause, single-step, and a speed multiplier for free.
export function useTransport(onFrame: (steps: number) => void, opts?: { autoplay?: boolean }) {
  const [playing, setPlaying] = useState(opts?.autoplay !== false);
  const [speed, setSpeed] = useState(1);
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  const stepReq = useRef(0);
  const onFrameRef = useRef(onFrame);
  playingRef.current = playing;
  speedRef.current = speed;
  onFrameRef.current = onFrame;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (playingRef.current) {
        onFrameRef.current(Math.max(1, Math.round(speedRef.current)));
      } else if (stepReq.current > 0) {
        onFrameRef.current(1);
        stepReq.current -= 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return {
    playing,
    speed,
    setSpeed,
    toggle: () => setPlaying((p) => !p),
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    step: () => stepReq.current++,
  };
}

// UI bar to pair with useTransport (+ an optional reset).
export function TransportBar({
  playing,
  onToggle,
  onStep,
  onReset,
  speed,
  onSpeed,
}: {
  playing: boolean;
  onToggle: () => void;
  onStep: () => void;
  onReset?: () => void;
  speed: number;
  onSpeed: (v: number) => void;
}) {
  const btn = "rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-300";
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
      <button onClick={onToggle} className={btn} aria-label={playing ? "Pause" : "Play"}>{playing ? "❚❚ Pause" : "▶ Play"}</button>
      <button onClick={onStep} disabled={playing} className={btn} aria-label="Step one frame" title="Step one frame (pause first)">⇥ Step</button>
      {onReset && <button onClick={onReset} className={btn} aria-label="Reset">↺ Reset</button>}
      <label className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500">
        Speed
        <input type="range" min={1} max={8} step={1} value={speed} onChange={(e) => onSpeed(parseFloat(e.target.value))} aria-label="Simulation speed" className="w-20 accent-cyan-500" />
        <span className="w-6 font-mono">{speed}×</span>
      </label>
    </div>
  );
}
