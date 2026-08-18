"use client";

import { useEffect, useRef, useState } from "react";

// Color-blind-safe, consistent series palette (Okabe–Ito inspired) used across every solver.
export const PALETTE = {
  bg: "#020617",
  grid: "#1e293b",
  axis: "#334155",
  text: "#94a3b8",
  primary: "#22d3ee",
  accent: "#a3e635",
  series: ["#22d3ee", "#a3e635", "#f59e0b", "#c084fc", "#f472b6", "#38bdf8", "#fb7185"],
} as const;

// Hi-DPI canvas setup — crisp on retina/4K. Call this in your draw effect INSTEAD of getContext("2d").
// Keeps your existing W×H logical coordinates; only the backing store gets denser.
export function hidpi(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// Shareable state: mirrors a set of numeric params into the URL query string so a configured
// simulation is a linkable, bookmarkable page. Drop-in replacement for useState({...numbers}).
export function useShareableNumbers<T extends Record<string, number>>(defaults: T) {
  const [state, setState] = useState<T>(defaults);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const p = new URLSearchParams(window.location.search);
      const next = { ...defaults };
      let any = false;
      for (const k of Object.keys(defaults)) {
        const v = p.get(k);
        if (v !== null && !Number.isNaN(parseFloat(v))) {
          (next as Record<string, number>)[k] = parseFloat(v);
          any = true;
        }
      }
      if (any) setState(next);
    } catch {
      /* ignore */
    }
  }, [defaults]);

  const update = (patch: Partial<T>) => {
    setState((s) => {
      const next = { ...s, ...patch };
      try {
        const p = new URLSearchParams(window.location.search);
        for (const k of Object.keys(next)) p.set(k, String((next as Record<string, number>)[k]));
        window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return [state, update, setState] as const;
}

// Copy the current (parameterized) page URL to the clipboard.
export async function copyCurrentLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}

// Copy arbitrary text (e.g. generated code) to the clipboard.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
